# Launch checklist — Sella (Rwanda multi-business SaaS)

## A. Protect original owner data (do this first)

1. Keep any previous production backups offline before migration.
2. Export customers from production (CSV/JSON) before any migration.
3. After cloud auth is live, sign in as the **verified original owner**.
4. Open `/import-customers`, paste JSON, preview counts, import once.
5. Re-run import → expect `skipped` > 0, no duplicates.
6. Open `/debts` → **PDF** download still works (existing jsPDF format).

## B. Supabase (requires your account)

1. Create a **new** Supabase project for Sella.
2. Region: closest to Rwanda (e.g. `eu-central-1` / Frankfurt if no African region).
3. SQL Editor → run `supabase/migrations/20261112000000_saas_workspaces_billing.sql`.
4. Auth → Providers → Email ON; Confirm email ON for production.
5. Auth → URL config: Site URL + redirects for web + deep links.
6. Copy Project URL + anon key into `.env` (`VITE_DATA_MODE=cloud`).
7. Edge Functions secrets: `FLW_SECRET_KEY`, `FLW_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`.
8. Deploy functions:
   - `flutterwave-momo-charge`
   - `flutterwave-verify`
   - `flutterwave-webhook`
9. Test: register Business A and Business B → neither sees the other’s clients.

## C. Flutterwave + MTN MoMo payout (requires your account)

1. Create / log into [Flutterwave Dashboard](https://dashboard.flutterwave.com).
2. Complete **Business verification** (KYC) for Rwanda.
3. Settings → **Bank / Settlement** → add **MTN MoMo** wallet (your verified number).
4. Confirm settlement currency **RWF**.
5. API Keys → copy Test then Live secret/public keys into Edge Function secrets.
6. Settings → Webhooks → URL = `https://YOUR_PROJECT.supabase.co/functions/v1/flutterwave-webhook`
7. Set secret hash = `FLW_WEBHOOK_SECRET`.
8. Enable Rwanda Mobile Money collection.
9. **How you confirm first real payout:** make one live MoMo payment from a test phone → customer access unlocks immediately on verified payment → Flutterwave Settlements shows pending/paid to your MoMo → check MoMo SMS/balance.

Customer payment ≠ merchant payout. Access is granted when Flutterwave verifies the customer charge, even if your settlement is still pending.

## D. Website billing behaviour

- Price: `VITE_PLAN_PRICE_RWF=50000`
- Trial: one calendar month, stored in `trial_grants` (reinstall cannot restart)
- Early pay: unused days preserved (`computeNextPeriodEnd`)
- Expired: sign-in + view + PDF export OK; create/edit blocked by RLS `workspace_has_write_access`

## E. Google Play build (Capacitor Android)

1. Keep checkout **off** the Play build (no MoMo WebView / payment links in-app).
2. Users sign in with the same account; subscription purchased on **website** `/billing`.
3. Show plan status + “Manage on website” deep link / button.
4. Internal testing track → invite testers with two accounts for isolation.

## F. Apple / iOS (requires Apple Developer — your account)

1. Apple Developer Program enrolled.
2. App Store Connect → Agreements, Tax, Banking (Apple bank payout ≠ MoMo).
3. Create auto-renewable subscription product `APPLE_PRODUCT_ID_MONTHLY`.
4. Implement StoreKit 2 + server verify (next stage); Restore Purchases + Manage Subscription required.
5. Cancellation keeps access until `current_period_end`.
6. If `subscriptions.provider = flutterwave` and still active → do not sell another IAP; show status.
7. TestFlight external/internal testing.

## G. Two-business isolation test script

1. Register `a@test.com` and `b@test.com`.
2. As A: create clients + debt; export PDF.
3. As B: confirm empty list; try A’s debt UUID via API → RLS deny.
4. Expire A’s trial in SQL → A can still PDF export; A cannot insert client.
5. A pays MoMo (test) → write access returns; expiry extended.
6. Send duplicate webhook → access extended once only.
7. Switch accounts on one device → caches cleared (`sessionIsolation`).

## H. What only you can click

| Step | Who |
|---|---|
| Supabase project + SQL | You |
| Flutterwave KYC + MoMo settlement | You |
| Apple agreements / banking / IAP product | You |
| Play Console upload | You |
| First live MoMo to your wallet | You (confirm SMS/balance) |
| Code, migrations, functions, tests | Cursor agent |

## I. App code readiness (done in repo)

- Dual mode: `VITE_DATA_MODE=local` (Dexie demo) or `cloud` (Supabase + workspaces)
- Facade: `src/db/api.ts` routes all business CRUD local ↔ cloud
- Write gates on debts, inventory, clients, sales, dashboard resets
- Auth: email/password cloud pages + local PIN auth
- Billing page + Flutterwave Edge Functions (charge / verify / webhook)
- Import customers + PDF export preserved
- Account page at `/account`
- Go-live still needs **your** Supabase + Flutterwave steps in B–C above
