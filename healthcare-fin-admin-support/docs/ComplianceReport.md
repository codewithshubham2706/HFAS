# ComplianceReport.md — HFAS (DRAFT — review with counsel)

> Every item is labelled **OK** / **Needs Attention** / **REQUIRES LEGAL REVIEW**.
> This report is a working checklist, not a legal opinion. Owners and dates to
> be filled by your DPO/counsel. Not legal advice.

_Report date: {DATE} · Scope: MVP launch (India), EU-ready, US-aware_

## 1. Vendor checklist

For each vendor: fetch the latest ToS + DPA, verify the clauses listed, record
verdict + remediation. Quote exact clause lines in your copy of this file.

### 1.1 Google Cloud Vision (OCR adapter)
| Check | Where | Clauses to verify | Verdict |
|---|---|---|---|
| Data processing terms | https://cloud.google.com/terms/data-processing-terms | purpose limitation, subprocessor list, deletion on termination | **REQUIRES LEGAL REVIEW** |
| No training on customer data | Service-Specific Terms → Generative AI / Vision | confirm uploaded documents are NOT used to train models; opt-out flags | **REQUIRES LEGAL REVIEW** |
| Data location | console region settings | pin `asia-south1` processing if possible | Needs Attention |
| Retention | DPA § | logs retaining extracted text? set 0 | **REQUIRES LEGAL REVIEW** |
| Exit / portability | DPA § | export + certified deletion within X days | Needs Attention |
| Citizen documents leave tenancy | — | DPIA required (DPDP §10 / GDPR Art. 35) | **REQUIRES LEGAL REVIEW** |

### 1.2 Twilio (SMS/OTP)
ToS: https://www.twilio.com/legal/terms · DPA: https://www.twilio.com/legal/data-policy
| Check | Clauses | Verdict |
|---|---|---|
| Phone numbers as PII; retention | DPA — message logs retention (default 13 months; reduce) | Needs Attention |
| India DLT registration for transactional SMS | TRAI regulation; template IDs | **REQUIRES LEGAL REVIEW** (mandatory before launch) |
| Subprocessors | list published; SCCs for transfers | OK (verify version) |
| OTP content | never include codes in promotional templates | OK |

### 1.3 SendGrid (email)
ToS: https://www.twilio.com/en-us/legal/sendgrid-terms-conditions (same group)
| Check | Verdict |
|---|---|
| DPA + SCCs current version | OK — verify annually |
| Suppression list vs our deletion duty | **REQUIRES LEGAL REVIEW** — email addresses in their suppression list |
| Domain authentication (SPF/DKIM/DMARC) | Needs Attention — set up before launch |

### 1.4 Stripe (payments — DISABLED in MVP)
| Check | Verdict |
|---|---|
| PCI-DSS scope: use Stripe Checkout/Elements only, never raw PANs | **REQUIRES LEGAL REVIEW** + SAQ-A before enabling |
| Refund/dispute workflows | Needs Attention |
| Indian entity requirements (RBI PA/PG guidelines) | **REQUIRES LEGAL REVIEW** |

### 1.5 AWS (hosting, S3, KMS)
| Check | Verdict |
|---|---|
| AWS DPA + Art. 28 GDPR terms (auto-included) | OK |
| S3: SSE-KMS, TLS-only, public access blocked | OK (encoded in infra plan) |
| KMS CMK policy: app role Encrypt/Decrypt only; annual rotation | Needs Attention — encode in Terraform |
| Config rules: encryption checks, public-bucket alarms | Needs Attention |

### 1.6 e-signature (DocuSign or Indian eSign/NSDL)
| Check | Verdict |
|---|---|
| Indian IT Act validity of typed e-sign for this claim type | **REQUIRES LEGAL REVIEW** (may require Aadhaar eSign) |
| DPA: envelope retention & exit export | Needs Attention |

## 2. Open-source licenses

Run `npm run licenses:check` (scripts/check_licenses.mjs). Policy:
MIT/BSD/Apache/ISC = OK; GPL/LGPL/AGPL/MPL/EPL/Unknown = **REQUIRES LEGAL REVIEW**
(copyleft in SaaS: AGPL is the risk case — keep it out of backend deps).
Record output in this file per release. Font/asset licenses: design/ASSET_LICENSES.md.

