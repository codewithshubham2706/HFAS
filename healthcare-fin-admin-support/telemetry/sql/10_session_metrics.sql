-- ═══════════════════════════════════════════════════════════════════
-- dbt model: session_metrics  (ref: models/marts/session_metrics.sql)
-- config: materialized = 'incremental', unique_key = 'session_id'
-- Weighted, explainable scores — every component is a plain SUM of
-- observable events so product managers can audit any score.
-- ═══════════════════════════════════════════════════════════════════

WITH events AS (
  SELECT * FROM {{ ref('stg_telemetry_events') }}
  {% if is_incremental() %}
  WHERE ts > (SELECT coalesce(max(computed_ts), to_timestamp(0)) FROM {{ this }})
  {% endif %}
),

per_session AS (
  SELECT
    session_id,
    max(user_id)                          AS user_id,
    max(anonymous_id)                     AS anonymous_id,
    date(max(ts))                         AS session_date,
    coalesce(max(props->>'locale'), 'unknown')                      AS locale,
    coalesce(max(props->>'schemeSlug'), 'unknown')                  AS cohort_insurer,  -- nearest cohort proxy; enrich in stg
    coalesce(max(props->>'hospital'), 'unknown')                    AS cohort_hospital,
    count(*)                              AS event_count,
    count(*) FILTER (WHERE event_name = 'page_view')                 AS pages_viewed,
    count(*) FILTER (WHERE event_name = 'action.upload_attempt')     AS uploads_attempted,
    count(*) FILTER (WHERE event_name = 'action.upload_attempt'
                        AND props->>'error' IS NOT NULL)             AS uploads_failed,
    count(DISTINCT props->>'documentId')
        FILTER (WHERE event_name = 'action.ocr_extracted'
                 AND props->>'status' = 'parsed')                    AS ocr_documents,
    count(*) FILTER (WHERE event_name = 'action.ocr_confirmed')      AS ocr_confirmed,
    count(*) FILTER (WHERE event_name = 'action.field_edit')         AS fields_edited,
    count(*) FILTER (WHERE event_name = 'action.submit_application'
                        AND props->>'outcome' = 'submitted')         AS submits,
    count(*) FILTER (WHERE event_name = 'action.submit_application'
                        AND props->>'outcome' <> 'submitted')        AS submit_blocks,
    count(*) FILTER (WHERE event_name = 'support.request_help')      AS help_requests,
    max(props->>'dwellMs')::bigint                                   AS dwell_ms,
    max(ts) - min(ts)                                                AS session_span
  FROM events
  GROUP BY session_id
),

scored AS (
  SELECT
    s.*,
    -- ── INTENT: how hard is this user trying to finish? ─────────
    -- depth signals (started application, reached OCR, submitted)
    LEAST(100,
      20 * LEAST(pages_viewed, 5) / 5.0                                    -- browsing depth (0-20)
      + 25 * LEAST(uploads_attempted, 2) / 2.0                             -- document effort (0-25)
      + 20 * LEAST(ocr_confirmed, 2) / 2.0                                 -- reviewed extractions (0-20)
      + 25 * LEAST(submits, 1)                                             -- reached submit (0/25)
      + 10 * LEAST(session_span, interval '10 minutes') / interval '10 minutes'
    )::smallint AS intent_score,

    -- ── EFFORT: how hard was it FOR them? (higher = more friction) ──
    LEAST(100,
      30 * LEAST(fields_edited, 10) / 10.0                                 -- manual corrections (0-30)
      + 30 * LEAST(uploads_failed, 3) / 3.0                                -- failed uploads (0-30)
      + 20 * LEAST(submit_blocks, 2) / 2.0                                 -- blocked submits (0-20)
      + 20 * LEAST(help_requests, 2) / 2.0                                 -- needed help (0-20)
    )::smallint AS effort_score
  FROM per_session s
)

SELECT
  session_id, session_date, user_id, anonymous_id, locale,
  cohort_insurer, cohort_hospital,
  event_count::int, pages_viewed::int, uploads_attempted::int, uploads_failed::int,
  ocr_documents::int, fields_edited::int, submits::int, help_requests::int,
  dwell_ms,
  intent_score,
  effort_score,
  -- ── EXPERIENCE: composite (higher = better) ─────────────────
  -- success (submitted) minus friction (effort) minus dropoff.
  LEAST(100, GREATEST(0,
    40 * LEAST(submits, 1)
    + 20 * LEAST(ocr_confirmed, 2) / 2.0
    + 15 * LEAST(pages_viewed, 5) / 5.0
    + 25 - 25 * LEAST(uploads_failed, 3) / 3.0
    - 15 * LEAST(help_requests, 2) / 2.0
    + (CASE WHEN session_span IS NULL THEN 0 ELSE 0 END)  -- span neutral in v1
  ))::smallint AS experience_score,
  now() AS computed_at,
  now() AS computed_ts                                   -- watermark for incremental runs
FROM scored
{% if is_incremental() %}
WHERE session_id NOT IN (SELECT session_id FROM {{ this }})
{% endif %}
