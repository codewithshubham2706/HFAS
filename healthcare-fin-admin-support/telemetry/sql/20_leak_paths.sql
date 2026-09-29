-- ═══════════════════════════════════════════════════════════════════
-- dbt model: top_leak_paths  (ref: models/marts/top_leak_paths.sql)
-- config: materialized = 'table'
-- Where do sessions die? Ranks step→step transitions by drop rate.
-- ═══════════════════════════════════════════════════════════════════

WITH ordered AS (
  SELECT
    session_id,
    ts,
    CASE event_name
      WHEN 'page_view'                THEN 'view:'    || coalesce(props->>'page', '?')
      WHEN 'action.start_application' THEN 'start:'   || coalesce(props->>'schemeSlug', '?')
      WHEN 'action.upload_attempt'    THEN 'upload:'  || coalesce(props->>'docType', '?')
      WHEN 'action.ocr_extracted'     THEN 'ocr:'     || coalesce(props->>'status', '?')
      WHEN 'action.ocr_confirmed'     THEN 'ocr_confirmed'
      WHEN 'action.field_edit'        THEN 'edit:'    || coalesce(props->>'fieldName', '?')
      WHEN 'action.submit_application' THEN 'submit:' || coalesce(props->>'outcome', '?')
      WHEN 'support.request_help'     THEN 'help:'    || coalesce(props->>'channel', '?')
      ELSE event_name
    END AS step,
    row_number() OVER (PARTITION BY session_id ORDER BY ts) AS step_no
  FROM {{ ref('stg_telemetry_events') }}
  WHERE ts > now() - interval '30 days'
),

transitions AS (
  SELECT
    a.step AS from_step,
    b.step AS to_step,
    count(DISTINCT a.session_id) AS sessions_entering
  FROM ordered a
  LEFT JOIN ordered b
    ON b.session_id = a.session_id AND b.step_no = a.step_no + 1
  GROUP BY 1, 2
),

exits AS (
  SELECT step, count(DISTINCT session_id) AS sessions_dying_here
  FROM ordered o
  WHERE NOT EXISTS (
    SELECT 1 FROM ordered n
    WHERE n.session_id = o.session_id AND n.step_no = o.step_no + 1
  )
  GROUP BY step
)

SELECT
  t.from_step,
  coalesce(t.to_step, 'EXIT') AS to_step,
  t.sessions_entering,
  coalesce(e.sessions_dying_here, 0) AS sessions_exiting,
  ROUND(100.0 * coalesce(e.sessions_dying_here, 0)
        / NULLIF(t.sessions_entering, 0), 1) AS exit_rate_pct,
  now() AS computed_at
FROM transitions t
LEFT JOIN exits e ON e.step = t.from_step
WHERE t.sessions_entering >= 20          -- noise floor
ORDER BY exit_rate_pct DESC, sessions_entering DESC
LIMIT 50

-- ═══════════════════════════════════════════════════════════════════
-- dbt model: high_intent_high_friction  (models/marts/high_intent_high_friction.sql)
-- config: materialized = 'table'
-- Users who clearly want to finish but are fighting the product —
-- the exact audience for adaptive micro-interventions & proactive outreach.
-- PRIVACY: keyed by user_id/anonymous_id only; no PII columns.
-- ═══════════════════════════════════════════════════════════════════

SELECT
  m.session_id,
  m.session_date,
  m.user_id,
  m.anonymous_id,
  m.locale,
  m.intent_score,
  m.effort_score,
  m.experience_score,
  m.uploads_failed,
  m.fields_edited,
  m.help_requests,
  -- Coarse failure taxonomy for the LLM agent (no PII, codes only)
  (SELECT string_agg(DISTINCT props->>'error', ',')
     FROM {{ ref('stg_telemetry_events') }} e
    WHERE e.session_id = m.session_id
      AND e.event_name = 'action.upload_attempt'
      AND props->>'error' IS NOT NULL) AS upload_error_codes,
  now() AS computed_at
FROM {{ ref('session_metrics') }} m
WHERE m.session_date >= current_date - 7
  AND m.intent_score  >= 60            -- trying hard
  AND m.effort_score  >= 60            -- and fighting friction
  AND m.submits = 0                    -- but not finishing
ORDER BY m.effort_score DESC, m.intent_score DESC
LIMIT 500
