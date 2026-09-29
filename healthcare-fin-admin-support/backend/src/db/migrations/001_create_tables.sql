-- ═══════════════════════════════════════════════════════════════════
-- HFAS — 001_create_tables.sql
-- Full schema. Sensitive columns are marked with comments describing
-- envelope encryption via KMS; see docs/ComplianceReport.md § KMS.
-- Run order: this file → scripts/seed_data.sql
-- ═══════════════════════════════════════════════════════════════════

-- Extensions used: pgcrypto (gen_random_uuid), pg_trgm (fuzzy search),
-- unaccent (search normalization). GIN indexes below serve full-text.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ────────────────────────────────────────────────────────────────
-- users & profiles
-- ────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164      VARCHAR(20) UNIQUE,            -- +919876543210
  email           VARCHAR(320) UNIQUE,           -- nullable: OTP-first users
  password_hash   TEXT,                          -- NULL for OTP-only users
  role            VARCHAR(20) NOT NULL DEFAULT 'patient'
                  CHECK (role IN ('patient','caregiver','caseworker','admin')),
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('pending','active','suspended','deletion_pending','deleted')),
  locale          VARCHAR(10) NOT NULL DEFAULT 'en-IN',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ                   -- soft delete until purge job runs
);

-- OTP codes are short-lived; hashed at rest. See auth.service.ts.
CREATE TABLE otp_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  channel      VARCHAR(10) NOT NULL CHECK (channel IN ('sms','email')),
  destination  VARCHAR(320) NOT NULL,
  code_hash    TEXT NOT NULL,                    -- sha256(code + pepper)
  attempts     SMALLINT NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_ip   INET,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_user_active ON otp_codes (user_id, consumed_at) WHERE consumed_at IS NULL;
CREATE INDEX idx_otp_expires     ON otp_codes (expires_at);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  user_agent  TEXT,
  ip          INET,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_user ON refresh_tokens (user_id, revoked_at);

CREATE TABLE profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name             VARCHAR(200),
  date_of_birth         DATE,
  address_line1         VARCHAR(200),
  address_line2         VARCHAR(200),
  city                  VARCHAR(100),
  state                 VARCHAR(100),
  postal_code           VARCHAR(20),
  -- SENSITIVE **REQUIRES LEGAL REVIEW**: national ID (e.g., Aadhaar).
  -- Store ONLY as ciphertext + KMS-wrapped DEK. Never plaintext, never log.
  national_id_enc       BYTEA,
  national_id_last4     VARCHAR(4),              -- display-safe slice
  annual_income_inr     NUMERIC(12,2),
  household_size        SMALLINT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- schemes & eligibility
-- ────────────────────────────────────────────────────────────────
CREATE TABLE schemes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(80) NOT NULL UNIQUE,   -- 'hospital-care-subsidy'
  name            VARCHAR(200) NOT NULL,
  provider_type   VARCHAR(20) NOT NULL CHECK (provider_type IN ('govt','insurer','trust')),
  provider_name   VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  max_amount_inr  NUMERIC(12,2),
  eligibility_rules JSONB NOT NULL DEFAULT '[]'  -- see eligibility engine
                  CHECK (jsonb_typeof(eligibility_rules) = 'json_array'),
  required_docs   TEXT[] NOT NULL DEFAULT '{}',
  helpline        VARCHAR(60),
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-text / fuzzy search over scheme metadata.
CREATE INDEX idx_schemes_search ON schemes
  USING GIN (to_tsvector('english', name || ' ' || provider_name || ' ' || description));
CREATE INDEX idx_schemes_name_trgm ON schemes USING GIN (name gin_trgm_ops);
CREATE INDEX idx_schemes_active ON schemes (active) WHERE active;

-- ────────────────────────────────────────────────────────────────
-- documents
-- ────────────────────────────────────────────────────────────────
CREATE TABLE documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id   UUID,                          -- FK added after applications
  doc_type         VARCHAR(60) NOT NULL,          -- 'aadhaar' | 'hospital_invoice' …
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','uploaded','processing','parsed','failed','flagged','deleted')),
  storage_key      TEXT NOT NULL,                 -- s3://bucket/key (object encrypted by SSE-KMS)
  content_type     VARCHAR(120) NOT NULL,
  byte_size        BIGINT NOT NULL CHECK (byte_size > 0 AND byte_size <= 26214400), -- 25 MB cap
  original_name    VARCHAR(255),
  -- SENSITIVE: extracted PII values live here; column encrypted per KMS note.
  ocr_text         TEXT,
  ocr_fields       JSONB,                         -- {label, value, confidence}[]
  ocr_provider     VARCHAR(40),
  ocr_error        TEXT,
  checksum_sha256  CHAR(64),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX idx_documents_user        ON documents (user_id, deleted_at);
CREATE INDEX idx_documents_application ON documents (application_id);
CREATE INDEX idx_documents_status      ON documents (status) WHERE status IN ('pending','processing');
-- OCR text is PII-bearing; tsvector index is for caseworker search only.
-- **REQUIRES LEGAL REVIEW**: confirm caseworker full-text search over citizen
-- documents is permitted by your DPIA; drop this index if not.
CREATE INDEX idx_documents_ocr_fts ON documents
  USING GIN (to_tsvector('english', coalesce(ocr_text, '')));

