import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard, RequestUser } from '../common/guards/jwt-auth.guard'
import { DbService } from '../db/db.service'

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly db: DbService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Caller’s notifications (timeline feed)' })
  async mine(@Req() req: { user: RequestUser }) {
    const rows = await this.db.query(
      `SELECT id, channel, template, payload, status, created_at, sent_at
         FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user.sub],
    )
    return rows.rows
  }
}
