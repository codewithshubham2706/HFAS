# HFAS — Healthcare Financial & Administrative Support

Production-capable monorepo: Next.js (TS) frontend · NestJS (TS) REST API ·
PostgreSQL · S3-compatible storage · pluggable OCR · OTP/JWT auth ·
eligibility rule engine · consent ledger · data-subject rights.

> **All documents under `docs/` are drafts — REQUIRES LEGAL REVIEW** before
> production use (India DPDP, EU GDPR, US state laws / HIPAA if applicable).

## Architecture

```
┌──────────────┐  HTTPS   ┌───────────────┐  SQL   ┌──────────────┐
│  Next.js web │ ───────▶ │  NestJS API   │ ─────▶ │  PostgreSQL  │
│  (PWA-ready) │ ◀─────── │  :4000        │ ◀───── │  15 (PG)     │
└──────┬───────┘  JSON    └──┬─────┬──────┘        └──────────────┘
       │            presigned│     │ audit (append-only)
       │              PUT    │     ▼
       └────────────▶┌──────────────┐   OCR adapter (mock | Google Vision)
                     │ S3 / MinIO   │   Notifications outbox (SMS/email stubs)
                     │ documents    │   Webhooks (HMAC-signed integrations)
                     └──────────────┘
```

Key flows:
- **Upload**: client asks API for a presigned `PUT` → uploads straight to S3 →
  confirms SHA-256 → API runs OCR (worker in prod) → fields feed form prefill.
- **Eligibility**: JSON rule DSL stored per scheme (`schemes.eligibility_rules`),
  evaluated by `backend/src/eligibility/engine.ts` with score + human "why".
- **Consent**: immutable `consent_records` ledger written *before* submit;
  submission is rejected without it.
- **Data rights**: access (instant export), correction, deletion (30-day grace,
  admin-approved purge pipeline).

## Quickstart (local)

```bash
bash scripts/setup_local.sh        # env + docker compose + verify seed
# or manually:
cp .env.example .env
docker compose up --build          # db + minio + api + web
```

- Web: http://localhost:3000 · API: http://localhost:4000 · Swagger: /docs
- MinIO console: http://localhost:9001 (`hfas` / `hfas-secret-123`)
- Demo logins (dev only): `sunita@demo.hfas` / `arjun@demo.hfas` /
  `admin@demo.hfas` — password `hfas-Demo-2026!`. With `OTP_DEV_MODE=true`
  OTPs are returned in API responses (NEVER in production).

## Repository layout

```
healthcare-fin-admin-support/
├─ .github/workflows/ci.yml     # lint · typecheck · tests · SCA · build · deploy skeleton
├─ backend/                     # NestJS: auth, users, schemes, eligibility,
│                               # documents (+OCR), applications, notifications,
│                               # webhooks, data-requests, admin · migrations · openapi
├─ frontend/                    # Next.js pages (landing, signup, wizard, application,
│                               # settings) · components · i18n en/es · theme tokens
├─ scripts/                     # seed_data.sql · setup_local.sh · check_licenses.mjs
├─ infra/                       # terraform notes · retention.yaml (purge policy)
├─ design/                      # FIGMA_PROMPT.md · components.md · ASSET_LICENSES.md
└─ docs/                        # PrivacyPolicy · Terms · CookiePolicy · ConsentForm ·
                                # ComplianceReport   (**REQUIRES LEGAL REVIEW**)
```

## API examples (curl)

```bash
# OTP signup flow (dev returns the code)
curl -s localhost:4000/api/auth/request-otp -H 'Content-Type: application/json' \
  -d '{"destination":"+919876543210","channel":"sms"}'
# → {"sent":true,"devOtp":"482913"}

curl -s localhost:4000/api/auth/verify-otp -H 'Content-Type: application/json' \
  -d '{"destination":"+919876543210","code":"482913","channel":"sms"}'
# → {"accessToken":"…","refreshToken":"…",…}

TOKEN=…  # from above

# Eligibility
curl -s localhost:4000/api/eligibility/assess -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"profile":{"annual_income_inr":240000},"onboarding":{"condition":"cardiac","facility_type":"govt"}}'

# Upload (3 steps)
curl -s localhost:4000/api/documents/upload -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"doc_type":"aadhaar","content_type":"image/png","byte_size":204800}'
# → PUT the file bytes to uploadUrl, then:
curl -s localhost:4000/api/documents/$DOC/confirm -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"checksum_sha256\":\"$(sha256sum doc.png | cut -d' ' -f1)\"}"
curl -s -X POST localhost:4000/api/documents/$DOC/process-ocr -H "Authorization: Bearer $TOKEN"

# Application: create → form → consent → submit
curl -s localhost:4000/api/applications -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"scheme_slug":"hospital-care-subsidy"}'
curl -s -X PUT localhost:4000/api/applications/$APP/form -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"form_data":{"city":"Pune"}}'
curl -s localhost:4000/api/applications/$APP/consent -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"consent_version":"v1.0","scopes":["insurer","government"],"esign_name":"Sunita Devi"}'
curl -s -X POST localhost:4000/api/applications/$APP/submit -H "Authorization: Bearer $TOKEN"

# Data rights
curl -s localhost:4000/api/data-requests/export -H "Authorization: Bearer $TOKEN" > my-data.json
curl -s localhost:4000/api/data-requests -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"kind":"deletion"}'
```

## Tests

```bash
cd backend
npm test               # unit: eligibility engine, crypto, upload→OCR flow
npm run test:e2e       # integration (needs docker compose up db storage)
```

## Phased implementation plan

| Phase | Scope | Exit criteria |
|---|---|---|
| **P0 — MVP (this repo)** | Auth, wizard, eligibility, upload+OCR(mock), application, consent, submit, admin queue, data rights | E2E green locally; docs approved **REQUIRES LEGAL REVIEW** |
| **P1 — Integrations** | Google Vision OCR, Twilio/SendGrid real sending, e-sign vendor, insurer connector + webhooks | DPIA done; DLT registered; vendor DPAs signed |
| **P2 — Scale** | Queue workers (BullMQ/Redis), rate limiting, WAF, observability (OTel), multi-region read replicas | Pen-test passed; SLOs defined; DR drill done |
| **P3 — Expansion** | Payments (PCI scope), more languages, mobile app, caseworker mobile KYC | PCI SAQ; per-market legal review |

## Pre-launch checklist (abbreviated — full: docs/ComplianceReport.md §7)

- [ ] Legal docs approved — **REQUIRES LEGAL REVIEW**
- [ ] DLT registration (SMS) — **REQUIRES LEGAL REVIEW**
- [ ] DPIA (OCR vendor + staff access) — **REQUIRES LEGAL REVIEW**
- [ ] `npm audit --omit=dev` clean; license scan clean
- [ ] External pen-test — **REQUIRES LEGAL REVIEW**/sign-off
- [ ] Rate limiting + WAF — Needs Attention
- [ ] Backup + restore drill — Needs Attention
- [ ] Secret rotation runbook exercised — Needs Attention

## Conventions

- TypeScript strict everywhere; ESLint + Prettier.
- Secrets only via env/secret manager — never in git (`TODO(org)` marks org gaps).
- Every PII-touching query auditable; staff reads always audited.
- i18n: no hardcoded user-facing strings; `en` is source of truth, `es` complete.
