# Push this to your GitHub — 3 commands

The repo is fully staged and committed on branch `main` (208 files, single commit).
Run these **in this folder** using your own terminal (where you're logged into GitHub):

## Option A — GitHub CLI (if you have `gh` installed and logged in)

```bash
gh repo create HFAS --private --source=. --push
```

Done. Active link: `https://github.com/<your-username>/HFAS`

## Option B — Create repo on github.com, then push

1. Open https://github.com/new
2. Repository name: `HFAS` (or anything) · Private/Public your choice · **do not** tick "Add a README"
3. Click **Create repository**, copy the URL it shows, then:

```bash
git remote add origin https://github.com/<your-username>/HFAS.git
git push -u origin main
```

Your link: `https://github.com/<your-username>/HFAS`

## Option C — Authenticate push without gh

If push asks for credentials, use a **PAT as the password**
(Settings → Developer settings → Personal access tokens → generate classic token with `repo` scope),
or set up SSH:

```bash
git remote set-url origin git@github.com:<your-username>/HFAS.git
git push -u origin main
```

---

## After pushing — enable the GitHub Actions

The repo ships with 3 workflows (they activate automatically on push):

| Workflow | What it does | Where |
|---|---|---|
| **CI** | lint + typecheck + tests + `npm audit` SCA on every PR | `.github/workflows/ci.yml` |
| **Telemetry schema CI** | validates the 11 event schemas + PII sniff | `telemetry-schema.yml` |
| **Synthetic monitors** | Playwright runs every 30 min — set repo **Variables** `STAGING_WEB_URL` + `STAGING_API_URL` first, or disable the workflow until staging exists | `synthetic.yml` |

If you don't have staging yet, disable just the synthetic one:
**Settings → Actions → Synthetic monitors → Disable** (or delete the cron trigger).

## Repo settings worth flipping

- **About** → description: `Healthcare Financial & Administrative Support — prototype + NestJS/Next.js monorepo + behavioral telemetry`
- **Topics**: `healthcare`, `nestjs`, `nextjs`, `postgresql`, `ocr`, `dpdp`, `gdpr`
- **Branch protection** on `main` (require CI pass) if working with a team

## Sensitive-file check (already handled)

- `.env` is git-ignored; only `.env.example` (placeholders) is committed
- `node_modules/`, `dist/` excluded
- `.freebuff/` (local tool state) excluded
- All secrets in the tree are `<SET-ME>` placeholders or dev-only demo values
