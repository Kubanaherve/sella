#!/usr/bin/env bash
# Activate Sella cloud backend on a DEDICATED Supabase project.
# Do NOT apply legacy Jan-2026 / workspace migrations on a fresh project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REF="${SUPABASE_PROJECT_REF:-mbxrnguxllagqqqutytz}"

PROD_MIGRATIONS=(
  "supabase/migrations/20261112010000_multitenant_saas_auth_payments.sql"
  "supabase/migrations/20261112020000_shop_codes_email_identity.sql"
  "supabase/migrations/20261112030000_unique_shop_names.sql"
  "supabase/migrations/20261112040000_production_security_hardening.sql"
)

echo "==> Linking project $REF"
supabase link --project-ref "$REF" || true

echo "==> Applying PRODUCTION migrations only (via SQL editor / db execute)"
echo "    Prefer: supabase db push --include-all  ONLY after legacy migrations are removed from remote history,"
echo "    OR paste these files in order in the Supabase SQL editor:"
for m in "${PROD_MIGRATIONS[@]}"; do
  echo "    - $m"
done

if [[ "${APPLY_SQL:-}" == "1" ]]; then
  for m in "${PROD_MIGRATIONS[@]}"; do
    echo "  → applying $m"
    supabase db execute -f "$m" --project-ref "$REF"
  done
fi

echo "==> Deploying Edge Functions"
FUNCS=(
  register-shop
  pin-login
  check-shop-name
  update-pin
  send-whatsapp-otp
  verify-whatsapp-otp
  send-email-otp
  verify-email-otp
  paypack-cashin
  paypack-webhook
  approve-manual-payment
  delete-account
  subscription-expiry-reminders
)

for f in "${FUNCS[@]}"; do
  if [[ -d "supabase/functions/$f" ]]; then
    echo "  → $f"
    supabase functions deploy "$f" --project-ref "$REF"
  fi
done

echo "==> Required secrets (set via: supabase secrets set KEY=value --project-ref $REF)"
cat <<'EOF'
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_ANON_KEY
  RESEND_API_KEY
  EMAIL_FROM
  PAYPACK_CLIENT_ID
  PAYPACK_CLIENT_SECRET
  PAYPACK_WEBHOOK_SECRET
  ENABLE_REVIEWER_BYPASS=false
EOF

echo "==> App .env: VITE_DATA_MODE=cloud + real VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY"
echo "Done."
