# HFAS — Healthcare Financial & Administrative Support

Two deliverables in one workspace:

| Path | What it is | Stack |
|---|---|---|
| **`/`** (root app) | Working 12-page product prototype — SPA with all pages, overlays, i18n (en-IN/es), design tokens, handoff page | React 18 + Vite + Framer Motion + Tailwind |
| **`/healthcare-fin-admin-support`** | Production-capable monorepo — NestJS API, Next.js frontend, PostgreSQL migrations, telemetry/observability, legal docs, CI | Next.js + NestJS + Postgres + Playwright |

## Run the prototype (quick look)

```bash
npm install
npm run dev          # → http://localhost:5173
```

Hash-routed pages: `/#/landing`, `/#/auth-signup`, `/#/onboarding-wizard`,
`/#/dashboard`, `/#/eligibility-results`, `/#/scheme-detail`,
`/#/application-overview`, `/#/application-documents`,
`/#/application-details`, `/#/application-consent`,
`/#/submission-confirmation`, `/#/status-timeline`, plus `/#/handoff`
(tokens, licenses, API placeholders, a11y checklist).

## Run the monorepo (full stack)

```bash
cd healthcare-fin-admin-support
bash scripts/setup_local.sh   # docker: Postgres + MinIO + API :4000 + web :3000
```

Swagger: http://localhost:4000/docs · seeded demo logins in the output.
See [healthcare-fin-admin-support/README.md](healthcare-fin-admin-support/README.md)
and [telemetry/README.md](healthcare-fin-admin-support/telemetry/README.md).

## Repo map

```
├─ src/                              # prototype SPA (pages, overlays, components, i18n)
├─ public/                           # prototype: tokens.json, css-vars.css, lottie, licenses
├─ healthcare-fin-admin-support/     # production monorepo
│  ├─ backend/    (NestJS, migrations, OpenAPI, tests)
│  ├─ frontend/   (Next.js, i18n, tracker, consent UIs)
│  ├─ telemetry/  (schemas, SQL models, alerts, LLM agent, synthetic, policies)
│  ├─ docs/       (legal drafts — REQUIRES LEGAL REVIEW)
│  ├─ infra/      (terraform notes, retention policy)
│  └─ design/     (Figma brief, components, asset licenses)
└─ .github/workflows/                # CI, synthetic monitors, schema gates
```

> All documents under `docs/` are drafts and **REQUIRES LEGAL REVIEW** before
> production use. Not legal advice.
