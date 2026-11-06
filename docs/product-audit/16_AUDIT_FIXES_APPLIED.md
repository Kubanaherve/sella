# 16 — Fixes Applied During This Audit

**Date:** 2026-11-12

This file distinguishes **original findings** from **post-audit code state**.

## Fixed in repository (safe)

| Finding | Change |
|---------|--------|
| Local multi-shop data bleed | Dexie v3 `profile_id` on business tables; all localApi queries scoped; isolation test |
| Paypack wrong-tenant activation | Webhook requires `ref`; constant-time secret compare |
| PIN brute-force if rate RPC fails | `pin-login` fail-closed (503) |
| Superadmin self-grant | Migration `20261112160000_protect_is_superadmin.sql` |
| Local payment race | `recordPayment` wrapped in Dexie transaction with re-read |
| deleteDebt left sales | Deletes linked sales + stock restore in transaction |
| Today/week timezone mix | `src/lib/dates.ts` Africa/Kigali calendar keys in local+cloud dashboards |
| Phone truncation collisions | `normalizePhoneE164` requires exact 10-digit local form |
| Lint errors | whatsappReminder escape; invoicePdf any cast |

## Still open (do not claim fixed)

- Cloud atomic POS RPC  
- Live RLS penetration proof  
- Apple IAP  
- Store listing assets / hosted privacy URL  
- Physical WhatsApp PDF device matrix  
- npm audit transitive criticals  
- Applying superadmin migration on production  

## Re-test after fixes

```
npm run typecheck  → PASS
npm run lint       → PASS
npm test           → 22+ passed (includes new isolation + phone tests)
npm run build      → PASS
```
