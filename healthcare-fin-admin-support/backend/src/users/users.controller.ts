import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard, RequestUser } from '../common/guards/jwt-auth.guard'
import { UsersService, UpsertProfileDto } from './users.service'

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id/profile')
  @ApiOperation({ summary: 'Fetch own profile (admin may fetch others; audited)' })
  async getProfile(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.users.getProfile(req.user, id)
  }

  @Put(':id/profile')
  @ApiOperation({ summary: 'Create/update profile. national_id is encrypted at rest.' })
  async upsertProfile(@Req() req: { user: RequestUser }, @Param('id') id: string, @Body() dto: UpsertProfileDto) {
    return this.users.upsertProfile(req.user, id, dto)
  }
}
