# Behavioral observability — 12-week rollout

Flag-first: every stage ships behind a flag; rollback = flag off (no deploys).

| Week | Milestone | Exit criteria | Rollback |
|---|---|---|---|
| 1 | Event schemas v1 + schema CI (`telemetry/validate-schemas.mjs`) merged | CI green on PR; catalog complete (11 events) | revert PR — no runtime dep |
| 2 | Ingest API + Postgres store (migration 003) behind `telemetry_enabled` | batch of 100 accepted <150ms p95; dedupe verified | flag off → endpoint 404s, no client queue growth (tracker drops) |
| 3 | Frontend tracker + session/anon ids; `page_view` only | event volume matches GA-free baseline ±20%; no PII in props (spot audit) | flag off stops emit |
| 4 | Full event coverage (action.* + support.*) with PII audit | schema CI + manual review sign-off | per-event kill list in flag config |
| 5 | Replay: consent modal + strict masking + vendor DPA signed ⚖️ | consent ledger rows; masking verified on OTP/policy screens | disable replay flag; purge vendor replays via API |
| 6 | dbt `session_metrics` + backfill 90d | scores within hand-audited ±10% on 20 sampled sessions | model re-run idempotent |
| 7 | Dashboards v1 (funnel, experience trend, leak paths, HIHF) | product team uses in weekly review | panels read-only — no rollback needed |
| 8 | Alerts v1 (upload spike, OCR latency, experience drop, synthetic) → Slack + GitHub issues | 1 staged fire per rule validated (fault injection) | rules file revert; cooldowns prevent storms |
| 9 | Synthetic monitors on schedule (staging) + `synthetic.run_result` feed | 2 scheduled days green; failure path tested | workflow disable |
| 10 | LLM insights agent (weekly digest, human-reviewed queue) | 2 digests produced; validation_sql run by analyst only | agent is read-only — pause cron |
| 11 | Experimentation framework live; first experiment `ocr_verify_gate` | SRM clean; sample-size plan documented | kill-switch flag per experiment |
| 12 | Pilot cohort: adaptive micro-interventions (#1) + trust chips (#9) on 10% traffic | guardrails flat; intervention CTR > baseline | cohort flag → 0% |

## Standing rollback kit
- `telemetry_enabled` — global kill for all client tracking
- `replay_enabled` — session replay master switch (+ vendor-side purge script)
- `exp_*` — per-experiment flags (assignment stops; exposed users keep analysis validity)
- Retention: `retention.yaml` periods are config — shorten instantly, never lengthen retroactively
- DSAR purge must run even when features are flagged off (compliance > convenience)
