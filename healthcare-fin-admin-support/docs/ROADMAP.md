# ROADMAP.md — idea backlog → build status

Legend: ✅ **built in this repo** · 🟡 partial (foundation laid) · 🔜 planned
(phase in README § Phased plan) · ⚖️ needs partner/legal work first.

## User-facing

| Idea | Status | Where / notes |
|---|---|---|
| Smart Document Prefill & Confidence Scores | ✅ | `OcrFieldRow` tiers (green ≥90 / orange 70–89 / red <70); red requires Verify before Accept. KPI hook: field accept rates. |
| Guided Appeals Wizard | 🔜 P2 | Needs appeal templates + doc assembly; timeline data already in place (`applications/:id`). |
| One-Click Hospital Submission | ⚖️ P2 | PDF generator + per-provider templates; needs provider template approval. `TODO(org)` connector layer. |
| Live Caseworker Collaboration | 🔜 P2 | Websockets + presence; role model & audit already support it. |
| Multimodal Intake (Voice/SMS/Camera) | ⚖️ P1 | Twilio stubs exist (`notifications.service`); DLT registration **REQUIRES LEGAL REVIEW** before SMS intake. |
| In-Page Micro-Help & Localized Tooltips | ✅ | `HelpTip` + `help.*` i18n keys; wired into name/DOB/policy/dropzone. |
| Case-Level Timeline + Filters | ✅ | `applications/:id` returns timeline; UI timeline in prototype (filter chips on page 12). |

## Admin & operations

| Idea | Status | Where / notes |
|---|---|---|
| Auto-Triage & Priority Queueing | ✅ | `triage.service.ts` — rule score 0–100 + urgency; queue ordered by priority. Unit-tested. ML upgrade path noted. |
| Agent-Assisted Intake App (offline-first) | 🔜 P3 | PWA + SQLite sync; needs field-agent program design. |
| Bulk Actions & Templates | ✅ | `POST /applications/bulk/assign`, `POST /applications/bulk/request-docs`. |
| Audit Trail & Compliance Reports | ✅ | `GET /admin/audit/export.csv` — redacted IPs, export event itself audited. |

## Integrations & ecosystem

| Idea | Status | Where / notes |
|---|---|---|
| Insurer/Govt Connectors | ⚖️ P1 | Adapter layer sketched (`integrations` table, HMAC webhooks); partner APIs + contracts required. |
| EMR/FHIR Integration | ⚖️ P3 | High effort; hospital BAAs + consent scoping first. |
| Payment Reconciliation | 🔜 P2 | `fraud_flags`/timeline give hooks; needs payout webhooks. |
| Assistance Marketplace | 🔜 P3 | Partner onboarding + fund-flow compliance **REQUIRES LEGAL REVIEW**. |

## Data, ML & intelligence

| Idea | Status | Where / notes |
|---|---|---|
| Approval Probability Scorer | ✅ (rule-based) | `likelihood.ts` — 0–100 + factors; exposed on `GET /applications/:id`. ML swap-in later. |
| Auto-Categorization & Doc Tagging | 🟡 | `doc_type` enum + OCR text stored; classifier slot in OCR adapter. |
| Fraud Detection / Anomaly Alerts | ✅ (rules) | `fraud.service.ts` — duplicate checksum (high), amount outlier z>3 (medium); surfaced on queue + application detail. |
| Personalization Engine | 🟡 | Match score already ranks results; A/B framework later. |

## UX & accessibility

| Idea | Status | Where / notes |
|---|---|---|
| Progressive Disclosure & Autosave | ✅ | Wizard one-question-per-step; `PUT /applications/:id/form` partial saves. |
| Language & Cultural Adaptation | ✅ (en/es) | i18n bundles both apps; more locales = add JSON. |
| Accessibility Mode | ✅ | `AccessibilityToggle` → `data-a11y` (18px base, stronger contrast, thicker focus). Persists. |
| Smart Reminders & Scheduling | ✅ (ics) | `GET /applications/:id/reminder.ics` + notifications outbox; scheduler sweep in place. |

## Monetization

| Idea | Status | Where / notes |
|---|---|---|
| Freemium / Premium caseworker | 🔜 P3 | Entitlements column + Stripe; **REQUIRES LEGAL REVIEW** (consumer terms). |
| Grant & Partner Fees (B2B) | 🔜 P2 | Partner dashboard rides on admin module; SSO later. |
| Microinsurance Partnerships | ⚖️ | Insurance distribution licenses — **REQUIRES LEGAL REVIEW** before any build. |

## Security, legal & trust

| Idea | Status | Where / notes |
|---|---|---|
| Data Residency Config | 🟡 | Region pinned in infra notes; multi-region tenant routing = P2. |
| Consent Record Versioning | ✅ | `consent_records` immutable + `document_ids[]` + `purpose` scoping (migration 002). |
| Legal Aid / Referral | 🔜 P2 | Referral entity + partner network; low legal risk. |

## KPI instrumentation hookpoints

- Field-correction rate → OCR accept/edit events (audit `document.ocr.completed` + UI telemetry)
- Appeal success rate → future `appeals` entity (P2)
- Hospital-visit reduction → connector submission counts
- Time-to-resolution → `applications.submitted_at → decided_at` (queryable today)
- SLA adherence → `sla_breached` counter in `GET /admin/overview`
- aXe score → CI a11y step (add axe to Cypress skeleton)
