# Sella Development Report

**Date:** 2026-11-12  
**Scope:** Master POS / payments / receipts engineering pass

## 1. Initial audit (summary)

| Area | Finding |
|------|---------|
| Architecture | Vite/React + Dexie local **or** Supabase cloud (`VITE_DATA_MODE`) |
| Auth | Shop register + phone/PIN; multi-tenant RLS by `user_id` |
| Sales model (pre-pass) | Split mental model: cash sale vs debt; credit often skipped sale rows |
| New Sale UI | Form-based inventory popup; paid/credit only; no split/partial at checkout |
| Money stats | Dashboard/Sales **double-counted** sale lines + payments as “collected” |
| Receipts | Debts PDF list only; no sale receipt / optional prefs |
| WhatsApp | `wa.me` debt reminders; no structured sale receipt message |

## 2. Problems addressed

1. Sale vs collected money confusion on dashboard/reports  
2. No split payment (MoMo + cash) at checkout  
3. No partial payment at checkout  
4. Weak POS browse/cart UX  
5. Receipts forced mental model / no shop identity without logo  
6. Integer money helpers for RWF accuracy  

## 3. Features implemented

- **Sale-first + split/partial checkout** via `createSaleOrder` (`payments[]`)  
- **POS New Sale** (`/new-sale`): product grid, search, categories, cart qty, checkout with split pay, discount, credit balance  
- **Sale complete** screen with optional receipt / print / WhatsApp  
- **Thermal printer micro-animation** (skippable; respects reduced motion)  
- **Auto shop brand mark** from shop name (no logo required)  
- **Receipt preferences** (`/receipt-settings`)  
- **Dashboard**: “Collected today” vs sales volume  
- **Money helpers** + unit tests  
- Migrations: payment_status/debt_id, POS discounts/receipt_number/refunds table  

## 4. Components redesigned / added

- `src/pages/AddDebt.tsx` → POS New Sale flow  
- `src/components/sale/SaleComplete.tsx`  
- `src/components/sale/ThermalReceipt.tsx`  
- `src/pages/ReceiptSettings.tsx`  
- `src/lib/money.ts`, `src/lib/receipt.ts`, `src/lib/receiptPrefs.ts`  
- Dashboard + Sales labeling for collected money  

## 5. Database changes

- `20261112050000_sale_first_payment_status.sql` — `sales.payment_status`, `sales.debt_id`, `payments.reference_number`  
- `20261112060000_pos_orders_split_payments.sql` — debt discount/receipt/change; inventory category/image; `sale_refunds`  

Order header remains `debts` (compatible); line items `debt_items` + accrual `sales`; cash = `payments` only.

## 6. Edge Functions

No new Edge Functions in this pass. Existing `register-shop` / `pin-login` unchanged.

## 7. Security

- RLS tenant policies retained  
- Receipts use recorded transaction data only  
- MoMo Tx refs stored as **manual** references — UI does not claim electronic verification  
- No secrets committed  

## 8–9. Tests executed

```bash
npm test
npx tsc --noEmit
```

| Suite | Result |
|-------|--------|
| money.test.ts (split/partial/overpay) | Passed |
| auth-local / entitlements / remembered | Passed |
| Typecheck | Passed |

## 10. Remaining / partial

| Item | Status |
|------|--------|
| Full refund UI + restock flows | Schema ready (`sale_refunds`); UI not finished |
| Product images upload | Column ready; UI uses letter placeholder |
| Paypack auto-clear debt | Designed earlier; not wired |
| Offline sale queue sync | Banner only; no offline write queue |
| E2E browser suite | Not automated in CI |
| Card payments | Not integrated |

## 11. External dependencies

- Supabase project + Resend (welcome email)  
- WhatsApp via `wa.me` (user confirms send)  
- Capacitor Android/iOS shells present  

## 12. Run locally

```bash
cd /Users/friendkh/Projects/Mom_app_Bijoux/sella
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Ensure `.env` has `VITE_DATA_MODE=cloud` and Supabase keys for cloud testing.

## 13. Safe deploy notes

1. Apply migrations on staging first  
2. Deploy frontend after verifying demo shops  
3. Do not disable RLS  
4. Rotate any leaked PATs/API keys  
5. Play Store publish requires explicit owner approval  

## 14. Demo shops (synthetic)

| Shop | Phone | PIN |
|------|-------|-----|
| Demo Jewel Kigali | +250780000001 / 0780000001 | 1111 |
| Demo Fashion Remera | +250780000002 / 0780000002 | 2222 |

See `SELLA_TESTING_GUIDE.md` for workflows.
