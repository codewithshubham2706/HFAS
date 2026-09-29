# Consent Form — HFAS (DRAFT TEMPLATE)

> **REQUIRES LEGAL REVIEW** before use. This template is what the in-app
> consent step renders and what `POST /applications/{id}/consent` records
> immutably (version, scopes, e-sign, IP, timestamp). Not legal advice.

_Consent version: **v1.0** (referenced by the `consent_version` API field)_

---

## Application consent (adult applicant)

I, **{FULL_NAME}** (date of birth {DOB}, application reference {REFERENCE}),
consent as follows:

### 1. What I am sharing

My application documents, as listed in the application (identity document,
hospital invoice/estimate, proof of income, bank details page), including
fields extracted from them by automated reading (OCR).

### 2. Who may receive them (tick all that apply)

- [ ] **{INSURER_NAME}** — to assess and process my reimbursement claim.
- [ ] **{HOSPITAL_NAME}** — to verify treatment and invoice details.
- [ ] **{GOVERNMENT_AGENCY}** — to determine my eligibility for the scheme.

### 3. What they may do with it

Verify my eligibility and process my application/claim. Processors may retain
copies per their legal retention duties. **They may not use my documents for
any other purpose.**

### 4. Automated reading (OCR)

I understand documents I upload are read automatically to pre-fill forms, and
that I can review and correct every extracted field before submission. I can
enter data manually if automated reading fails.

### 5. Withdrawal

I can withdraw consent for **future** sharing at any time via Settings →
Privacy. Withdrawal does not undo sharing that already happened under this
consent. **REQUIRES LEGAL REVIEW** — exact wording per DPDP §6(4)/GDPR.

### 6. Declaration

- [x] The information and documents I provide are true and belong to me or a
      person I am authorised to represent.
- [x] I am 18 or older *(or a parent/guardian completed § Parental consent)*.
- [x] I have read the Privacy Policy and understand my rights (access,
      correction, deletion).

### 7. Signature (e-sign)

Typed signature: **{ESIGN_NAME}** · Method: `{typed | aadhaar_esign | docusign}`
Signed at: `{TIMESTAMP}` from IP `{IP}` (stored for consent proof — **REQUIRES LEGAL REVIEW**)

---

## Parental consent (applications for a minor)

> **REQUIRES LEGAL REVIEW** — India: guardian under Majority Act / DPDP
> verifier rules (DPDP §9 requires DPIA-approved age gating); EU: member-state
> digital-consent ages 13–16.

I, **{GUARDIAN_NAME}**, confirm that:

- I am the parent/legal guardian of **{MINOR_NAME}** (DOB {MINOR_DOB});
- I consent to HFAS processing {MINOR_NAME}'s documents for application
  {REFERENCE} on their behalf;
- I accept the sharing scopes ticked above;
- I will exercise {MINOR_NAME}'s data rights until they turn 18.

Guardian e-sign: **{ESIGN_NAME}** · Relationship: {RELATIONSHIP}
ID verifiers accepted: `{aadhaar_esign | docusign | govt_id_upload}`
**REQUIRES LEGAL REVIEW** — verifiable parental consent method per jurisdiction.

---

## Records kept (for the audit ledger)

| Field | Stored |
|---|---|
| consent_version | e.g., v1.0 — points at this document |
| scopes | array of chosen recipients |
| esign_name, esign_method | typed/vendor envelope id |
| ip, user_agent | consent proof (**REQUIRES LEGAL REVIEW**) |
| signed_at | immutable timestamp |

Rows are never updated or deleted (see `consent_records` table);
retention 8 years — **REQUIRES LEGAL REVIEW**.
