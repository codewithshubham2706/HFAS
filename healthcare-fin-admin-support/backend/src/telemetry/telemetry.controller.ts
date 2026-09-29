import { Body, Controller, HttpCode, Ip, Post, Req, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsEnum, IsIn, IsISO8601, IsObject, IsOptional, IsString, IsUUID, MaxLength, ValidateNested, ArrayMaxSize } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtAuthGuard, RequestUser } from '../common/guards/jwt-auth.guard'
import { TelemetryService, TelemetryEvent, IngestResult } from './telemetry.service'

class EventDto implements TelemetryEvent {
  @IsUUID() eventId!: string
  @IsString() @MaxLength(80) eventName!: string
  @IsOptional() @IsString() @MaxLength(10) schemaVersion?: string
  @IsUUID() sessionId!: string
  @IsOptional() @IsUUID() userId?: string | null
  @IsUUID() anonymousId!: string
  @IsISO8601() timestamp!: string
  @IsOptional() @IsString() @MaxLength(64) traceId?: string
  @IsObject() properties!: Record<string, unknown>
}

class IngestDto {
  @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => EventDto)
  events!: EventDto[]
}

class ReplayConsentDto {
  @IsUUID() sessionId!: string
  @IsUUID() anonymousId!: string
  @IsBoolean() granted!: boolean
  @IsEnum(['current_session', 'all_future_sessions']) scope!: 'current_session' | 'all_future_sessions'
  @IsOptional() @IsString() @MaxLength(20) consentVersion?: string
}

/**
 * POST /api/telemetry/ingest
 *
 * Auth: accepts a valid access token OR anonymous traffic (page_view before
 * login). Rate limiting (see ComplianceReport § Security): 60 req/min/IP
 * anonymous, 600 req/min/user — enforced at ALB/WAF, not app, in production.
 * Payload cap: 100 events / batch, 8KB / event properties.
 * Idempotent: duplicate eventIds are silently dropped (200 OK).
 */
@ApiTags('telemetry')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Post('ingest')
  @HttpCode(200)
  @ApiOperation({ summary: 'Batch-ingest telemetry events (≤100/batch, idempotent by eventId)' })
  async ingest(@Body() dto: IngestDto): Promise<IngestResult> {
    return this.telemetry.ingest(dto.events)
  }

  @Post('replay-consent')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Record session-replay consent (immutable ledger + event)' })
  async replayConsent(@Req() req: { user: RequestUser }, @Body() dto: ReplayConsentDto, @Ip() ip: string) {
    await this.telemetry.recordReplayConsent({
      userId: req.user.sub,
      sessionId: dto.sessionId,
      anonymousId: dto.anonymousId,
      granted: dto.granted,
      scope: dto.scope,
      consentVersion: dto.consentVersion ?? 'replay-v1.0',
      ip,
    })
    return { recorded: true }
  }
}
