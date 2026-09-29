-- ═══════════════════════════════════════════════════════════════════
-- HFAS — 002_roadmap_features.sql
-- Adds: fraud flags (duplicate detection), document-level consent
-- pointers, application triage columns. Idempotent.
-- ═══════════════════════════════════════════════════════════════════

-- ── Fraud / anomaly flags ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_flags (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  document_id    UUID REFERENCES documents(id) ON DELETE SET NULL,
  kind           VARCHAR(40) NOT NULL,   -- 'duplicate_checksum' | 'amount_outlier' | ...
  severity       VARCHAR(10) NOT NULL DEFAULT 'low'
                 CHECK (severity IN ('low','medium','high')),
  detail         JSONB NOT NULL DEFAULT '{}'  -- ids/hashes only, no PII values
                 CHECK (jsonb_typeof(detail) = 'json_object'),
  status         VARCHAR(20) NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','reviewing','dismissed','confirmed_fraud')),
  reviewed_by    UUID REFERENCES users(id),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fraud_open ON fraud_flags (severity, created_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_fraud_app  ON fraud_flags (application_id);

-- ── Document-level consent pointers (versioned consent) ─────────
-- Each consent row may point at the specific documents shared, giving
-- per-document purpose scoping (ComplianceReport § Consent versioning).
ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS document_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS purpose      VARCHAR(80) NOT NULL DEFAULT 'claim_processing';

-- ── Triage / priority on applications ───────────────────────────
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS priority_score SMALLINT NOT NULL DEFAULT 0
    CHECK (priority_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS triaged_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS urgency        VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (urgency IN ('normal','treatment_critical','financial_hardship','deadline'));

-- Queue ordering: triaged priority first, then FIFO.
DROP INDEX IF EXISTS idx_applications_queue;
CREATE INDEX idx_applications_queue ON applications (status, priority_score DESC, submitted_at)
  WHERE status = 'submitted';

-- ── Approval-likelihood snapshot per application ────────────────
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS approval_likelihood SMALLINT
    CHECK (approval_likelihood BETWEEN 0 AND 100);
