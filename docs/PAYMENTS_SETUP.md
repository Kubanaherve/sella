# Sella payments setup (MTN · Airtel · Visa/Mastercard)

Checkout lives at `/subscribe` (Billing redirects here).

## What the app already does

| Method | Provider | Flow |
|--------|----------|------|
| MTN MoMo (instant) | **Paypack** | STK prompt → webhook unlocks subscription |
| Airtel Money (instant) | **Paypack** | Same |
| Visa / Mastercard | **Flutterwave** | Flip-card UI → encrypted charge → OTP / 3DS → webhook |
| Manual MTN / Airtel / Bank | You + admin approve | User pastes TxId (+ optional receipt) |

## 1. Fill merchant placeholders (shown in-app)

In `.env` (and rebuild the app):

```bash
VITE_MOMO_MERCHANT_NAME=Your Shop / Sella
VITE_MOMO_MERCHANT_CODE=*182*8*1#          # or MoMo Pay code
VITE_MOMO_MERCHANT_PHONE=+2507XXXXXXXX
VITE_AIRTEL_MERCHANT_NAME=Your Shop / Sella
VITE_AIRTEL_MERCHANT_CODE=*500*1#
VITE_AIRTEL_MERCHANT_PHONE=+2507XXXXXXXX
VITE_BANK_NAME=Bank of Kigali (BK)
VITE_BANK_ACCOUNT_NAME=...
VITE_BANK_ACCOUNT_NUMBER=...
VITE_BANK_SWIFT=BKIGRWRW
```

These only affect **manual** transfer screens. Instant MoMo uses Paypack (money lands in your Paypack merchant wallet).

## 2. Paypack (MTN + Airtel STK) — required for instant MoMo

1. Create a merchant account at [paypack.rw](https://paypack.rw).
2. Create an application → copy **Client ID** + **Client Secret**.
3. In Supabase → Project → Edge Functions → Secrets:

```text
PAYPACK_CLIENT_ID=...
PAYPACK_CLIENT_SECRET=...
PAYPACK_WEBHOOK_SECRET=pick-a-long-random-string
PAYPACK_ENV=production   # or sandbox if Paypack gives you one
```

4. In Paypack dashboard, set webhook URL to:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paypack-webhook
```

Send the same secret as header `x-webhook-secret` or `x-paypack-signature` (or `Authorization: Bearer …`).

5. Deploy functions:

```bash
supabase functions deploy paypack-cashin
supabase functions deploy paypack-webhook
```

## 3. Flutterwave (Visa / Mastercard) — required for cards

1. Create account at [dashboard.flutterwave.com](https://dashboard.flutterwave.com).
2. Complete KYC for **Rwanda** and enable **Card** collections (RWF).
3. Settings → API → copy **Secret key**, **Encryption key**, and optionally Public key.
4. Supabase secrets:

```text
FLW_SECRET_KEY=FLWSECK_TEST-...   # use LIVE keys in production
FLW_ENCRYPTION_KEY=...
FLW_WEBHOOK_SECRET=same-as-flutterwave-verif-hash
APP_URL=https://your-app-domain   # used for 3DS redirect return
```

5. Flutterwave → Settings → Webhooks:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/flutterwave-webhook
```

Set the secret hash to match `FLW_WEBHOOK_SECRET`.

6. Deploy:

```bash
supabase functions deploy flutterwave-card-charge
supabase functions deploy flutterwave-card-validate
supabase functions deploy flutterwave-payment-verify
supabase functions deploy flutterwave-webhook
```

7. Apply DB migration (adds `card_flutterwave` payment method):

```bash
supabase db push
# or apply supabase/migrations/20261113120000_card_payment_methods.sql
```

## 4. Manual payments admin

Pending TxId payments appear for approval via `approve-manual-payment` (admin). Deploy that function if not already live, and use the Admin Payments screen to mark completed.

## 5. Test cards (Flutterwave test mode)

Use Flutterwave’s published test Visa/Mastercard numbers from their docs (e.g. `5531886652142950`) with any future expiry and the CVV they specify. Never use real cards against TEST keys or test cards against LIVE keys.

## 6. Go-live checklist

- [ ] Paypack LIVE credentials + webhook returns 200
- [ ] Flutterwave LIVE keys + card collections approved for RWF
- [ ] Webhooks both hit Supabase URLs over HTTPS
- [ ] Merchant phone / bank placeholders replaced
- [ ] One real MTN, one Airtel, one card payment each unlocks `/account` access
- [ ] iOS builds still offer Apple IAP path (App Store rule)

## Security notes

- Card PAN/CVC never touch your database — only encrypted to Flutterwave from the Edge Function.
- Do not log card fields.
- Paypack/Flutterwave secrets stay in Supabase secrets only (never `VITE_*`).
