# Telemetry privacy & legal checklist

> **REQUIRES LEGAL REVIEW** throughout — this file is the engineering-side
> companion to docs/ComplianceReport.md. Not legal advice.

## 1. Consent text snippets (plain language — ship as-is only after counsel)

### Session replay (shown in `ReplayConsent.tsx`)
> With your permission, we record how the screen is used — clicks and
> scrolls — to find and fix confusing steps. Personal details (ID numbers,
> bank details, phone) are always hidden before recording. You can change
> your mind anytime in Settings.

### Analytics (cookie banner, existing)
> Essential cookies keep the site working. Analytics cookies help us improve
> it. Choose what you allow.

### Proactive outreach (SMS/email) — **REQUIRES LEGAL REVIEW** (DPDP §6, GDPR ePrivacy)
> Want a reminder if your application is stuck? We can message you on SMS
> or email about **this application only**. Reply STOP to opt out anytime.

## 2. DPA checklist — telemetry & replay vendors (e.g., PostHog/Hotjar/Sentry-style)

For each vendor, fetch latest DPA + sub-processor list and verify:

| # | Clause | Why it matters | Verdict |
|---|---|---|---|
| 1 | **No model training on customer content** without explicit opt-in | replay DOM streams must never train vendor ML | **REQUIRES LEGAL REVIEW** |
| 2 | Data region pinning (India/EU) | DPDP cross-border transfer rules | **REQUIRES LEGAL REVIEW** |
| 3 | Retention configurable ≤ 30d replays / 365d raw events | must match telemetry/retention.yaml | Needs Attention |
| 4 | Sub-processor list + change-notice period | GDPR Art. 28(2) | OK (verify version) |
| 5 | Deletion API / DSAR support incl. replays | our purge pipeline calls it | Needs Attention |
| 6 | Masking happens client-side (vendor contractually cannot require raw input capture) | defense in depth | **REQUIRES LEGAL REVIEW** |
| 7 | No session-replay for EU users unless opt-in (ePrivacy) | consent mode default OFF in EU locales | **REQUIRES LEGAL REVIEW** |
| 8 | Breach notification ≤ 72h to us | GDPR Art. 33 flow-through | OK |
| 9 | Exit: full export + certified deletion within 30 days | vendor lock / DSAR completion | Needs Attention |

## 3. DSAR (data subject rights) — telemetry additions

Existing endpoints (backend `data-requests` module) extended by telemetry:

| Right | Endpoint | Telemetry behavior |
|---|---|---|
| Access | `GET /api/data-requests/export` | includes `session_metrics` rows for the user (aggregates only, no raw events, no replays) |
| Deletion | `POST /api/data-requests` kind=deletion | purge job: raw events `user_id → NULL` + anonymous linkage broken; replays deleted immediately; consent stubs retained |
| Objection / consent withdrawal | `POST /api/telemetry/replay-consent` granted=false | stops recording; deletes future captures; past replays purged within 30d window per retention.yaml |

**Engineer TODOs**
- [ ] `deletion-executor` job: add telemetry purge steps (retention.yaml `dsar_purge`)
- [ ] Export builder: append session_metrics summary
- [ ] Replay vendor: wire deletion webhook (vendor-side purge proof stored)

## 4. Non-goals / hard rules
- No raw PII in any event property (schema CI enforces shape; runtime validator rejects unknown fields)
- No screenshots/video of documents — masked client-side, blocked pages list in masking-policy.yaml
- No telemetry in the OTP entry flow (`/auth-signup` excluded from heatmaps & replay)
- LLM agent consumes aggregates only (llm-insights-agent.md guardrails)