## 3. AI / IP risk assessment

| Risk | Assessment | Action |
|---|---|---|
| OCR vendor model training on citizen documents | **REQUIRES LEGAL REVIEW** — confirm no-training clause (§1.1) | Contractual opt-out; DPIA |
| AI-extracted fields wrong → harm to applicant | Needs Attention — confidence thresholds + mandatory human review of fields before submit (implemented in UI) | Keep |
| Generated code/assets copyright | Code in this repo is MIT; Lottie placeholders are original | OK; replace placeholders with licensed finals |
| Training our own models on user data | We do NOT | Keep prohibition in PrivacyPolicy §1 |

## 4. Security checklist

- [x] TLS 1.2+, HSTS, CSP (report-only → enforce after QA), X-Frame-Options DENY — `main.ts`, `next.config.js`
- [x] Field encryption: AES-256-GCM envelope; dev HKDF fallback **blocked in production** (`field-crypto.service.ts` guard)
- [x] KMS notes: CMK per env; Encrypt/Decrypt-only app role; annual rotation runbook below
- [x] Append-only audit logs with DB trigger; PII reads by staff always audited
- [x] RBAC: patient/caregiver/caseworker/admin + guards on every staff route
- [x] OTP hashed (SHA-256+pepper), 5-min TTL, 5-attempt lock; refresh rotation on use
- [x] Upload validation: type allowlist, 25 MB cap, checksum confirmation
- [x] Uniform login errors (no user enumeration)
- [ ] Secrets rotation runbook: quarterly JWT secrets; KMS annual; document in runbook — Needs Attention
- [ ] Rate limiting on auth endpoints (add token bucket at ALB/WAF) — Needs Attention
- [ ] External pen-test before public launch — **REQUIRES LEGAL REVIEW**/sign-off
- [ ] Backups: RDS PITR + quarterly restore drill — Needs Attention

### KMS rotation runbook (summary)
1. Create new CMK version → 2. Update alias `hfas-fields` → 3. Old key retained
for decrypt-only 90 days → 4. Re-encrypt hot rows (lazy on read) → 5. Audit
decrypt failures → 6. Schedule old-key deletion after grace.

## 5. Data deletion procedure

1. User requests deletion (Settings → Privacy) → `deletion_requests` row (received).
2. Admin reviews queue → approve → `users.status = 'deletion_pending'`.
3. 30-day grace (undo window) per `infra/retention.yaml`.
4. Deletion executor (daily job):
   - S3 objects deleted (versioned + delete markers purged);
   - `documents` rows: OCR text/fields nulled, row tombstoned;
   - `applications.form_data` cleared; profile fields anonymized;
   - `consent_records` RETAINED (lawful-basis proof) — **REQUIRES LEGAL REVIEW**;
   - `audit_logs` reduced to stubs (actor nulled, metadata emptied), never deleted;
   - vendor-side deletion requests sent (Twilio/SendGrid suppression, OCR provider).
5. Completion recorded on the request row; user notified.

## 6. Age gating & minors

- Age self-declaration at signup; minor applications via guardian consent flow
  (`ConsentForm.md § Parental consent`).
- DPDP §9 requires verifiable parental consent + DPIA for child data processing —
  **REQUIRES LEGAL REVIEW** for mechanism (AADHAAR eSign / DigiLocker verifier).

## 7. Prioritized launch checklist

1. Legal: Privacy/Terms/Cookie/Consent approved by counsel (India first) — **REQUIRES LEGAL REVIEW**
2. DLT registration for SMS templates — **REQUIRES LEGAL REVIEW**
3. DPIA covering OCR vendor + staff access model — **REQUIRES LEGAL REVIEW**
4. SCA clean (npm audit high=0) + license scan clean
5. Pen-test completed; criticals fixed — **REQUIRES LEGAL REVIEW**/sign-off
6. Rate limiting + WAF in front of auth — Needs Attention
7. Backups + restore drill — Needs Attention
8. Insurer/govt connector contracts signed — **REQUIRES LEGAL REVIEW**
9. Support & grievance staffing per DPDP §13 — Needs Attention
10. Cookie banner verified: no third-party scripts pre-consent — OK (implemented)
