# Preparing Airtel + MTN while credentials are pending

## Stack reminder

SELLA is **React + Vite + TypeScript + Capacitor 8 + Supabase** (not Flutter).  
Repo: https://github.com/Kubanaherve/sella.git

## Architecture (already wired)

```
SELLA app → Select plan → Choose MTN / Airtel / Card
        → payment backend (Edge Functions)
        → provider collect (test | Paypack | Airtel Open API | MTN MoMo)
        → webhook / test-confirm / admin verify
        → subscription_payments completed
        → user_subscriptions +30 days
        → reminders at 7 / 3 / 2 / 1 / 0 days
        → expire access
```

## Airtel Money — do this now

1. Open https://developers.airtel.africa  
2. Select **Rwanda**  
3. Create a developer account + application  
4. Enable **Collection** APIs  
5. Copy sandbox `client_id` / `client_secret`  
6. Set Supabase secrets:

```text
AIRTEL_CLIENT_ID=...
AIRTEL_CLIENT_SECRET=...
AIRTEL_ENV=sandbox
```

7. Redeploy `paypack-cashin` (uses shared provider resolver).  
   When Airtel secrets exist, Airtel network routes to Open API automatically.

Sandbox base: `https://openapiuat.airtel.africa`  
Production later: `https://openapi.airtel.africa` (after KYC / contract).

## MTN MoMo — while waiting for activation

Portal: https://momodeveloper.mtn.com  

When approved, you will receive:

- Subscription key (Collection product)
- API User + API Key  
- Target environment (`sandbox` then `production`)

Set:

```text
MTN_MOMO_SUBSCRIPTION_KEY=...
MTN_MOMO_API_USER=...
MTN_MOMO_API_KEY=...
MTN_MOMO_ENV=sandbox
MTN_MOMO_TARGET_ENV=sandbox
```

Until then, leave `PAYMENT_MODE=test` so the app records pending payments without pretending money moved.

## Test lifecycle (no real money)

1. Set `PAYMENT_MODE=test` and `ENABLE_TEST_PAYMENTS=true` in Supabase secrets.  
2. Deploy `test-payment-confirm`.  
3. On `/subscribe`, choose MTN or Airtel → Pay.  
4. UI shows **Confirm test payment** (explicit — not automatic success).  
5. Confirm → `subscription_payments.completed` + 30-day `user_subscriptions`.  
6. Admin `/admin` shows stats; `/admin/payments` shows the ledger.

## Company identity (KYC alignment)

| Item | Value |
|------|--------|
| Company | KUBANA FRIEND TECHNOLOGIES |
| Product | SELLA |
| Merchant brand | SELLA |
| Founder | Hervé Friend Kubana |
| Business email | `VITE_BUSINESS_EMAIL` / `hello@sella.app` |

Keep MTN / Airtel merchant registration under the same legal entity.
