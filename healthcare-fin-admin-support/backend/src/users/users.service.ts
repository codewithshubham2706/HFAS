import { Injectable, NotFoundException } from '@nestjs/common'
import { DbService } from '../db/db.service'
import { FieldCryptoService } from '../common/crypto/field-crypto.service'
import { AuditService } from '../common/audit/audit.service'
import { RequestUser } from '../common/guards/jwt-auth.guard'

export type UpsertProfileDto = {
  full_name?: string
  date_of_birth?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  national_id?: string        // SENSITIVE — encrypted at rest, never returned
  annual_income_inr?: number
  household_size?: number
  locale?: string
}

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DbService,
    private readonly crypto: FieldCryptoService,
    private readonly audit: AuditService,
  ) {}

  async getProfile(actor: RequestUser, userId: string) {
    const rows = await this.db.query(
      `SELECT p.*, u.email, u.phone_e164, u.role, u.locale
         FROM profiles p JOIN users u ON u.id = p.user_id
        WHERE p.user_id = $1 AND u.deleted_at IS NULL`,
      [userId],
    )
    if (!rows.rows.length) throw new NotFoundException('profile not found')

    // PII read — audit every time someone other than the owner views it.
    if (actor.sub !== userId) {
      await this.audit.record({
        actorId: actor.sub, actorRole: actor.role, action: 'profile.read.other',
        entity: 'profile', entityId: userId,
      })
    }
    const r = rows.rows[0]
    // national_id_enc never leaves the service; only the last4 slice is exposed.
    const { national_id_enc, ...safe } = r
    return safe
  }

  async upsertProfile(actor: RequestUser, userId: string, dto: UpsertProfileDto) {
    if (actor.sub !== userId && actor.role !== 'admin') {
      await this.audit.record({
        actorId: actor.sub, actorRole: actor.role, action: 'profile.write.other',
        entity: 'profile', entityId: userId,
      })
    }

    let nationalIdEnc: Buffer | null = null
    let nationalIdLast4: string | null = null
    if (dto.national_id) {
      nationalIdEnc = await this.crypto.encrypt(dto.national_id)
      nationalIdLast4 = dto.national_id.slice(-4)
    }

    await this.db.query(
      `INSERT INTO profiles (user_id, full_name, date_of_birth, address_line1, address_line2,
                             city, state, postal_code, national_id_enc, national_id_last4,
                             annual_income_inr, household_size)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (user_id) DO UPDATE SET
         full_name         = COALESCE(EXCLUDED.full_name, profiles.full_name),
         date_of_birth     = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
         address_line1     = COALESCE(EXCLUDED.address_line1, profiles.address_line1),
         address_line2     = COALESCE(EXCLUDED.address_line2, profiles.address_line2),
         city              = COALESCE(EXCLUDED.city, profiles.city),
         state             = COALESCE(EXCLUDED.state, profiles.state),
         postal_code       = COALESCE(EXCLUDED.postal_code, profiles.postal_code),
         national_id_enc   = COALESCE(EXCLUDED.national_id_enc, profiles.national_id_enc),
         national_id_last4 = COALESCE(EXCLUDED.national_id_last4, profiles.national_id_last4),
         annual_income_inr = COALESCE(EXCLUDED.annual_income_inr, profiles.annual_income_inr),
         household_size    = COALESCE(EXCLUDED.household_size, profiles.household_size)`,
      [userId, dto.full_name ?? null, dto.date_of_birth ?? null, dto.address_line1 ?? null,
       dto.address_line2 ?? null, dto.city ?? null, dto.state ?? null, dto.postal_code ?? null,
       nationalIdEnc, nationalIdLast4, dto.annual_income_inr ?? null, dto.household_size ?? null],
    )

    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'profile.write',
      entity: 'profile', entityId: userId,
      metadata: { fields: Object.keys(dto).filter((k) => k !== 'national_id') }, // never log the ID itself
    })
    return this.getProfile(actor, userId)
  }
}
