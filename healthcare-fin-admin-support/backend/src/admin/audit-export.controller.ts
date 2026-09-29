import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { JwtAuthGuard, RequestUser } from '../common/guards/jwt-auth.guard'
import { RolesGuard, Roles } from '../common/guards/roles.guard'
import { DbService } from '../db/db.service'

/**
 * Audit trail CSV export (ADMIN & OPERATIONS: Audit Trail & Compliance).
 * CSV columns are PII-safe: actor ids, actions, entity ids — never document
 * contents or applicant names. **REQUIRES LEGAL REVIEW** if any column is added.
 */
@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/audit')
export class AuditExportController {
  constructor(private readonly db: DbService) {}

  @Get('export.csv')
  @ApiOperation({ summary: 'Export audit log as CSV (redacted, PII-safe)' })
  @ApiQuery({ name: 'days', required: false, schema: { type: 'integer', default: 90 } })
  async exportCsv(
    @Req() req: { user: RequestUser },
    @Res() res: Response,
    @Query('days') days?: string,
  ) {
    const window = Math.min(Math.max(Number(days ?? 90), 1), 365)
    const rows = await this.db.query<{
      id: string; actor_id: string | null; actor_role: string | null; action: string
      entity: string; entity_id: string | null; ip: string | null; created_at: Date
    }>(
      `SELECT id::text, actor_id::text, actor_role, action, entity, entity_id::text, host(ip) AS ip, created_at
         FROM audit_logs
        WHERE created_at > now() - make_interval(days => $1)
        ORDER BY created_at DESC LIMIT 50000`,
      [window],
    )

    // Redact IP to /24 (IPv4) — enough for audit, not identifying.
    const esc = (v: unknown) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
    }
    const lines = ['id,actor_id,actor_role,action,entity,entity_id,ip_redacted,created_at']
    for (const r of rows.rows) {
      const ip = r.ip ? `${r.ip.split('.').slice(0, 3).join('.')}.0` : ''
      lines.push([r.id, r.actor_id ?? '', r.actor_role ?? '', r.action, r.entity,
        r.entity_id ?? '', ip, r.created_at.toISOString()].map(esc).join(','))
    }

    await this.db.query(
      `INSERT INTO audit_logs (actor_id, actor_role, action, entity, metadata)
       VALUES ($1, $2, 'audit.export', 'audit_logs', $3::jsonb)`,
      [req.user.sub, req.user.role, JSON.stringify({ rows: rows.rows.length, days: window })],
    )

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="hfas-audit-${new Date().toISOString().slice(0, 10)}.csv"`)
    res.send(lines.join('\n'))
  }
}
