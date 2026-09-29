-- ═══════════════════════════════════════════════════════════════════
-- Dashboard panel SQL (Metabase / Looker / Grafana table+timeseries).
-- One query per panel; all read-only against the warehouse.
-- ═══════════════════════════════════════════════════════════════════

-- ── Panel 1: Apply funnel (last 30d, per week) ─────────────────────
-- View → Start → Upload → OCR reviewed → Submit
SELECT
  date_trunc('week', ts) AS week,
  count(DISTINCT session_id) FILTER (WHERE event_name = 'page_view'
      AND props->>'page' IN ('landing','eligibility-results','scheme-detail'))  AS viewed,
  count(DISTINCT session_id) FILTER (WHERE event_name = 'action.start_application') AS started,
  count(DISTINCT session_id) FILTER (WHERE event_name = 'action.upload_attempt')    AS uploaded,
  count(DISTINCT session_id) FILTER (WHERE event_name = 'action.ocr_confirmed')     AS ocr_reviewed,
  count(DISTINCT session_id) FILTER (WHERE event_name = 'action.submit_application'
      AND props->>'outcome' = 'submitted')                                       AS submitted
FROM telemetry_events
WHERE ts > now() - interval '30 days'
GROUP BY 1 ORDER BY 1;

-- ── Panel 2: Experience trend (7d rolling median, by locale) ───────
SELECT
  session_date,
  locale,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY experience_score) AS median_experience,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY effort_score)     AS median_effort,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY intent_score)     AS median_intent,
  count(*) AS sessions
FROM session_metrics
WHERE session_date > current_date - 30
GROUP BY 1, 2 ORDER BY 1, 2;

-- ── Panel 3: Top leak paths (today vs 7d baseline) ─────────────────
SELECT from_step, to_step, exit_rate_pct, sessions_entering, computed_at
FROM top_leak_paths
WHERE computed_at::date >= current_date - 1
ORDER BY computed_at DESC, exit_rate_pct DESC
LIMIT 50;

-- ── Panel 4: Upload error heatmap (day × error code) ───────────────
SELECT
  date_trunc('day', ts) AS day,
  coalesce(props->>'error', '(success)') AS error_code,
  count(*) AS attempts
FROM telemetry_events
WHERE event_name = 'action.upload_attempt'
  AND ts > now() - interval '14 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;

-- ── Panel 5: High-intent-high-friction list (action queue) ─────────
SELECT session_id, session_date, locale, intent_score, effort_score,
       uploads_failed, fields_edited, help_requests, upload_error_codes
FROM high_intent_high_friction
WHERE session_date >= current_date - 7
ORDER BY effort_score DESC
LIMIT 100;

-- ── Panel 6: Active alerts + synthetic status ──────────────────────
-- (a) synthetic pass rate last 24h per scenario
SELECT
  props->>'scenario' AS scenario,
  count(*) FILTER (WHERE props->>'outcome' = 'passed') AS passed,
  count(*) FILTER (WHERE props->>'outcome' <> 'passed') AS failed,
  round(100.0 * count(*) FILTER (WHERE props->>'outcome' = 'passed') / count(*), 1) AS pass_pct,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY (props->>'durationMs')::int) AS p95_ms
FROM telemetry_events
WHERE event_name = 'synthetic.run_result'
  AND ts > now() - interval '24 hours'
GROUP BY 1;

-- (b) open GitHub issues from auto-triage (exported via API into a table)
SELECT id, title, severity, created_at FROM open_auto_issues ORDER BY severity, created_at;

-- ── Panel 7: Experiment monitor (exposures + guardrails) ───────────
SELECT
  props->>'experimentKey' AS experiment,
  props->>'variant' AS variant,
  count(DISTINCT session_id) AS exposures,
  count(DISTINCT user_id) AS exposed_users
FROM telemetry_events
WHERE event_name = 'experiment.assigned'
  AND ts > now() - interval '14 days'
GROUP BY 1, 2
ORDER BY 1, 2;
