import { Injectable, Logger } from '@nestjs/common'
import { DbService } from '../../db/db.service'

export type AuditEvent = {
  actorId?: string | null
  actorRole?: string | null
  action: string            // 'document.read' | 'application.write' | 'auth.otp.sent' …
  entity: string            // 'document' | 'application' | 'user' …
  entityId?: string | null
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> // NEVER include PII values here
}

/**
 * Audit trail writer. Append-only by DB trigger (see 001_create_tables.sql);
 * this service only inserts. Called from guards/interceptors around any
 * read/write of PII entities.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(private readonly db: DbService) {}

  async record(evt: AuditEvent): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO audit_logs (actor_id, actor_role, action, entity, entity_id, ip, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [evt.actorId ?? null, evt.actorRole ?? null, evt.action, evt.entity, evt.entityId ?? null,
         evt.ip ?? null, evt.userAgent ?? null, JSON.stringify(evt.metadata ?? {})],
      )
    } catch (err) {
      // Audit failures must not break the request, but must be visible.
      this.logger.error(`audit write failed for ${evt.action}: ${String(err)}`)
    }
  }
}
