import { Body, Controller, Get, Ip, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsArray, IsEnum, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { JwtAuthGuard, RequestUser } from '../common/guards/jwt-auth.guard'
import { ApplicationsService, ConsentDto, CreateApplicationDto, UpdateApplicationDto } from './applications.service'
import { RolesGuard, Roles } from '../common/guards/roles.guard'

class CreateBody implements CreateApplicationDto {
  @IsString() scheme_slug!: string
}

class UpdateBody implements UpdateApplicationDto {
  @IsObject() form_data!: Record<string, unknown>
}

class ConsentBody implements ConsentDto {
  @IsString() @MinLength(3) @MaxLength(20) consent_version!: string
  @IsArray() @IsEnum(['insurer', 'hospital', 'government'], { each: true }) scopes!: ConsentDto['scopes']
  @IsString() @MinLength(3) @MaxLength(200) esign_name!: string
  @IsOptional() @IsEnum(['typed', 'docusign', 'aadhaar_esign']) esign_method?: ConsentDto['esign_method']
  @IsOptional() @IsArray() document_ids?: string[]
  @IsOptional() @IsString() @MaxLength(80) purpose?: string
}

class DecideBody {
  @IsEnum(['approved', 'rejected']) decision!: 'approved' | 'rejected'
  @IsOptional() @IsString() @MaxLength(500) note?: string
}

@ApiTags('applications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly apps: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a draft application for a scheme' })
  async create(@Req() req: { user: RequestUser }, @Body() dto: CreateBody) {
    return this.apps.create(req.user, dto)
  }

  @Get('mine')
  @ApiOperation({ summary: 'List caller’s applications' })
  async mine(@Req() req: { user: RequestUser }) {
    return this.apps.listMine(req.user)
  }

  @Get(':id/prefill')
  @ApiOperation({ summary: 'Prefill payload from OCR fields + prior form data' })
  async prefill(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.apps.getPrefill(req.user, id)
  }

  @Put(':id/form')
  @ApiOperation({ summary: 'Merge form_data (partial update); recompute progress' })
  async updateForm(@Req() req: { user: RequestUser }, @Param('id') id: string, @Body() dto: UpdateBody) {
    return this.apps.updateForm(req.user, id, dto)
  }

  @Post(':id/consent')
  @ApiOperation({ summary: 'Record immutable consent (must precede submit)' })
  async consent(@Req() req: { user: RequestUser }, @Param('id') id: string, @Body() dto: ConsentBody, @Ip() ip: string) {
    return this.apps.recordConsent(req.user, id, dto, ip)
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit application (requires prior consent)' })
  async submit(@Req() req: { user: RequestUser }, @Param('id') id: string, @Ip() ip: string) {
    return this.apps.submit(req.user, id, ip)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Application detail + timeline events' })
  async get(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.apps.get(req.user, id)
  }

  // ── staff endpoints ─────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Get('queue')
  @Roles('caseworker', 'admin')
  @ApiOperation({ summary: 'Staff queue by status' })
  async queue(@Req() req: { user: RequestUser }, @Query('status') status?: string) {
    return this.apps.queue(req.user, status ?? 'submitted')
  }

  @UseGuards(RolesGuard)
  @Post(':id/assign')
  @Roles('caseworker', 'admin')
  @ApiOperation({ summary: 'Assign caseworker (moves to under_review)' })
  async assign(@Req() req: { user: RequestUser }, @Param('id') id: string, @Body() body: { caseworker_id: string }) {
    return this.apps.assign(req.user, id, body.caseworker_id)
  }

  @UseGuards(RolesGuard)
  @Post('bulk/assign')
  @Roles('caseworker', 'admin')
  @ApiOperation({ summary: 'Bulk assign caseworker (ROADMAP: bulk actions)' })
  async bulkAssign(@Req() req: { user: RequestUser }, @Body() body: { application_ids: string[]; caseworker_id: string }) {
    return this.apps.bulkAssign(req.user, body.application_ids, body.caseworker_id)
  }

  @UseGuards(RolesGuard)
  @Post('bulk/request-docs')
  @Roles('caseworker', 'admin')
  @ApiOperation({ summary: 'Bulk request missing documents from applicants' })
  async bulkRequestDocs(@Req() req: { user: RequestUser }, @Body() body: { application_ids: string[]; missing_docs: string[] }) {
    return this.apps.bulkRequestDocs(req.user, body.application_ids, body.missing_docs)
  }

  @Get(':id/reminder.ics')
  @ApiOperation({ summary: 'Calendar invite (.ics) for document deadline follow-up' })
  async reminderIcs(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.apps.getReminderIcs(req.user, id)
  }

  @UseGuards(RolesGuard)
  @Post(':id/decision')
  @Roles('caseworker', 'admin')
  @ApiOperation({ summary: 'Record approve/reject decision + notify citizen' })
  async decide(@Req() req: { user: RequestUser }, @Param('id') id: string, @Body() dto: DecideBody) {
    return this.apps.decide(req.user, id, dto.decision, dto.note)
  }
}
