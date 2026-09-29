# Telemetry & product intelligence — local run

The whole stack runs on the existing docker-compose (Postgres is the event
store locally; Kafka/SQS is a prod-only swap — see `telemetry.service.ts`).

## 1. Start the stack

```bash
cd healthcare-fin-admin-support
bash scripts/setup_local.sh          # env + docker compose + migrations 001–003 + seed
```

## 2. Seed & sample the event stream

```bash
node telemetry/sample_ingest.mjs     # sends 8 realistic events, prints validation report
```

Expected output: `accepted: 8, rejected: 0` (rejected examples included as
comments to demo the validator).

## 3. Compute metrics + view leak paths

```bash
docker compose exec -T db psql -U hfas -d hfas < telemetry/sql/10_session_metrics.sql   # (run via dbt in prod; here: psql)
docker compose exec -T db psql -U hfas -d hfas -c "SELECT session_id, intent_score, effort_score, experience_score FROM session_metrics;"
```

Panels: paste queries from `telemetry/sql/30_dashboards.sql` into Metabase
(point it at `localhost:5432/hfas`).

## 4. Fire an alert (dry run)

Paste the `trigger.sql` of any rule in `telemetry/alerts.yaml` — e.g. inject
upload failures first:

```bash
node telemetry/sample_ingest.mjs --spike    # 12 upload failures in-window
# then run the upload_failure_spike trigger SQL → condition true
```

## 5. Synthetic monitors

```bash
cd telemetry/synthetic
npm i -D @playwright/test && npx playwright install chromium
WEB_BASE=http://localhost:3000 API_BASE=http://localhost:4000/api npx playwright test
```

## 6. Schema CI

```bash
node telemetry/validate-schemas.mjs   # exit 1 blocks the PR
```

## Layout

```
telemetry/
├─ schemas/v1/            # 11 event schemas + base envelope (versioned)
├─ openapi-telemetry.yaml # ingest + replay-consent API contract
├─ sql/                   # 10_session_metrics · 20_leak_paths(+HIHF) · 30_dashboards
├─ alerts.yaml            # triggers → sample SQL → issue + Slack templates
├─ masking-policy.yaml    # replay strict profile (blacklist + regex)
├─ sampling-policy.yaml   # replay/heatmap sampling rules
├─ retention.yaml         # 30d replays / 365d raw / 730d aggregates ⚖️
├─ llm-insights-agent.md  # orchestration + prompts + output contract
├─ experimentation.md     # assignment, exposure, power calc, analysis SQL
├─ advanced-features.md   # 10 features: rationale/instrumentation/effort/KPI
├─ telemetry-privacy.md   # consent snippets, DPA checklist, DSAR notes ⚖️
├─ ROADMAP-12WEEK.md      # week-by-week rollout + rollback kit
├─ synthetic/             # Playwright monitors + config
├─ validate-schemas.mjs   # CI gate (structure + PII sniff)
└─ sample_ingest.mjs      # local demo script
```
