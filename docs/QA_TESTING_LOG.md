# Sella QA testing log (persistent)

Append-only session notes. Do not invent pass counts.

## 2026-11-14 — Follow-up (money + security audit fixes)

### Fixes applied
1. **PaymentModal** — `toRwf` for amount parse; `submitting` disables double-confirm; awaits async `onConfirm`.
2. **Debts** — `paymentBusy` guard; WhatsApp opens **after** successful `recordPayment`; `totalUnpaid` from `allCustomers` (not page slice).
3. **verify-whatsapp-otp** — ignore client `email_otp_verified`; always require DB-verified email OTP (except reviewer).
4. **flutterwave-webhook** — timing-safe `verif-hash` compare.
5. **cloudApi.deleteDebt** — also delete `sales` for `debt_id` (parity with localApi).
6. **.env.example** — `ENABLE_TEST_PAYMENTS=false` by default.

### Verification
- Vitest: **49/49 passed** (1.66s) after follow-up fixes.
- `tsc --noEmit`: running with report update.

### 2026-11-14 morning — remaining items implemented in code
- R1 PIN countdown, R2 register email OTP, R4 disable direct collectors, R6 reset-pin + ForgotPassword UI, R7 chart sanitize, R8 outbox cancel on stock conflict.
- R9 deploy still **Forbidden** from CLI here — see `docs/DEPLOY_EDGE_FIXES.md`.
- R3 live Paypack proof + R5 Apple IAP remain ops/feature work.

### Still open (ops / product)
- Live Paypack/MTN end-to-end (credentials + one real payment).
- Apple IAP / StoreKit.
- You must deploy Edge functions (CLI Forbidden without your Supabase login).
- Full RLS matrix against live project.

### Follow-up browser (same session)
- Dashboard unpaid **111,700 FRW** ↔ Debts **111,700** ↔ Sales Asigaye **111,700** (match).
- Inventory: 3 SKUs, stock value **937,000 FRW**.
- Auth PIN error now surfaces server rate-limit copy when body is parsed.
- F14: Auth `pin-login` extracts JSON error from FunctionsHttpError context.