-- ────────────────────────────────────────────────────────────────
-- applications
-- ────────────────────────────────────────────────────────────────
CREATE TABLE applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheme_id        UUID NOT NULL REFERENCES schemes(id),
  reference        VARCHAR(24) NOT NULL UNIQUE,   -- INV-20260712-019
  status           VARCHAR(30) NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','documents','details','consent','submitted','under_review','approved','rejected','withdrawn','deletion_pending')),
  progress_pct     SMALLINT NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  form_data        JSONB NOT NULL DEFAULT '{}'    -- prefill + user edits (PII → encrypt)
                  CHECK (jsonb_typeof(form_data) = 'json_object'),
  assigned_caseworker_id UUID REFERENCES users(id),
  submitted_at     TIMESTAMPTZ,
  decided_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_applications_user      ON applications (user_id, status);
CREATE INDEX idx_applications_queue     ON applications (status, submitted_at) WHERE status = 'submitted';
CREATE INDEX idx_applications_worker    ON applications (assigned_caseworker_id) WHERE assigned_caseworker_id IS NOT NULL;
CREATE INDEX idx_applications_form_gin  ON applications USING GIN (form_data jsonb_path_ops);

-- Immutable-ish consent ledger. Rows are never updated or deleted.
-- **REQUIRES LEGAL REVIEW**: retention of IP addresses as personal data.
CREATE TABLE consent_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id   UUID REFERENCES applications(id) ON DELETE SET NULL,
  consent_version  VARCHAR(20) NOT NULL,          -- points at docs/ConsentForm.md@rev
  scopes           TEXT[] NOT NULL,               -- {insurer,hospital,government}
  esign_name       VARCHAR(200) NOT NULL,
  esign_method     VARCHAR(20) NOT NULL DEFAULT 'typed'
                   CHECK (esign_method IN ('typed','docusign','aadhaar_esign')), -- TODO(org): pick e-sign vendor
  ip               INET,
  user_agent       TEXT,
  signed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_consent_user ON consent_records (user_id, signed_at DESC);

-- ────────────────────────────────────────────────────────────────
-- notifications & audit
-- ────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel      VARCHAR(10) NOT NULL CHECK (channel IN ('email','sms','push','inapp')),
  template     VARCHAR(80) NOT NULL,              -- 'application.submitted'
  payload      JSONB NOT NULL DEFAULT '{}',
  status       VARCHAR(20) NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued','sent','failed','skipped')),
  error        TEXT,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_outbox ON notifications (status, created_at) WHERE status = 'queued';

-- Append-only audit trail. Enforce append-only with a BEFORE UPDATE/DELETE
-- trigger raising an exception. Keep entries after user deletion where law
-- requires (see retention.yaml). **REQUIRES LEGAL REVIEW** for retention.
CREATE TABLE audit_logs (
  id           BIGSERIAL PRIMARY KEY,
  actor_id     UUID,                              -- users.id; NULL = system
  actor_role   VARCHAR(20),
  action       VARCHAR(80) NOT NULL,              -- 'document.read' | 'application.write' …
  entity       VARCHAR(40) NOT NULL,              -- 'document' | 'application' …
  entity_id    UUID,
  ip           INET,
  user_agent   TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',       -- no PII values, only ids/counts
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor   ON audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_entity  ON audit_logs (entity, entity_id, created_at DESC);
CREATE INDEX idx_audit_action  ON audit_logs (action, created_at DESC);

-- Block mutation of the audit trail (append-only guarantee).
CREATE FUNCTION audit_logs_no_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_no_mutation();

-- ────────────────────────────────────────────────────────────────
-- integrations & webhooks
-- ────────────────────────────────────────────────────────────────
CREATE TABLE integrations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           VARCHAR(80) NOT NULL UNIQUE,     -- 'acmecare-connector'
  kind           VARCHAR(40) NOT NULL,            -- 'insurer_api' | 'docusign' | 'ocr'
  config         JSONB NOT NULL DEFAULT '{}'      -- secrets NOT stored here; vault refs only
                 CHECK (jsonb_typeof(config) = 'json_object'),
  webhook_secret TEXT,                            -- HMAC secret ref (env/vault, never plaintext)
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  direction      VARCHAR(10) NOT NULL CHECK (direction IN ('outbound','inbound')),
  event          VARCHAR(80) NOT NULL,
  payload        JSONB,
  signature_valid BOOLEAN,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','delivered','failed','rejected')),
  attempts       SMALLINT NOT NULL DEFAULT 0,
  last_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_retry ON webhook_deliveries (status, created_at) WHERE status IN ('pending','failed');

-- ────────────────────────────────────────────────────────────────
-- data subject requests (GDPR / DPDP)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE deletion_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind          VARCHAR(20) NOT NULL CHECK (kind IN ('access','correction','deletion')),
  status        VARCHAR(20) NOT NULL DEFAULT 'received'
                CHECK (status IN ('received','in_review','approved','rejected','completed')),
  requested_changes JSONB,                        -- for correction: {field: newValue}
  admin_note    TEXT,
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deletion_open ON deletion_requests (status, created_at) WHERE status IN ('received','in_review');

-- ────────────────────────────────────────────────────────────────
-- FK added post-creation (documents.application_id)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE documents
  ADD CONSTRAINT fk_documents_application
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL;

-- updated_at maintenance trigger
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_touch        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_profiles_touch     BEFORE UPDATE ON profiles     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_schemes_touch      BEFORE UPDATE ON schemes      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_documents_touch    BEFORE UPDATE ON documents    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_applications_touch BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
