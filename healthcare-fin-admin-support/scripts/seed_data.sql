-- ═══════════════════════════════════════════════════════════════════
-- HFAS — seed_data.sql (dev/demo ONLY — never run in production)
-- Creates sample users (password: hfas-Demo-2026!), three schemes,
-- a seeded application INV-20260712-019 and timeline entries.
-- ═══════════════════════════════════════════════════════════════════

-- Password below = bcrypt('hfas-Demo-2026!') cost 10 (generated offline).
INSERT INTO users (id, phone_e164, email, password_hash, role, status, locale) VALUES
  ('11111111-1111-4111-8111-111111111111', '+919876543210', 'sunita@demo.hfas', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8DoQgBLkBYfTR8u3dfQ8yPbxT0v9rW', 'patient',    'active', 'en-IN'),
  ('22222222-2222-4222-8222-222222222222', '+919812345678', 'arjun@demo.hfas',  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8DoQgBLkBYfTR8u3dfQ8yPbxT0v9rW', 'caseworker', 'active', 'en-IN'),
  ('33333333-3333-4333-8333-333333333333', '+919900112233', 'admin@demo.hfas',  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8DoQgBLkBYfTR8u3dfQ8yPbxT0v9rW', 'admin',      'active', 'en-IN')
ON CONFLICT DO NOTHING;

INSERT INTO profiles (user_id, full_name, date_of_birth, city, state, annual_income_inr, household_size) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Sunita Devi', '1986-03-14', 'Pune', 'Maharashtra', 240000, 4),
  ('22222222-2222-4222-8222-222222222222', 'Arjun Mehta', NULL, 'Pune', 'Maharashtra', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Eligibility rules use the JSON DSL understood by backend/src/eligibility
-- (all / any / not comparators). Match score = weighted share of met rules.
INSERT INTO schemes (id, slug, name, provider_type, provider_name, description, max_amount_inr, eligibility_rules, required_docs, helpline) VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001', 'hospital-care-subsidy',
   'Hospital Care Subsidy', 'govt', 'State Health Department',
   'Covers hospitalisation costs up to ₹2,00,000 per year for families below the state income threshold, including pre/post hospitalisation for 30 days.',
   200000,
   '[{"all":[{"field":"profile.annual_income_inr","op":"lte","value":300000},{"field":"onboarding.facility_type","op":"in","value":["govt","trust"]},{"any":[{"field":"onboarding.condition","op":"in","value":["cancer","cardiac","maternity","dialysis","other"]}]}]}]'::jsonb,
   '{aadhaar, hospital_invoice, income_proof, bank_passbook}',
   '1800-111-222'),

  ('aaaaaaa1-0000-4000-8000-000000000002', 'acmecare-topup',
   'AcmeCare Critical Top-up', 'insurer', 'AcmeCare Insurance',
   'Top-up reimbursement for critical procedures for existing AcmeCare policy holders.',
   150000,
   '[{"all":[{"field":"onboarding.condition","op":"in","value":["cardiac","cancer"]},{"field":"profile.annual_income_inr","op":"lte","value":800000},{"field":"profile.has_insurer_policy","op":"eq","value":true}]}]'::jsonb,
   '{aadhaar, hospital_invoice, income_proof, policy_document}',
   '1800-222-333'),

  ('aaaaaaa1-0000-4000-8000-000000000003', 'hope-trust-grant',
   'Hope Foundation Care Grant', 'trust', 'Hope Foundation (NGO)',
   'Flat grant for treatment costs at partner charitable hospitals; income-tested.',
   75000,
   '[{"all":[{"field":"profile.annual_income_inr","op":"lte","value":300000},{"field":"onboarding.facility_type","op":"in","value":["trust","govt"]}]}]'::jsonb,
   '{aadhaar, hospital_invoice}',
   '1800-333-444')
ON CONFLICT DO NOTHING;

-- Seeded draft application with reference INV-20260712-019 (30% progress).
INSERT INTO applications (id, user_id, scheme_id, reference, status, progress_pct, form_data, submitted_at) VALUES
  ('bbbbbbb1-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'aaaaaaa1-0000-4000-8000-000000000001',
   'INV-20260712-019', 'details', 30,
   '{"name":"Sunita Devi","dob":"1986-03-14","insurer":"AcmeCare","facility_type":"private","condition":"cardiac"}'::jsonb,
   NULL)
ON CONFLICT DO NOTHING;

-- Sample documents attached to the seeded application.
INSERT INTO documents (id, user_id, application_id, doc_type, status, storage_key, content_type, byte_size, original_name, ocr_fields, ocr_provider) VALUES
  ('ccccccc1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'bbbbbbb1-0000-4000-8000-000000000001',
   'aadhaar', 'parsed', 's3://hfas-documents/demo/aadhaar-sample.png', 'image/png', 284120, 'aadhaar-sample.png',
   '[{"label":"name","value":"Sunita Devi","confidence":0.98},{"label":"dob","value":"14/03/1986","confidence":0.96},{"label":"id_last4","value":"4218","confidence":0.99}]'::jsonb,
   'mock'),
  ('ccccccc1-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'bbbbbbb1-0000-4000-8000-000000000001',
   'hospital_invoice', 'parsed', 's3://hfas-documents/demo/invoice-sample.pdf', 'application/pdf', 1124004, 'invoice-sample.pdf',
   '[{"label":"invoice_no","value":"RHC/2026/07124","confidence":0.94},{"label":"amount_inr","value":"186400","confidence":0.97},{"label":"hospital","value":"Ruby Hall Clinic, Pune","confidence":0.95}]'::jsonb,
   'mock')
ON CONFLICT DO NOTHING;

-- Timeline entries for the seeded application.
INSERT INTO notifications (user_id, channel, template, payload, status, sent_at) VALUES
  ('11111111-1111-4111-8111-111111111111', 'inapp', 'application.submitted',  '{"reference":"INV-20260712-019","at":"2026-07-12T10:24+05:30"}', 'sent', '2026-07-12 10:24+05:30'),
  ('11111111-1111-4111-8111-111111111111', 'inapp', 'application.reviewing',  '{"reference":"INV-20260712-019","caseworker":"Arjun Mehta"}',   'sent', '2026-07-14 09:02+05:30'),
  ('11111111-1111-4111-8111-111111111111', 'inapp', 'application.approved',   '{"reference":"INV-20260712-019","amount_inr":148000}',          'sent', '2026-07-21 16:40+05:30')
ON CONFLICT DO NOTHING;

-- Caseworker assignment on the seeded application.
UPDATE applications
   SET assigned_caseworker_id = '22222222-2222-4222-8222-222222222222',
       status = 'under_review'
 WHERE id = 'bbbbbbb1-0000-4000-8000-000000000001';
