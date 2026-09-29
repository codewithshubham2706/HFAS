# Terraform skeleton — AWS notes

This directory intentionally contains **no .tf files yet** — it documents the
target layout and review gates so infra-as-code can be authored per org.
Scaffold with `terraform init` once files exist.

## Suggested layout

```
infra/terraform/
├─ providers.tf       # aws provider, default tags (project=hfas, env)
├─ network.tf         # VPC, private subnets for ECS + RDS, no public DB
├─ data.tf            # RDS Postgres 15 (storage_encrypted, backup window)
├─ storage.tf         # S3 bucket: SSE-KMS default, TLS-only bucket policy, versioning, 30d lifecycle to IA
├─ kms.tf             # CMK for field encryption + S3; key rotation enabled
├─ compute.tf         # ECS Fargate service (api) + ALB (TLS 1.2+, HSTS via headers)
├─ secrets.tf         # Secrets Manager entries; app IAM role scoped per secret
└─ outputs.tf
```

## Guardrails to encode

- **S3**: block public access; enforce `aws:SecureTransport`; default encryption
  `aws:kms` with the CMK; Object Lock optional for consent artifacts
  (**REQUIRES LEGAL REVIEW** whether consent needs WORM retention).
- **RDS**: `storage_encrypted = true`, deletion protection, automated backups
  ≥ 7 days, no public accessibility, security group only from ECS SG.
- **KMS**: one CMK for field-level encryption (app role allowed
  `kms:Encrypt/Decrypt/GenerateDataKey` only), separate key for S3.
  Annual rotation; see rotation runbook in docs/ComplianceReport.md.
- **Secrets**: Terraform writes only *placeholders*; real values go in via
  Secrets Manager console/CLI by a human (never in git, never in plan output).
- **GCP/Azure adaptation**: swap provider + managed Postgres (Cloud SQL /
  Flexible Server), object storage (GCS / Blob with CMK), KMS (Cloud KMS /
  Key Vault). OCR adapter stays pluggable (see backend/src/ocr).
