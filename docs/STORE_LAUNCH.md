# Sella — App Store / Play Store launch pack

## Implemented in this repo

| Area | Status |
|---|---|
| Multi-tenant SQL + RLS (`user_id`) | `supabase/migrations/20261112010000_multitenant_saas_auth_payments.sql` |
| WhatsApp OTP send/verify | `supabase/functions/send-whatsapp-otp`, `verify-whatsapp-otp` |
| Reviewer bypass | Phone `+250780000000` → OTP `123456` |
| Paypack MoMo cashin + webhook | `paypack-cashin`, `paypack-webhook` |
| Manual MoMo / BK bank + receipt upload | `/subscribe` + `receipts` storage |
| Admin approve/reject | `/admin/payments` + `approve-manual-payment` |
| Account deletion (5.1.1) | Account → delete + `delete-account` function |
| Terms / Privacy | `/terms`, `/privacy` |
| Subscription guard + 7-day trial banner | `SubscriptionGuard` |
| Capacitor splash / status bar / safe areas | `capacitor.config.ts`, `index.html` viewport-fit |

## Pricing

- Trial: **7 days**
- Monthly: **RWF 5,000**
- Annual: **RWF 50,000**

## Your checklist (accounts only you can click)

1. Create Supabase project → run both migrations (workspaces optional legacy + `20261112010000_...`).
2. Deploy Edge Functions + set secrets from `.env.example`.
3. Meta WhatsApp Cloud / Twilio WhatsApp template approved.
4. Paypack Rwanda agent credentials + webhook URL.
5. Fill bank/MoMo merchant env vars.
6. Set one profile `is_superadmin = true` in SQL for payment approvals.
7. Apple Developer + App Store Connect (bundle `com.sella.app`).
8. Google Play Console + upload AAB after `npx cap sync android`.
9. TestFlight / Internal testing with reviewer phone.

## Shop identity + daily login

- **Shop names are unique** (case-insensitive) across the whole database.
- Every shop also gets a unique **shop code** like `SEL-A7K9M2` (system ID).
- Register with: shop name, owner name, **email**, **phone**, **4-digit PIN**.
- After signup: thank-you screen (email, phone, shop code) + welcome email when `RESEND_API_KEY` is set.
- **Every return visit**: app remembers the shop and opens the **PIN dial pad only** (no WhatsApp/email OTP daily).
- Edge functions: `register-shop`, `check-shop-name`, `pin-login`, `update-pin`.
- Activate cloud: `bash scripts/activate-backend.sh` (requires `supabase login`).

## Free email — yes, possible

| Option | Cost | Use |
|---|---|---|
| Supabase Auth SMTP (built-in) | Free (rate-limited) | Signup / OTP-style Auth emails |
| [Resend](https://resend.com) free tier | Free ~100 emails/day | Shop-code welcome + custom OTP |
| Custom SMTP in Supabase | Free if you use your mailbox | Higher control |

Set `RESEND_API_KEY` + `EMAIL_FROM` as Edge Function secrets for reliable delivery.

## Reviewer credentials

- Phone: **+250 780 000 000**
- WhatsApp OTP: **123456**
- PIN: any 4–6 digits chosen at registration
- Email: any valid address (reviewer can skip mailbox step)
