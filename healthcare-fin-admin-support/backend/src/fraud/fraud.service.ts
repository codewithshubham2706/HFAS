import { Injectable, Logger } from '@nestjs/common'
import { DbService } from '../db/db.service'

/**
 * Fraud / anomaly detection (rules first; ML later — ROADMAP § Fraud Detection).
 *
 * Signals implemented:
 *  1. duplicate_checksum — identical document bytes across applications/users
 *     (SHA-256 collision on checksum). Severity: high.
 *  2. amount_outlier — declared invoice amount > 3× scheme median handled as
 *     z-score placeholder: > P95 of recent amounts for the doc type. Medium.
 *
 * Flags are advisory: caseworkers dismiss or confirm. Never auto-reject.
 */
export type FraudFlag = {
  applicationId?: string | null
  documentId?: string | null
  kind: 'duplicate_checksum' | 'amount_outlier'
  severity: 'low' | 'medium' | 'high'
  detail: Record<string, unknown>
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name)

  constructor(private readonly db: DbService) {}

  /** Called after a document upload is confirmed. */
  async checkDocument(documentId: string): Promise<FraudFlag[]> {
    const flags: FraudFlag[] = []

    // 1. Duplicate checksum across different documents
    const dup = await this.db.query<{ id: string; user_id: string; checksum_sha256: string }>(
      `SELECT d.id, d.user_id, d.checksum_sha256
         FROM documents d
        WHERE d.id = $1 AND d.checksum_sha256 IS NOT NULL`,
      [documentId],
    )
    const doc = dup.rows[0]
    if (doc) {
      const others = await this.db.query<{ id: string; user_id: string; application_id: string | null }>(
        `SELECT id, user_id, application_id FROM documents
          WHERE checksum_sha256 = $2 AND id <> $1 AND deleted_at IS NULL
          LIMIT 5`,
        [doc.id, doc.checksum_sha256],
      )
      for (const other of others.rows) {
        flags.push({
          documentId: doc.id,
          kind: 'duplicate_checksum',
          severity: 'high',
          detail: {
            matches_document_id: other.id,
            same_owner: other.user_id === doc.user_id,
            application_id: other.application_id,
          },
        })
      }
    }

    await this.persist(flags)
    return flags
  }

  /** Amount outlier check, run when form data contains amount_inr. */
  async checkAmount(applicationId: string, amountInr: number): Promise<FraudFlag | null> {
    // Placeholder stats: mean/stddev over recent parsed invoice amounts
    // (TODO(org): replace with robust percentile query or ML model).
    const stats = await this.db.query<{ avg: string; stddev: string; n: string }>(
      `SELECT avg(v)::text AS avg, coalesce(stddev_pop(v), 0)::text AS stddev, count(*)::text AS n
         FROM (
           SELECT (f->>'value')::numeric AS v
             FROM documents d,
                  jsonb_array_elements(d.ocr_fields) f
            WHERE d.doc_type = 'hospital_invoice' AND d.status = 'parsed'
              AND (f->>'label') = 'amount_inr'
            ORDER BY d.created_at DESC LIMIT 200
         ) t`,
    )
    const { avg, stddev, n } = stats.rows[0]
    const count = Number(n)
    if (count < 20) return null // not enough history yet

    const mean = Number(avg)
    const sd = Number(stddev) || 1
    const z = Math.abs((amountInr - mean) / sd)
    if (z <= 3) return null

    const flag: FraudFlag = {
      applicationId,
      kind: 'amount_outlier',
      severity: 'medium',
      detail: { amount_inr_bucket: 'outlier', z: Number(z.toFixed(2)), sample_size: count },
    }
    await this.persist([flag])
    return flag
  }

  private async persist(flags: FraudFlag[]): Promise<void> {
    for (const f of flags) {
      await this.db.query(
        `INSERT INTO fraud_flags (application_id, document_id, kind, severity, detail)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [f.applicationId ?? null, f.documentId ?? null, f.kind, f.severity, JSON.stringify(f.detail)],
      )
    }
    if (flags.length) this.logger.log(`fraud flags raised: ${flags.map((f) => f.kind).join(',')}`)
  }
}
