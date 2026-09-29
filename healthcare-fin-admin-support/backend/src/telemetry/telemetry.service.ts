import { Injectable, Logger } from '@nestjs/common'
import { DbService } from '../db/db.service'

/**
 * Telemetry ingest pipeline.
 *
 * Path: POST /api/telemetry/ingest → validate (JSON Schema) → dedupe by
 * eventId → INSERT batch → enqueue to Kafka/SQS for downstream consumers
 * (dbt models, alerts, LLM agent).
 *
 * Local dev uses a Postgres-backed outbox (same table) — swap
 * `QueueProducer` for a Kafka/SQS client in prod (TODO(org) marker below).
 * Envelope PII policy enforced by schemas/v1/base.schema.json.
 */
export type TelemetryEvent = {
  eventId: string
  eventName: string
  schemaVersion?: string          // defaults to 'v1' at rest
  sessionId: string
  userId?: string | null
  anonymousId: string
  timestamp: string
  traceId?: string
  properties: Record<string, unknown>
}

const MAX_BATCH = 100
const KNOWN_EVENTS = new Set([
  'page_view',
  'action.start_application',
  'action.upload_attempt',
  'action.ocr_extracted',
  'action.ocr_confirmed',
  'action.field_edit',
  'action.submit_application',
  'experiment.assigned',
  'support.request_help',
  'session.replay_consent',
  'synthetic.run_result',
])

export type IngestResult = { accepted: number; rejected: { index: number; reason: string }[] }

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name)

  constructor(private readonly db: DbService) {}

  async ingest(events: TelemetryEvent[]): Promise<IngestResult> {
    if (events.length > MAX_BATCH) {
      throw new Error(`batch too large: ${events.length} > ${MAX_BATCH}`)
    }

    const rejected: IngestResult['rejected'] = []
    const valid: TelemetryEvent[] = []

    events.forEach((e, index) => {
      const err = this.validate(e)
      if (err) rejected.push({ index, reason: err })
      else valid.push(e)
    })

    if (valid.length) {
      // Multi-row insert in one statement (single round-trip).
      const values: unknown[] = []
      const tuples = valid.map((e, i) => {
        const b = i * 8
        values.push(
          e.eventId, e.eventName, e.schemaVersion ?? 'v1', e.sessionId,
          e.userId ?? null, e.anonymousId, e.timestamp, JSON.stringify(e.properties ?? {}),
        )
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8}::jsonb)`
      })
      await this.db.query(
        `INSERT INTO telemetry_events
           (event_id, event_name, schema_version, session_id, user_id, anonymous_id, ts, props)
         VALUES ${tuples.join(',')}
         ON CONFLICT (event_id) DO NOTHING`,
        values,
      )
      await this.enqueue(valid)
    }

    return { accepted: valid.length, rejected }
  }

  /** Minimal server-side gate; full JSON-Schema validation runs in CI (telemetry/CI.md). */
  private validate(e: TelemetryEvent): string | null {
    if (!KNOWN_EVENTS.has(e.eventName)) return `unknown eventName '${e.eventName}'`
    if (!/^[0-9a-f-]{36}$/i.test(e.eventId ?? '')) return 'eventId must be a uuid'
    if (!/^[0-9a-f-]{36}$/i.test(e.sessionId ?? '')) return 'sessionId must be a uuid'
    if (!/^[0-9a-f-]{36}$/i.test(e.anonymousId ?? '')) return 'anonymousId must be a uuid'
    if (Number.isNaN(Date.parse(e.timestamp))) return 'timestamp must be ISO-8601'
    if (typeof e.properties !== 'object' || e.properties === null) return 'properties must be an object'
    if (JSON.stringify(e.properties).length > 8000) return 'properties too large (>8KB)'
    return null
  }

  /**
   * Enqueue to stream platform. Local: no-op (db is the sink).
   * **REQUIRES LEGAL REVIEW**: confirm queue region + retention match
   * telemetry/retention.yaml before pointing at a cloud queue.
   */
  private async enqueue(events: TelemetryEvent[]): Promise<void> {
    if (process.env.TELEMETRY_QUEUE_URL) {
      // TODO(org): wire Kafka (kafkajs) or SQS (@aws-sdk/client-sqs) here:
      //   await producer.send({ topic: 'hfas.telemetry.v1', messages: … })
      this.logger.warn(`TELEMETRY_QUEUE_URL set but producer not wired — ${events.length} events only in Postgres`)
    }
  }

  /** Replay consent writes the immutable ledger row + echoes an event. */
  async recordReplayConsent(params: {
    userId: string; sessionId: string; anonymousId: string; traceId?: string
    granted: boolean; scope: 'current_session' | 'all_future_sessions'; consentVersion: string; ip?: string
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO consent_records (user_id, consent_version, scopes, esign_name, esign_method, replay_granted, replay_scope, ip)
       VALUES ($1, $2, '{}', $3, 'typed', $4, $5, $6)`,
      [params.userId, params.consentVersion, 'replay-consent', params.granted, params.scope, params.ip ?? null],
    )
    await this.ingest([{
      eventId: crypto.randomUUID(),
      eventName: 'session.replay_consent',
      schemaVersion: 'v1',
      sessionId: params.sessionId,
      userId: params.userId,
      anonymousId: params.anonymousId,
      timestamp: new Date().toISOString(),
      traceId: params.traceId,
      properties: { granted: params.granted, consentVersion: params.consentVersion, scope: params.scope, maskingProfile: 'strict' },
    }])
  }
}
