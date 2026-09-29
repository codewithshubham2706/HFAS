import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { randomBytes, randomInt } from 'node:crypto'
import { DbService } from '../db/db.service'
import { AuditService } from '../common/audit/audit.service'
import { FieldCryptoService } from '../common/crypto/field-crypto.service'
import { RequestOtpDto, SignupDto, VerifyOtpDto } from './dto'

export type Tokens = { accessToken: string; refreshToken: string }

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly db: DbService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly fieldCrypto: FieldCryptoService,
  ) {}

  /** Issue a 6-digit OTP, store only its hash, return it in dev mode ONLY. */
  async requestOtp(dto: RequestOtpDto, ip?: string): Promise<{ sent: boolean; devOtp?: string }> {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const expires = new Date(Date.now() + Number(process.env.OTP_TTL_SECONDS ?? 300) * 1000)

    // Auto-provision the user row on first OTP (status pending until verified).
    const user = await this.db.query<{ id: string }>(
      `INSERT INTO users (phone_e164, email, status, locale)
       VALUES (CASE WHEN $2 = 'sms' THEN $1 END, CASE WHEN $2 = 'email' THEN $1 END, 'pending', 'en-IN')
       RETURNING id`,
      [dto.destination, dto.channel],
    )
    const userId = user.rows[0]?.id
    if (!userId) throw new BadRequestException('invalid destination')

    await this.db.query(
      `INSERT INTO otp_codes (user_id, channel, destination, code_hash, expires_at, created_ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, dto.channel, dto.destination, FieldCryptoService.hashToken(code), expires, ip ?? null],
    )

    await this.audit.record({
      actorId: userId, action: 'auth.otp.sent', entity: 'user', entityId: userId, ip,
      metadata: { channel: dto.channel },
    })

    // TODO(org): replace stub with SMS/email provider (Twilio/SendGrid).
    if (process.env.OTP_DEV_MODE === 'true') {
      this.logger.warn(`DEV OTP for ${dto.destination}: ${code} (never enable in production)`)
      return { sent: true, devOtp: code }
    }
    return { sent: true }
  }

  async verifyOtp(dto: VerifyOtpDto, ip?: string): Promise<Tokens & { userId: string; isNewUser: boolean }> {
    const row = await this.db.query<{ id: string; attempts: number; expires_at: Date; consumed_at: Date | null }>(
      `SELECT o.id, o.attempts, o.expires_at, o.consumed_at
         FROM otp_codes o
         JOIN users u ON u.id = o.user_id
        WHERE (CASE WHEN $2 = 'sms' THEN u.phone_e164 = $1 ELSE u.email = $1 END)
          AND o.channel = $2 AND o.consumed_at IS NULL
        ORDER BY o.created_at DESC LIMIT 1`,
      [dto.destination, dto.channel],
    )
    const otp = row.rows[0]
    if (!otp) throw new UnauthorizedException('no pending OTP for this destination')
    if (otp.consumed_at) throw new UnauthorizedException('OTP already used')
    if (new Date(otp.expires_at) < new Date()) throw new UnauthorizedException('OTP expired')
    if (otp.attempts >= Number(process.env.OTP_MAX_ATTEMPTS ?? 5)) {
      throw new UnauthorizedException('too many attempts — request a new OTP')
    }

    const hash = FieldCryptoService.hashToken(dto.code)
    const ok = await this.db.query(
      `UPDATE otp_codes SET attempts = attempts + 1, consumed_at = now()
        WHERE id = $1 AND code_hash = $2 AND consumed_at IS NULL
        RETURNING user_id`,
      [otp.id, hash],
    )
    if (!ok.rows.length) throw new UnauthorizedException('incorrect code')

    const userId = ok.rows[0].user_id as string
    await this.db.query(`UPDATE users SET status = 'active' WHERE id = $1 AND status = 'pending'`, [userId])
    await this.audit.record({ actorId: userId, action: 'auth.otp.verified', entity: 'user', entityId: userId, ip })

    const isNew = await this.isNewUser(userId)
    return { ...(await this.issueTokens(userId)), userId, isNewUser: isNew }
  }

  async signup(dto: SignupDto, ip?: string): Promise<Tokens & { userId: string }> {
    if (!dto.email && !dto.phone) throw new BadRequestException('email or phone required')
    if (dto.password) {
      // Lightweight password policy (length enforced by DTO); orgs may add zxcvbn.
      // TODO(org): add breach-password screening (k-anonymity HIBP API).
    }

    const existing = await this.db.query(
      `SELECT id FROM users WHERE ($1::text IS NOT NULL AND email = $1) OR ($2::text IS NOT NULL AND phone_e164 = $2)`,
      [dto.email ?? null, dto.phone ?? null],
    )
    if (existing.rows.length) throw new ConflictException('account already exists — use login')

    const hash = dto.password ? FieldCryptoService.hashPassword(dto.password) : null
    const inserted = await this.db.query<{ id: string }>(
      `INSERT INTO users (email, phone_e164, password_hash, role, status, locale)
       VALUES ($1, $2, $3, COALESCE($4, 'patient'), 'active', COALESCE($5, 'en-IN'))
       RETURNING id`,
      [dto.email ?? null, dto.phone ?? null, hash, dto.role ?? null, dto.locale ?? null],
    )
    const userId = inserted.rows[0].id
    await this.audit.record({ actorId: userId, action: 'auth.signup', entity: 'user', entityId: userId, ip })
    return { ...(await this.issueTokens(userId)), userId }
  }

  async login(email: string, password: string, ip?: string): Promise<Tokens & { userId: string }> {
    const row = await this.db.query<{ id: string; password_hash: string | null; status: string }>(
      `SELECT id, password_hash, status FROM users WHERE email = $1`,
      [email],
    )
    const user = row.rows[0]
    // Uniform error — do not reveal whether the email exists.
    if (!user?.password_hash || user.status !== 'active' ||
        !FieldCryptoService.verifyPassword(password, user.password_hash)) {
      throw new UnauthorizedException('invalid credentials')
    }
    await this.audit.record({ actorId: user.id, action: 'auth.login', entity: 'user', entityId: user.id, ip })
    return { ...(await this.issueTokens(user.id)), userId: user.id }
  }

  async refresh(refreshToken: string, ip?: string): Promise<Tokens> {
    const hash = FieldCryptoService.hashToken(refreshToken)
    const row = await this.db.query<{ id: string; user_id: string; expires_at: Date; revoked_at: Date | null }>(
      `SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`,
      [hash],
    )
    const rt = row.rows[0]
    if (!rt || rt.revoked_at || new Date(rt.expires_at) < new Date()) {
      throw new UnauthorizedException('refresh token invalid')
    }
    // Rotation: revoke old, issue new pair.
    await this.db.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`, [rt.id])
    return this.issueTokens(rt.user_id)
  }

  async logout(refreshToken: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
      [FieldCryptoService.hashToken(refreshToken)],
    )
  }

  // ── helpers ──────────────────────────────────────────────────
  private async isNewUser(userId: string): Promise<boolean> {
    const prof = await this.db.query(`SELECT 1 FROM profiles WHERE user_id = $1`, [userId])
    return prof.rows.length === 0
  }

  private async issueTokens(userId: string): Promise<Tokens> {
    const user = await this.db.query<{ role: string; locale: string }>(
      `SELECT role, locale FROM users WHERE id = $1`, [userId],
    )
    const payload = { sub: userId, role: user.rows[0].role, locale: user.rows[0].locale }

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: Number(process.env.JWT_ACCESS_TTL ?? 900),
    })

    const refreshToken = randomBytes(48).toString('base64url')
    await this.db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + make_interval(secs => $3))`,
      [userId, FieldCryptoService.hashToken(refreshToken), Number(process.env.JWT_REFRESH_TTL ?? 2592000)],
    )
    return { accessToken, refreshToken }
  }
}
