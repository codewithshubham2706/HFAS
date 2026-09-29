import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator'
import { JwtAuthGuard, RequestUser } from '../common/guards/jwt-auth.guard'
import { RolesGuard, Roles } from '../common/guards/roles.guard'
import { DataRequestsService, CreateRequestDto } from './data-requests.service'

class RequestBody implements CreateRequestDto {
  @IsEnum(['access', 'correction', 'deletion']) kind!: CreateRequestDto['kind']
  @IsOptional() @IsObject() requested_changes?: Record<string, string>
  @IsOptional() @IsString() @MaxLength(1000) reason?: string
}

class ReviewBody {
  @IsEnum(['approved', 'rejected']) decision!: 'approved' | 'rejected'
  @IsOptional() @IsString() @MaxLength(1000) note?: string
}

@ApiTags('data-requests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('data-requests')
export class DataRequestsController {
  constructor(private readonly svc: DataRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'File an access / correction / deletion request (GDPR & DPDP)' })
  async create(@Req() req: { user: RequestUser }, @Body() dto: RequestBody) {
    return this.svc.create(req.user, dto)
  }

  @Get('export')
  @ApiOperation({ summary: 'Immediate machine-readable export of all held data' })
  async export(@Req() req: { user: RequestUser }) {
    return this.svc.exportAll(req.user)
  }

  // ── admin ────────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Get('open')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: open requests queue' })
  async open(@Req() req: { user: RequestUser }) {
    return this.svc.openRequests(req.user)
  }

  @UseGuards(RolesGuard)
  @Post(':id/review')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: approve/reject; approved deletions start the purge pipeline' })
  async review(@Req() req: { user: RequestUser }, @Param('id') id: string, @Body() dto: ReviewBody) {
    return this.svc.review(req.user, id, dto.decision, dto.note)
  }
}
