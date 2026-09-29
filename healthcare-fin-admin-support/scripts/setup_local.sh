#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# HFAS — local dev bootstrap
# Usage: bash scripts/setup_local.sh
# ═════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▸ 1/6 Checking prerequisites…"
command -v docker >/dev/null || { echo "✗ docker is required"; exit 1; }
docker compose version >/dev/null || { echo "✗ docker compose v2 is required"; exit 1; }
node --version >/dev/null || { echo "✗ node 20+ is required"; exit 1; }

echo "▸ 2/6 Creating .env (if missing)…"
if [ ! -f .env ]; then
  cp .env.example .env
  # Local-only dev keys — safe defaults, still flagged for replacement in prod.
  sed -i.bak \
    -e 's|JWT_ACCESS_SECRET=<SET-ME>|JWT_ACCESS_SECRET=dev-access-secret-change-me|' \
    -e 's|JWT_REFRESH_SECRET=<SET-ME>|JWT_REFRESH_SECRET=dev-refresh-secret-change-me|' \
    -e 's|FIELD_ENCRYPTION_DEV_KEY=<SET-ME>|FIELD_ENCRYPTION_DEV_KEY=dev-field-key-change-me|' \
    -e 's|WEBHOOK_SIGNING_SECRET=<SET-ME>|WEBHOOK_SIGNING_SECRET=dev-webhook-secret-change-me|' \
    .env && rm -f .env.bak
  echo "  ✓ wrote .env with dev defaults (TODO(org): replace before any real deployment)"
else
  echo "  • .env already exists, leaving it alone"
fi

echo "▸ 3/6 Starting docker stack (db, storage, api, web)…"
docker compose up -d --build

echo "▸ 4/6 Waiting for Postgres…"
for i in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U hfas -d hfas >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "▸ 5/6 Verifying migrations + seed landed…"
SCHEMES=$(docker compose exec -T db psql -U hfas -d hfas -tAc "SELECT count(*) FROM schemes;")
APPS=$(docker compose exec -T db psql -U hfas -d hfas -tAc "SELECT count(*) FROM applications;")
echo "  schemes=$SCHEMES applications=$APPS"
if [ "${SCHEMES:-0}" -lt 3 ]; then
  echo "  ⚠ seed missing — applying manually…"
  docker compose exec -T db psql -U hfas -d hfas -f /docker-entrypoint-initdb.d/05-create_tables.sql
  docker compose exec -T db psql -U hfas -d hfas -f /docker-entrypoint-initdb.d/10-seed_data.sql
fi

echo "▸ 6/6 Done."
cat <<'EOF'

  Frontend  → http://localhost:3000
  API       → http://localhost:4000  (Swagger UI: /docs)
  MinIO UI  → http://localhost:9001  (hfas / hfas-secret-123)
  DB        → localhost:5432 (hfas/hfas)

  Demo logins (local only — OTP_DEV_MODE=true returns codes in API responses):
    patient    sunita@demo.hfas  / hfas-Demo-2026!
    caseworker arjun@demo.hfas   / hfas-Demo-2026!
    admin      admin@demo.hfas   / hfas-Demo-2026!

EOF
