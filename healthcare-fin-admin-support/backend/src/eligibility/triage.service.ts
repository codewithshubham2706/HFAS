import { Injectable } from '@nestjs/common'
import { DbService } from '../db/db.service'

/**
 * Auto-triage: rule-based priority scoring for the caseworker queue.
 * (ML upgrade path: docs/ROADMAP.md § Auto-Triage.)
 *
 * Signals (max 100):
 *  +40 treatment-critical onboarding condition (cancer/cardiac/dialysis)
 *  +25 financial hardship (income ≤ ₹1,00,000)
 *  +15 scheme max-amount ≥ ₹1,50,000 (high stakes)
 *  +10 SLA pressure (submitted > 3 days ago)
 *  +10 doc completeness ≥ 3 parsed documents
 */
export type TriageInput = {
  condition?: string
  annualIncomeInr?: number
  schemeMaxAmountInr?: number
  submittedAt?: Date | null
  parsedDocCount?: number
}

export type TriageResult = {
  priorityScore: number
  urgency: 'normal' | 'treatment_critical' | 'financial_hardship' | 'deadline'
}

const CRITICAL_CONDITIONS = new Set(['cancer', 'cardiac', 'dialysis'])

export function scoreTriage(input: TriageInput): TriageResult {
  let score = 0
  let urgency: TriageResult['urgency'] = 'normal'

  if (input.condition && CRITICAL_CONDITIONS.has(input.condition)) {
    score += 40
    urgency = 'treatment_critical'
  }
  if (typeof input.annualIncomeInr === 'number' && input.annualIncomeInr <= 100000) {
    score += 25
    if (urgency === 'normal') urgency = 'financial_hardship'
  }
  if (typeof input.schemeMaxAmountInr === 'number' && input.schemeMaxAmountInr >= 150000) {
    score += 15
  }
  if (input.submittedAt && Date.now() - input.submittedAt.getTime() > 3 * 86_400_000) {
    score += 10
    if (urgency === 'normal') urgency = 'deadline'
  }
  if ((input.parsedDocCount ?? 0) >= 3) {
    score += 10
  }

  return { priorityScore: Math.min(100, score), urgency }
}

@Injectable()
export class TriageService {
  constructor(private readonly db: DbService) {}

  /** Compute and persist triage for one application (called at submit). */
  async triageApplication(applicationId: string): Promise<TriageResult> {
    const rows = await this.db.query<{
      id: string
      form_data: Record<string, unknown>
      max_amount_inr: string | null
      submitted_at: Date | null
      parsed_docs: string
    }>(
      `SELECT a.id, a.form_data, s.max_amount_inr, a.submitted_at,
              (SELECT count(*)::text FROM documents d
                WHERE d.application_id = a.id AND d.status = 'parsed') AS parsed_docs
         FROM applications a JOIN schemes s ON s.id = a.scheme_id
        WHERE a.id = $1`,
      [applicationId],
    )
    const app = rows.rows[0]
    if (!app) throw new Error('application not found')

    const result = scoreTriage({
      condition: typeof app.form_data?.['condition'] === 'string' ? (app.form_data['condition'] as string) : undefined,
      annualIncomeInr: typeof app.form_data?.['annual_income_inr'] === 'number'
        ? (app.form_data['annual_income_inr'] as number) : undefined,
      schemeMaxAmountInr: app.max_amount_inr ? Number(app.max_amount_inr) : undefined,
      submittedAt: app.submitted_at,
      parsedDocCount: Number(app.parsed_docs ?? 0),
    })

    await this.db.query(
      `UPDATE applications SET priority_score = $2, urgency = $3, triaged_at = now() WHERE id = $1`,
      [applicationId, result.priorityScore, result.urgency],
    )
    return result
  }
}
