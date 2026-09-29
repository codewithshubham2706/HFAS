import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { DbService } from '../db/db.service'
import { AuditService } from '../common/audit/audit.service'
import { RequestUser } from '../common/guards/jwt-auth.guard'
import { TriageService } from '../eligibility/triage.service'
import { FraudService } from '../fraud/fraud.service'
import { assessScheme } from '../eligibility/engine'
import { scoreLikelihood } from '../eligibility/likelihood'

export type CreateApplicationDto = { scheme_slug: string }
export type UpdateApplicationDto = { form_data: Record<string, unknown> }
export type ConsentDto = {
  consent_version: string
  scopes: ('insurer' | 'hospital' | 'government')[]
  esign_name: string
  esign_method?: 'typed' | 'docusign' | 'aadhaar_esign'
  document_ids?: string[]          // document-level consent pointers
  purpose?: string                 // purpose scoping (default claim_processing)
}

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly db: DbService,
    private readonly audit: AuditService,
    private readonly triage: TriageService,
    private readonly fraud: FraudService,
  ) {}

  async create(actor: RequestUser, dto: CreateApplicationDto) {
    const scheme = await this.db.query<{ id: string }>(`SELECT id FROM schemes WHERE slug = $1 AND active = true`, [dto.scheme_slug])
    if (!scheme.rows.length) throw new NotFoundException('scheme not found')

    const reference = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`
    const rows = await this.db.query<{ id: string; reference: string }>(
      `INSERT INTO applications (user_id, scheme_id, reference, status, progress_pct)
       VALUES ($1, $2, $3, 'documents', 10) RETURNING id, reference`,
      [actor.sub, scheme.rows[0].id, reference],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'application.created',
      entity: 'application', entityId: rows.rows[0].id, metadata: { scheme: dto.scheme_slug },
    })
    return rows.rows[0]
  }

  /** Prefill: merge OCR fields from the user's parsed documents + profile. */
  async getPrefill(actor: RequestUser, applicationId: string) {
    const app = await this.getOwned(actor, applicationId)
    const docs = await this.db.query<{ doc_type: string; ocr_fields: { label: string; value: string }[] | null }>(
      `SELECT doc_type, ocr_fields FROM documents
        WHERE user_id = $1 AND status = 'parsed' AND deleted_at IS NULL`,
      [app.user_id],
    )
    const fromOcr: Record<string, string> = {}
    for (const d of docs.rows) {
      for (const f of d.ocr_fields ?? []) fromOcr[f.label] = f.value
    }
    return { applicationId: app.id, prefill: fromOcr, form_data: app.form_data }
  }

  async updateForm(actor: RequestUser, applicationId: string, dto: UpdateApplicationDto) {
    const app = await this.getOwned(actor, applicationId)
    if (['submitted', 'under_review', 'approved', 'rejected', 'withdrawn'].includes(app.status)) {
      throw new BadRequestException('application already submitted — use support flow for changes')
    }

    const merged = { ...(app.form_data as Record<string, unknown>), ...dto.form_data }
    const progress = this.computeProgress(app.status, merged)
    await this.db.query(
      `UPDATE applications SET form_data = $2::jsonb, progress_pct = $3, status = $4 WHERE id = $1`,
      [applicationId, JSON.stringify(merged), progress, app.status === 'draft' ? 'details' : app.status],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'application.form.updated',
      entity: 'application', entityId: applicationId,
      metadata: { fields: Object.keys(dto.form_data) },   // keys only — values are PII
    })
    return { id: applicationId, progress_pct: progress }
  }

  /** Consent is recorded immutably BEFORE submission is accepted. */
  async recordConsent(actor: RequestUser, applicationId: string, dto: ConsentDto, ip?: string) {
    const app = await this.getOwned(actor, applicationId)
    if (!dto.scopes.length) throw new BadRequestException('at least one sharing scope is required')
    // TODO(org): pick e-sign vendor; 'docusign' writes an envelope id into metadata.
    await this.db.query(
      `INSERT INTO consent_records (user_id, application_id, consent_version, scopes, esign_name, esign_method, ip, user_agent, document_ids, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [app.user_id, applicationId, dto.consent_version, dto.scopes, dto.esign_name,
       dto.esign_method ?? 'typed', ip ?? null, null,
       dto.document_ids ?? [], dto.purpose ?? 'claim_processing'],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'application.consent.recorded',
      entity: 'application', entityId: applicationId, ip,
      metadata: { version: dto.consent_version, scopes: dto.scopes, doc_count: dto.document_ids?.length ?? 0 },
    })
    return { recorded: true }
  }

  async submit(actor: RequestUser, applicationId: string, ip?: string) {
    const app = await this.getOwned(actor, applicationId)
    if (app.status !== 'details' && app.status !== 'consent') {
      throw new BadRequestException(`cannot submit from status '${app.status}'`)
    }
    const consent = await this.db.query(
      `SELECT 1 FROM consent_records WHERE application_id = $1`, [applicationId],
    )
    if (!consent.rows.length) throw new BadRequestException('consent must be recorded before submission')

    // Fraud checks (advisory — flags, never auto-rejects).
    const amount = Number((app.form_data as Record<string, unknown>)?.['amount_inr'])
    if (Number.isFinite(amount) && amount > 0) {
      await this.fraud.checkAmount(applicationId, amount)
    }

    // Triage: compute priority before the case enters the queue.
    const triage = await this.triage.triageApplication(applicationId)

    // TODO(org): add the outbound connector here — insurer API, or
    // notification-only mode where caseworkers file manually.
    const rows = await this.db.query(
      `UPDATE applications
          SET status = 'submitted', submitted_at = now(), progress_pct = 100
        WHERE id = $1 RETURNING reference`,
      [applicationId],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'application.submitted',
      entity: 'application', entityId: applicationId, ip,
    })
    return { reference: rows.rows[0].reference, status: 'submitted' as const, priority: triage.priorityScore }
  }

  async get(actor: RequestUser, applicationId: string) {
    const app = await this.getOwned(actor, applicationId)
    const events = await this.db.query(
      `SELECT template, payload, created_at FROM notifications
        WHERE user_id = $1 AND payload->>'reference' = $2
        ORDER BY created_at ASC`,
      [app.user_id, app.reference],
    )

    // Approval-likelihood (rule-based) + open fraud flags, for transparent UX.
    const scheme = await this.db.query<{ eligibility_rules: unknown; max_amount_inr: string | null; required_docs: string[] }>(
      `SELECT eligibility_rules, max_amount_inr, required_docs FROM schemes WHERE id = $1`,
      [app.scheme_id],
    )
    const docCounts = await this.db.query<{ parsed: string }>(
      `SELECT count(*)::text AS parsed FROM documents
        WHERE application_id = $1 AND status = 'parsed' AND deleted_at IS NULL`,
      [applicationId],
    )
    const assessment = assessScheme((scheme.rows[0]?.eligibility_rules ?? []) as never[], {
      profile: (app.form_data as Record<string, unknown>) ?? {},
      onboarding: (app.form_data as Record<string, unknown>) ?? {},
    })
    const likelihood = scoreLikelihood({
      eligibilityScore: assessment.score,
      parsedDocCount: Number(docCounts.rows[0]?.parsed ?? 0),
      requiredDocCount: scheme.rows[0]?.required_docs?.length ?? 0,
      hasConsent: true, // submit gate guarantees consent
    })
    const fraud = await this.db.query(
      `SELECT kind, severity, status FROM fraud_flags WHERE application_id = $1 AND status = 'open'`,
      [applicationId],
    )

    return {
      ...app,
      timeline: events.rows,
      approval_likelihood: likelihood,
      open_fraud_flags: fraud.rows,
      priority: app.priority_score ?? null,
    }
  }

  async listMine(actor: RequestUser) {
    const rows = await this.db.query(
      `SELECT a.id, a.reference, a.status, a.progress_pct, a.submitted_at, s.name AS scheme_name
         FROM applications a JOIN schemes s ON s.id = a.scheme_id
        WHERE a.user_id = $1 ORDER BY a.created_at DESC`,
      [actor.sub],
    )
    return rows.rows
  }

  /** Admin/caseworker queue — ordered by triage priority (auto-triage). */
  async queue(actor: RequestUser, status = 'submitted') {
    if (actor.role !== 'caseworker' && actor.role !== 'admin') throw new ForbiddenException('staff only')
    const rows = await this.db.query(
      `SELECT a.id, a.reference, a.status, a.submitted_at, s.name AS scheme_name, u.id AS user_id,
              a.priority_score, a.urgency,
              (SELECT count(*)::int FROM fraud_flags f WHERE f.application_id = a.id AND f.status = 'open') AS open_flags
         FROM applications a
         JOIN schemes s ON s.id = a.scheme_id
         JOIN users u ON u.id = a.user_id
        WHERE a.status = $1
        ORDER BY a.priority_score DESC, a.submitted_at ASC NULLS LAST
        LIMIT 100`,
      [status],
    )
    return rows.rows
  }

  /** Bulk assign — caseworker throughput (ROADMAP § Bulk Actions). */
  async bulkAssign(actor: RequestUser, applicationIds: string[], caseworkerId: string) {
    if (actor.role !== 'admin' && actor.role !== 'caseworker') throw new ForbiddenException('staff only')
    const rows = await this.db.query<{ id: string }>(
      `UPDATE applications SET assigned_caseworker_id = $2, status = 'under_review'
        WHERE id = ANY($1::uuid[]) RETURNING id`,
      [applicationIds, caseworkerId],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'application.bulk_assigned',
      entity: 'application', entityId: null,
      metadata: { count: rows.rows.length, caseworker_id: caseworkerId },
    })
    return { assigned: rows.rows.length }
  }

  /** Bulk request-docs — notify N applicants about missing documents. */
  async bulkRequestDocs(actor: RequestUser, applicationIds: string[], missingDocs: string[]) {
    if (actor.role !== 'admin' && actor.role !== 'caseworker') throw new ForbiddenException('staff only')
    if (!missingDocs.length) throw new BadRequestException('missingDocs required')
    const rows = await this.db.query<{ user_id: string; reference: string }>(
      `SELECT user_id, reference FROM applications WHERE id = ANY($1::uuid[])`,
      [applicationIds],
    )
    for (const r of rows.rows) {
      await this.db.query(
        `INSERT INTO notifications (user_id, channel, template, payload)
         VALUES ($1, 'inapp', 'application.docs_requested', $2::jsonb)`,
        [r.user_id, JSON.stringify({ reference: r.reference, docs: missingDocs })],
      )
    }
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'application.bulk_docs_requested',
      entity: 'application', entityId: null,
      metadata: { count: rows.rows.length, docs: missingDocs },
    })
    return { notified: rows.rows.length }
  }

  async assign(actor: RequestUser, applicationId: string, caseworkerId: string) {
    if (actor.role !== 'admin' && actor.role !== 'caseworker') throw new ForbiddenException('staff only')
    const rows = await this.db.query(
      `UPDATE applications SET assigned_caseworker_id = $2, status = 'under_review'
        WHERE id = $1 RETURNING id`,
      [applicationId, caseworkerId],
    )
    if (!rows.rows.length) throw new NotFoundException('application not found')
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'application.assigned',
      entity: 'application', entityId: applicationId, metadata: { caseworker_id: caseworkerId },
    })
    return { id: applicationId, assignedTo: caseworkerId }
  }

  /** Decision endpoint (caseworker/admin). */
  async decide(actor: RequestUser, applicationId: string, decision: 'approved' | 'rejected', note?: string) {
    if (actor.role !== 'caseworker' && actor.role !== 'admin') throw new ForbiddenException('staff only')
    const rows = await this.db.query(
      `UPDATE applications SET status = $2, decided_at = now() WHERE id = $1 RETURNING user_id, reference`,
      [applicationId, decision],
    )
    if (!rows.rows.length) throw new NotFoundException('application not found')
    const { user_id, reference } = rows.rows[0]

    await this.db.query(
      `INSERT INTO notifications (user_id, channel, template, payload, status, sent_at)
       VALUES ($1, 'inapp', $2, $3::jsonb, 'sent', now())`,
      [user_id, `application.${decision}`, JSON.stringify({ reference, note: note ?? null })],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: `application.${decision}`,
      entity: 'application', entityId: applicationId,
    })
    return { id: applicationId, status: decision }
  }

  /** .ics calendar invite for the missing-docs deadline (SMART REMINDERS). */
  async getReminderIcs(actor: RequestUser, applicationId: string) {
    const app = await this.getOwned(actor, applicationId)
    const start = new Date(Date.now() + 3 * 86_400_000) // deadline in 3 days
    const end = new Date(start.getTime() + 30 * 60_000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HFAS//Reminders//EN',
      'BEGIN:VEVENT',
      `UID:${applicationId}@hfas`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:HFAS documents due — ${app.reference}`,
      `DESCRIPTION:Upload missing documents for application ${app.reference} at HFAS.`,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY',
      `DESCRIPTION:HFAS documents due tomorrow (${app.reference})`, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')

    return ics
  }

  // ── helpers ──────────────────────────────────────────────────
  private computeProgress(status: string, formData: Record<string, unknown>): number {
    const filled = Object.values(formData).filter((v) => v != null && v !== '').length
    const base = status === 'documents' ? 10 : 30
    return Math.min(90, base + Math.min(filled * 5, 60))
  }

  private async getOwned(actor: RequestUser, applicationId: string) {
    const rows = await this.db.query<{
      id: string; user_id: string; reference: string; status: string
      form_data: Record<string, unknown>; scheme_id: string; priority_score: number | null
    }>(`SELECT id, user_id, reference, status, form_data, scheme_id, priority_score FROM applications WHERE id = $1`, [applicationId])
    const app = rows.rows[0]
    if (!app) throw new NotFoundException('application not found')
    const isStaff = actor.role === 'caseworker' || actor.role === 'admin'
    if (actor.sub !== app.user_id && !isStaff) throw new ForbiddenException('not your application')

    // Caseworker access to citizen data is always audited.
    if (actor.sub !== app.user_id) {
      await this.audit.record({
        actorId: actor.sub, actorRole: actor.role, action: 'application.read.other',
        entity: 'application', entityId: applicationId,
      })
    }
    return app
  }
}
