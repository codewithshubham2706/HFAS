import { BadGatewayException, BadRequestException, Body, Controller, Headers, HttpCode, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { DbService } from '../db/db.service'

/**
 * Inbound webhook receiver for integrations (e.g., insurer claim-status
 * callbacks). Payloads are HMAC-SHA256 signed by the sender using the
 * per-integration secret; signature travels in X-HFAS-Signature as
 * "t=<unixSeconds>,v1=<hexDigest>" over `${t}.${rawBody}`.
 * Replay window: 5 minutes.
 */
@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly db: DbService) {}

  @Post('integrations/:slug')
  @HttpCode(202)
  @ApiOperation({ summary: 'Receive signed callback from a registered integration' })
  async receive(
    @Param('slug') slug: string,
    @Headers('x-hfas-signature') signature: string | undefined,
    @Body() raw: unknown,
  ): Promise<{ accepted: boolean }> {
    const rows = await this.db.query<{ id: string; webhook_secret: string | null; active: boolean }>(
      `SELECT id, webhook_secret, active FROM integrations WHERE slug = $1`,
      [slug],
    )
    const integration = rows.rows[0]
    if (!integration?.active || !integration.webhook_secret) {
      throw new BadRequestException('unknown or inactive integration')
    }
    if (!signature) throw new BadRequestException('missing X-HFAS-Signature header')

    // NOTE: raw-body verification requires a raw-body parser at the HTTP
    // layer; with JSON-transformed bodies the digest uses stable stringify.
    // TODO(org): mount NoTransformJsonPipe for exact-byte verification.
    const rawBody = JSON.stringify(raw)
    const verified = this.verify(integration.webhook_secret, signature, rawBody)

    await this.db.query(
      `INSERT INTO webhook_deliveries (integration_id, direction, event, payload, signature_valid, status)
       VALUES ($1, 'inbound', $2, $3::jsonb, $4, $5)`,
      [integration.id, (raw as { event?: string })?.event ?? 'unknown', rawBody, verified,
       verified ? 'delivered' : 'rejected'],
    )

    if (!verified) throw new BadGatewayException('invalid signature')
    // TODO(org): dispatch event to domain handlers (e.g., claim status update).
    return { accepted: true }
  }

  private verify(secret: string, header: string, body: string): boolean {
    const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]))
    const ts = parts['t']
    const v1 = parts['v1']
    if (!ts || !v1) return false
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false   // replay window
    const expected = createHmac('sha256', secret).update(`${ts}.${body}`, 'utf8').digest('hex')
    try {
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'))
    } catch {
      return false
    }
  }
}
