-- ═══════════════════════════════════════════════════════════════════
-- HFAS — 003_telemetry.sql
-- Behavioral telemetry store. High-volume: designed to be moved to
-- ClickHouse/BigQuery later; table is range-partition-ready (monthly).
-- Retention (REQUIRES LEGAL REVIEW — see telemetry/retention.yaml):
--   raw events 365 days · session_metrics aggregates 730 days
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS telemetry_events (
  id              BIGSERIAL,
  event_id        UUID NOT NULL,
  event_name      VARCHAR(80)  NOT NULL,
  schema_version  VARCHAR(10)  NOT NULL DEFAULT 'v1',
  session_id      UUID         NOT NULL,
  user_id         UUID,                        -- nullable (anonymous)
  anonymous_id    UUID         NOT NULL,
  trace_id        VARCHAR(64),
  ts              TIMESTAMPTZ  NOT NULL,
  props           JSONB        NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(props) = 'json_object'),
  ingested_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (id, ts)                         -- composite key = partition-ready
);

-- Dedupe on event_id (idempotent ingest — retries safe).
CREATE UNIQUE INDEX IF NOT EXISTS uq_telemetry_event_id ON telemetry_events (event_id);

-- Analytical access patterns
CREATE INDEX IF NOT EXISTS idx_telemetry_name_ts  ON telemetry_events (event_name, ts DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_session  ON telemetry_events (session_id, ts);
CREATE INDEX IF NOT EXISTS idx_telemetry_user     ON telemetry_events (user_id, ts DESC) WHERE user_id IS NOT NULL;
-- Props containment (e.g. schemeSlug filter) — GIN on the JSONB.
CREATE INDEX IF NOT EXISTS idx_telemetry_props    ON telemetry_events USING GIN (props jsonb_path_ops);

-- ── Replay consent ledger (mirrors consent_records for DSAR joins) ──
ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS replay_granted BOOLEAN,
  ADD COLUMN IF NOT EXISTS replay_scope   VARCHAR(20);

-- ── Session aggregates (materialized by dbt/db:session_metrics) ──
CREATE TABLE IF NOT EXISTS session_metrics (
  session_id        UUID PRIMARY KEY,
  session_date      DATE NOT NULL,
  user_id           UUID,
  anonymous_id      UUID NOT NULL,
  locale            VARCHAR(10),
  cohort_insurer    VARCHAR(80),
  cohort_hospital   VARCHAR(120),
  event_count       INTEGER NOT NULL DEFAULT 0,
  pages_viewed      INTEGER NOT NULL DEFAULT 0,
  uploads_attempted INTEGER NOT NULL DEFAULT 0,
  uploads_failed    INTEGER NOT NULL DEFAULT 0,
  ocr_documents     INTEGER NOT NULL DEFAULT 0,
  ocr_edits         INTEGER NOT NULL DEFAULT 0,
  fields_edited     INTEGER NOT NULL DEFAULT 0,
  submits           INTEGER NOT NULL DEFAULT 0,
  help_requests     INTEGER NOT NULL DEFAULT 0,
  dwell_ms          BIGINT  NOT NULL DEFAULT 0,
  intent_score      SMALLINT NOT NULL DEFAULT 0 CHECK (intent_score BETWEEN 0 AND 100),
  effort_score      SMALLINT NOT NULL DEFAULT 0 CHECK (effort_score BETWEEN 0 AND 100),
  experience_score  SMALLINT NOT NULL DEFAULT 0 CHECK (experience_score BETWEEN 0 AND 100),
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_session_metrics_date ON session_metrics (session_date);
CREATE INDEX IF NOT EXISTS idx_session_metrics_user ON session_metrics (user_id) WHERE user_id IS NOT NULL;
-- High-intent-high-friction lookup
CREATE INDEX IF NOT EXISTS idx_session_metrics_hihf ON session_metrics (session_date)
  WHERE intent_score >= 60 AND effort_score >= 60;
