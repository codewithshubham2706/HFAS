# Advanced features — spec (non-redundant set)

Each feature: rationale → instrumentation key → effort → KPI → build notes.
Features marked ⚖️ need legal sign-off before enabling.

## 1. Adaptive micro-interventions
**Rationale:** when `intent_score ≥ 60 && effort_score ≥ 60`, show field-level help or offer a callback instead of letting the user struggle silently.
**Instrument:** `intervention.shown` / `intervention.clicked` / `intervention.outcome` (resolved|abandoned).
**Effort:** Medium. **KPI:** HIHF→submit conversion; support ticket deflection.
**Build:** nightly job writes HIHF audience (`high_intent_high_friction` model) → frontend rule reads a flag (no scores client-side) → `HelpTip`/callback CTA variant. A/B via `ocr_verify_gate`-style assignment.

## 2. Predictive caseworker routing
**Rationale:** route each submitted application to the caseworker with the best approval rate for that scheme type and the lowest open load.
**Instrument:** `routing.decision` (caseworker_id hashed + scores used) / `routing.outcome` (approved|rejected|elapsed).
**Effort:** Medium. **KPI:** time-to-first-review; approval-rate parity across workers.
**Build:** extend `bulkAssign` selection logic; expose scoring SQL (`approval_rate × load_penalty`); admin override stays manual.

## 3. Adaptive Form Simplifier
**Rationale:** hide fields that never change outcomes for a profile (e.g., insurer details when scheme is government-only) — shorter forms, same decisions.
**Instrument:** `form.variant_shown` / `field.hidden_by_variant` (field name + variant only).
**Effort:** Medium. **KPI:** form completion rate; field-edit rate on hidden→revealed fields.
**Build:** variant assignment per profile; hidden fields excluded from validation; reveal on backfill. Experiment-gated.

## 4. Privacy-preserving cohort modeling (DP aggregates) ⚖️
**Rationale:** report scheme-funnel stats for sensitive groups without exposing small cohorts.
**Instrument:** `dp.aggregate_job` (job id, epsilon, noise added — no rows).
**Effort:** High. **KPI:** partner dashboard adoption with zero re-identification incidents.
**Build:** k-anonymity threshold (min cohort size 20) + Laplace noise on counts; **REQUIRES LEGAL REVIEW** of epsilon choice and DP guarantee claims.

## 5. Federated OCR improvement pipeline ⚖️
**Rationale:** improve OCR accuracy using user *edits* (label pairs) without exporting raw documents.
**Instrument:** `ocr.edit_label` (hashed docId, field name, confidence — never values).
**Effort:** High. **KPI:** OCR auto-accept ratio trend; low-tier (red) share decline.
**Build:** accepted/edit diffs become (predicted, corrected) pairs keyed by salted hash; periodic batch to model trainer; **REQUIRES LEGAL REVIEW** — confirm edit data isn't personal data in context.

## 6. Explainability module for model-driven advice
**Rationale:** every score shown to users/caseworkers (approval likelihood, priority) displays its top factors — trust + appealability.
**Instrument:** `model.explain` (score key, factor list, version) — already partially built in `likelihood.ts` factors.
**Effort:** Medium. **KPI:** "why" expansion rate; dispute rate on decisions.
**Build:** UI component renders factors from the existing `approval_likelihood.factors`; log factor versions for auditability.

## 7. Proactive outreach automations ⚖️
**Rationale:** HIHF users get one nudge (SMS/email) referencing their stuck step — recovered applications without manual casework.
**Instrument:** `outreach.sent` / `outreach.clicked` / `outreach.conversion` (submitted within 7d).
**Effort:** Low–Medium. **KPI:** recovered HIHF share; opt-out rate (must stay <1%).
**Build:** notification outbox templates + scheduler; frequency cap 1/week/user; consent required per telemetry-privacy.md §1 — **REQUIRES LEGAL REVIEW** (DLT templates).

## 8. Cost-aware OCR sampling
**Rationale:** full OCR only where it matters — low-value or duplicate-risk claims get cheap template checks; high-value get full pipeline.
**Instrument:** `ocr.sampling_decision` (full|template_only, reason) / `ocr.cost_saved` (count).
**Effort:** Low. **KPI:** OCR cost/claim; no regression in auto-accept ratio.
**Build:** decision gate in `documents.service.processOcr` before provider call; fallback to full OCR on user request (accessibility rule — never block manual entry).

## 9. Trust provenance chips on scheme cards
**Rationale:** "Verified · Source: State portal" chips on results cards reduce skepticism and abandoned starts.
**Instrument:** `scheme_card.viewed` / `scheme_card.applied` (with chip variant).
**Effort:** Low. **KPI:** results→start conversion by chip presence.
**Build:** `schemes.verified_source` column + chip component; A/B against no-chip.

## 10. Auto-package generator for caseworkers
**Rationale:** one click builds the insurer-ready PDF bundle (application + docs + cover letter) — removes hospital trips and manual assembly.
**Instrument:** `package.generated` / `package.sent` (bundle hash, page count).
**Effort:** Medium. **KPI:** caseworker minutes/claim; connector submission share.
**Build:** PDF assembly service (pdf-lib) + per-provider cover-letter templates stored in `integrations.config`; signed-URL delivery.

## Sequencing (fits 12-week roadmap)
Weeks 6–8: #1, #8, #9 (quick wins on top of alerts/metrics).
Weeks 8–10: #2, #6, #10 (caseworker efficiency cluster).
Weeks 10–12: #3, #7 (experiment-gated, consent-dependent).
Later/quarter-boundary: #4, #5 (high effort, legal review gates).
