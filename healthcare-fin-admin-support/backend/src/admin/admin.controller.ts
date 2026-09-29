import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard, RequestUser } from '../common/guards/jwt-auth.guard'
import { RolesGuard, Roles } from '../common/guards/roles.guard'
import { DbService } from '../db/db.service'

@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'caseworker')
@Controller('admin')
export class AdminController {
  constructor(private readonly db: DbService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Queue + workload counters for staff dashboards' })
  async overview(@Req() _req: { user: RequestUser }) {
    const byStatus = await this.db.query(
      `SELECT status, count(*)::int AS count FROM applications GROUP BY status ORDER BY status`,
    )
    const openDocs = await this.db.query(
      `SELECT count(*)::int AS count FROM documents WHERE status IN ('pending','processing')`,
    )
    const overdue = await this.db.query(
      `SELECT count(*)::int AS count FROM applications
        WHERE status = 'submitted' AND submitted_at < now() - interval '3 days'`,
    )
    return {
      applications_by_status: byStatus.rows,
      documents_in_flight: openDocs.rows[0].count,
      sla_breached: overdue.rows[0].count,
    }
  }
}
