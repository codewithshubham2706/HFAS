# Privacy Policy — HFAS (DRAFT)

> **REQUIRES LEGAL REVIEW** — India (DPDP Act 2023), EU (GDPR), US (state laws,
> HIPAA where applicable) before publication. Replace `[COMPANY]`,
> `[CONTACT_DPO]`, `[JURISDICTION]` with your registered entity details.
> This draft is a starting point, not legal advice.

_Last updated: {LAST_UPDATED} · Version 1.0-draft_

[COMPANY] ("we", "us") operates the Hospital & Family Assistance Scheme (HFAS)
platform, which helps patients and caregivers discover, apply for, and track
financial and administrative healthcare support.

## 1. Plain-language summary

- We collect only what we need to match you with schemes and process applications.
- Your identity documents and extracted data are encrypted; access is logged.
- We share your documents with an insurer, hospital, or government agency
  **only after you tick the consent box and e-sign** for that specific share.
- You can download, correct, or delete your data from Settings → Privacy at any time.
- We **never** sell your data, and we do not use it to train AI models.
- HFAS is not a medical service and does not provide medical advice.

## 2. Data we collect (data map)

| # | Field / data | Purpose | Legal basis | Retention | Encrypted |
|---|---|---|---|---|---|
| 1 | Phone number / email | Account, OTP login, status notifications | Contract performance (GDPR 6(1)(b); consent for marketing copies) | Life of account + 30 days | In transit (TLS) |
| 2 | Name, DOB, address | Application forms, scheme eligibility | Contract performance | 7 years after decision **REQUIRES LEGAL REVIEW** | At rest (AES-256) |
| 3 | National ID (e.g., Aadhaar) | Identity verification required by schemes | Consent (you choose to provide; DPDP §6) | Until deletion request approved | **Column-level AES-256-GCM via KMS** |
| 4 | Income, household size | Eligibility scoring | Contract performance | 7 years after decision **REQUIRES LEGAL REVIEW** | At rest |
| 5 | Uploaded documents (ID, invoices, passbook) | OCR extraction, application evidence | Consent | 7 years after decision **REQUIRES LEGAL REVIEW** | SSE-KMS object storage |
| 6 | OCR-extracted fields | Prefill forms | Contract performance | Same as source document | Column-encrypted |
| 7 | Consent records (scopes, e-sign, IP, timestamp) | Prove lawful basis for sharing | Legal obligation | 8 years **REQUIRES LEGAL REVIEW** | Immutable ledger |
| 8 | Application status history | Timeline, support, appeals | Contract performance | 7 years after decision | At rest |
| 9 | Audit logs (who accessed what, when) | Security, legal compliance | Legitimate interest / legal obligation | 3 years **REQUIRES LEGAL REVIEW** | Append-only |
| 10 | Device/IP, cookie preferences | Security, consent proof | Legitimate interest / consent | 13 months | — |
| 11 | Support chat messages | Customer support | Contract performance | 24 months | At rest |

We do **not** collect: precise geolocation, biometrics, health records beyond
what a scheme requires, or payment card numbers (payments are out of scope;
if enabled later, PCI-DSS applies — **REQUIRES LEGAL REVIEW**).

## 3. Who we share with (processors & third parties)

| Vendor | Service | Data shared | Agreement |
|---|---|---|---|
| Cloud hosting (AWS) | Infrastructure, KMS, S3 | All of the above (encrypted) | DPA required — see ComplianceReport |
| SMS/email provider (Twilio/SendGrid) | OTP + notifications | Phone/email, status text | DPA + SCCs if cross-border |
| Google Cloud Vision (optional OCR) | Document text extraction | Document images | **REQUIRES LEGAL REVIEW** — citizen documents leave our tenancy; verify no-training clause |
| e-sign provider (DocuSign or eSign/OTP-based) | Consent signing | Name, email, consent text hash | **REQUIRES LEGAL REVIEW** |
| Insurer / hospital / government agency | Application processing | Only what you consented to | Your explicit consent record |
| Caseworkers (authorised staff) | Application review | Your application + documents | Employment contract + access audit |

A current, machine-readable list lives at `GET /data-requests/export`.

## 4. Your rights

Available in-app under **Settings → Privacy** (also via `[CONTACT_DPO]`):

- **Access** — download everything we hold (JSON export).
- **Correction** — request fixes; reviewed by our team within 5 working days.
- **Deletion** — 30-day grace period, then permanent purge of documents,
  OCR data and form data. We keep only what law requires: consent records,
  audit stubs (no PII), and scheme-mandated records — see `infra/retention.yaml`.
- **Withdraw consent** — stop future sharing; past processing remains lawful.
- **Grievance** — India: escalate to the Grievance Officer named at `[CONTACT_DPO]`
  (DPDP §13); response within 30 days.
- **EU users** — you may also lodge a complaint with your supervisory authority.

We respond to all requests within 30 days (DPDP) / one month (GDPR).

## 5. Children

HFAS is for users 18+. Applications **for** minors are filed by a parent or
guardian, who must complete the parental consent flow (see `ConsentForm.md`
§ Parental consent). If we learn a minor created an account, it is suspended
and data deleted. **REQUIRES LEGAL REVIEW** for age-verification approach.

## 6. Medical disclaimer

HFAS assists with financial and administrative paperwork. We do not provide
medical advice, diagnosis, treatment, or emergency services. Nothing in the
platform is a substitute for professional medical judgement. In an emergency,
contact your local emergency number.

## 7. Security

- TLS 1.2+ everywhere; HSTS; strict CSP.
- National ID: AES-256-GCM column encryption, DEKs wrapped by KMS CMK, annual
  key rotation; decryption audited.
- Documents: S3 SSE-KMS, TLS-only bucket policy, 25 MB cap, type allowlist.
- Access control: least-privilege roles (patient / caregiver / caseworker /
  admin); caseworker access to citizen data is logged to an append-only trail.
- OTP: hashed, 5-minute expiry, max 5 attempts. Refresh tokens rotated on use.
- Pen-test before public launch (**REQUIRES LEGAL REVIEW** / security sign-off).

## 8. International transfers

Primary region: `ap-south-1` (India). If processors operate outside India/EU,
transfers rely on SCCs / DPDP-compliant contractual clauses.
**REQUIRES LEGAL REVIEW** per vendor.

## 9. Changes

Material changes are announced in-app 14 days before they take effect; the
consent version (`consent_version`) is bumped and re-consent requested where
required.

## 10. Contact

Data Protection Officer / Grievance Officer: `[CONTACT_DPO]`
Registered entity: `[COMPANY], [ADDRESS]`
