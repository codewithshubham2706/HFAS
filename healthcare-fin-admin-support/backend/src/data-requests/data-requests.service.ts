import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { DbService } from '../db/db.service'
import { AuditService } from '../common/audit/audit.service'
import { RequestUser } from '../common/guards/jwt-auth.guard'

export type CreateRequestDto = {
  kind: 'access' | 'correction' | 'deletion'
  requested_changes?: Record<string, string>
  reason?: string
}

/**
 * Data subject rights (GDPR Art. 15–17, India DPDP equivalent).
 * Flow: user files request → staff reviews (admin) → executor runs.
 * Deletion uses a 30-day grace period (see infra/retention.yaml).
 */
@Injectable()
export class DataRequestsService {
  constructor(
    private readonly db: DbService,
    private readonly audit: AuditService,
  ) {}

  async create(actor: RequestUser, dto: CreateRequestDto) {
    if (dto.kind === 'correction' && !Object.keys(dto.requested_changes ?? {}).length) {
      throw new BadRequestException('correction requires requested_changes')
    }
    const open = await this.db.query(
      `SELECT 1 FROM deletion_requests WHERE user_id = $1 AND kind = $2 AND status IN ('received','in_review')`,
      [actor.sub, dto.kind],
    )
    if (open.rows.length) throw new BadRequestException('an identical request is already open')

    const rows = await this.db.query<{ id: string }>(
      `INSERT INTO deletion_requests (user_id, kind, requested_changes)
       VALUES ($1, $2, $3::jsonb) RETURNING id`,
      [actor.sub, dto.kind, JSON.stringify(dto.requested_changes ?? {})],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role,
      action: `datarequest.${dto.kind}.created`, entity: 'deletion_request', entityId: rows.rows[0].id,
    })
    return { id: rows.rows[0].id, kind: dto.kind, status: 'received' as const }
  }

  /** Access export: everything we hold, machine-readable. */
  async exportAll(actor: RequestUser) {
    const profile = await this.db.query(
      `SELECT p.*, u.email, u.phone_e164, u.role, u.locale, u.created_at
         FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = $1`,
      [actor.sub],
    )
    const apps = await this.db.query(
      `SELECT a.reference, a.status, a.progress_pct, a.form_data, a.submitted_at, s.name AS scheme
         FROM applications a JOIN schemes s ON s.id = a.scheme_id WHERE a.user_id = $1`,
      [actor.sub],
    )
    const docs = await this.db.query(
      `SELECT doc_type, status, original_name, byte_size, created_at FROM documents
        WHERE user_id = $1 AND deleted_at IS NULL`,
      [actor.sub],
    )
    const consents = await this.db.query(
      `SELECT consent_version, scopes, esign_method, signed_at FROM consent_records WHERE user_id = $1`,
      [actor.sub],
    )
    const notifications = await this.db.query(
      `SELECT template, payload, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [actor.sub],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'datarequest.access.exported', entity: 'user', entityId: actor.sub,
    })
    return {
      exported_at: new Date().toISOString(),
      profile: profile.rows[0] ?? null,      // national_id_enc excluded by column list
      applications: apps.rows,
      documents: docs.rows,
      consents: consents.rows,
      notifications: notifications.rows,
    }
  }

  async review(actor: RequestUser, requestId: string, decision: 'approved' | 'rejected', note?: string) {
    if (actor.role !== 'admin') throw new ForbiddenException('admin only')
    const rows = await this.db.query<{ id: string; user_id: string; kind: string }>(
      `UPDATE deletion_requests SET status = $2, reviewed_by = $3, reviewed_at = now(), admin_note = $4
        WHERE id = $1 AND status IN ('received','in_review')
        RETURNING id, user_id, kind`,
      [requestId, decision, actor.sub, note ?? null],
    )
    const req = rows.rows[0]
    if (!req) throw new NotFoundException('request not found or already reviewed')

    if (decision === 'approved' && req.kind === 'deletion') {
      // Mark account; the deletion-executor job completes the purge after
      // the grace period (infra/retention.yaml).
      await this.db.query(
        `UPDATE users SET status = 'deletion_pending' WHERE id = $1`,
        [req.user_id],
      )
    }
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role,
      action: `datarequest.${req.kind}.${decision}`, entity: 'deletion_request', entityId: requestId,
    })
    return { id: requestId, status: decision }
  }

  /** Admin queue of open requests. */
  async openRequests(actor: RequestUser) {
    if (actor.role !== 'admin') throw new ForbiddenException('admin only')
    const rows = await this.db.query(
      `SELECT r.id, r.kind, r.status, r.created_at, r.requested_changes, u.email
         FROM deletion_requests r JOIN users u ON u.id = r.user_id
        WHERE r.status IN ('received','in_review') ORDER BY r.created_at ASC`,
    )
    return rows.rows
  }
}
