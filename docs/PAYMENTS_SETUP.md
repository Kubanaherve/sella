# Sella payments & subscriptions (production)

## Architecture (required flow)

```
User → Paypack/Flutterwave request
     → MTN MoMo / Airtel Money / Card
     → Provider webhook (signed)
     → Backend verifies + matches unique reference
     → subscription_payments.status = completed
     → user_subscriptions active for exactly 30 days (monthly) or 365 (annual)
```

**Never** activate a subscription because the user tapped Pay. Activation happens only after provider confirmation (webhook / FLW verify / admin TxId approve).

Payments (`subscription_payments`) are stored separately from subscriptions (`user_subscriptions`) so you can investigate “money sent but not unlocked”.

---

## Status legend

| What | Ready? | Needs from you |
|------|--------|----------------|
| Checkout UI + logos + card popup | **Done** | Restart Vite |
| Paypack MTN/Airtel STK request | **Implemented** | `PAYPACK_*` secrets + merchant |
| Paypack webhook → 30-day unlock | **Implemented** | Webhook URL + secret |
| Flutterwave Visa/MC | **Implemented** | `FLW_*` secrets + Rwanda KYC |
| Manual MTN/Airtel/Zigama + admin approve | **Done** | Your merchant numbers (already set for MTN/Zigama) |
| Admin transaction monitor | **Done** | Superadmin account |
| In-app billing notifications | **Done** (DB rows) | Cron for expiry reminders |
| WhatsApp/email push on pay | **Partial** | Wire Resend / WhatsApp to `billing_notifications` |
| Live sandbox proof | **Blocked until credentials** | Paypack sandbox or FLW test keys |

---

## 1. Merchant details (manual screens)

Already in `.env` for your shop:

- MTN: `+250796580545`
- Zigama account: `7081032`

Change anytime in `.env`, restart Vite.

---

## 2. Paypack (MTN + Airtel instant)

1. [paypack.rw](https://paypack.rw) → create merchant app  
2. Supabase → Edge Functions → Secrets:

```text
PAYPACK_CLIENT_ID=...
PAYPACK_CLIENT_SECRET=...
PAYPACK_WEBHOOK_SECRET=long-random-string
PAYPACK_ENV=production
# optional:
PAYPACK_REVERIFY=true
PLAN_PRICE_MONTHLY_RWF=5000
PLAN_PRICE_ANNUAL_RWF=50000
```

3. Webhook URL:

```text
https://ixihbqubatyfulnurpco.supabase.co/functions/v1/paypack-webhook
```

Send secret as `x-webhook-secret` / `x-paypack-signature` / `Authorization: Bearer …`.

4. Deploy (already done in this session when CLI works):

```bash
supabase functions deploy paypack-cashin paypack-webhook payment-status
```

---

## 3. Flutterwave (Visa / Mastercard)

1. [dashboard.flutterwave.com](https://dashboard.flutterwave.com) → Rwanda KYC → enable cards (RWF)  
2. Secrets:

```text
FLW_SECRET_KEY=...
FLW_ENCRYPTION_KEY=...
FLW_WEBHOOK_SECRET=same-as-dashboard-verif-hash
APP_URL=https://your-domain
```

3. Webhook:

```text
https://ixihbqubatyfulnurpco.supabase.co/functions/v1/flutterwave-webhook
```

4. Test cards: use Flutterwave **test** keys + their published test Visa/MC numbers only.

---

## 4. Cron (expiry + stale pending)

Schedule daily:

```text
POST /functions/v1/subscription-expiry-reminders
Header: x-cron-secret: <CRON_SECRET>
```

This:

- flips due `user_subscriptions` to `expired`
- marks payments pending >24h as `expired_pending`
- inserts “expiring in 3 days” / “expired” into `billing_notifications`

---

## 5. Admin

Open `/admin/payments` as superadmin:

- All / pending / completed / rejected / cancelled / expired_pending  
- Provider, refs, dates, user subscription end  
- Approve/reject manual TxIds (discrepancy handling)

---

## 6. How to prove one full sandbox cycle

1. Set Paypack **sandbox** (if available) or Flutterwave **TEST** keys.  
2. Start a monthly payment from `/subscribe`.  
3. Confirm: `subscription_payments` row is `pending` with unique `reference_id`.  
4. Complete provider sandbox approval / test card.  
5. Webhook fires → row `completed` → `user_subscriptions.current_period_end` ≈ now+30d.  
6. Confirm Account shows active access; after mocking end date in past, write access locks.

Until step 1 credentials exist, the app correctly **refuses** to pretend success.
