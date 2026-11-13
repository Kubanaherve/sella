# Sella — Autonomous QA / Audit Report

**Date:** 2026-11-14 (UTC+2 session)  
**Scope:** Full-stack Sella (Vite/React/Capacitor + Dexie + Supabase)  
**Mode:** Senior QA + architecture + security + real-user simulation  
**Honesty rule:** Only executed work is counted as executed. No invented pass rates.

---

## 1. Application map (Phase 1)

| Area | Finding |
|------|---------|
| Frontend | React 18 + RR7 + Tailwind; AppShell tabs; ThemeProvider manual light/dark |
| Backend | Supabase Auth + Edge Functions + Postgres RLS |
| Auth | Remembered shops + 4-digit PIN (`pin-login`); local Dexie PIN hash |
| Roles | Shop owner; `is_superadmin` for `/admin`, `/admin/payments` |
| Gates | `SubscriptionGuard`, `WriteGate`, `canWrite` ↔ `hasWriteAccess` |
| Core journeys | Auth → Dashboard → Sale/Debts/Sales/Inventory/More → Subscribe/Account |
| Billing | Paypack MoMo, Flutterwave card, manual TxId, test-confirm |
| Offline | Outbox `create_sale_order` / `record_payment` |

---

## 2. Scenario counts (honest)

| Batch | What ran | Planned | Executed | Pass | Fail |
|-------|----------|---------|----------|------|------|
| B0 | Baseline typecheck / eslint / build path | 3 | 3 | 3 | 0 |
| B1 | Vitest unit/integration cases | — | **49** | **49** | 0 |
| B1b | Nested matrix **assertions** inside QA matrix (money/phone/PIN/checkout) | ≥2000 | **~3,200+** `expect()` evaluations | all in passing tests | 0 after fixes |
| B2 | Browser human journeys (live demo shop) | 20 | **16** | 15 | 1 (then fixed) |
| B3 | Live `pin-login` under intermittent Edge 5xx | — | 3 attempts | 1 success earlier; later non-2xx | infra |

**Claim clarification:** We did **not** invent 2,000 separately named manual scripts. We executed **49 Vitest tests** whose matrices perform **thousands of real assertions**, plus **16 interactive browser journeys**. That is the honest coverage of this session.

### Browser journeys executed
1. Splash → PIN dialer  
2. Wrong/failed cloud PIN → error surface  
3. Successful PIN `1234` → Dashboard  
4. Dashboard stats / subscription chip  
5. Tab → Debts (list + total **111,700 FRW**)  
6. Consistency: Debts sum == Dashboard unpaid  
7. Tab → Sales (**crash** `cn is not defined` → fixed → recovered)  
8. Sales totals: remaining **111,700** matches Debts  
9. Inventory loads (3 SKUs, stock value)  
10. More + theme toggle visible  
11. New sale empty cart UX  
12. Unknown route while locked → PIN gate (auth required)  
13. `/admin` while locked → PIN gate  
14. Floating rounded tab bar present  
15. Period toggle / quick actions visible on Dashboard  
16. Re-login after full reload (Edge Function intermittent failure observed)

---

## 3. Bugs discovered

### Fixed this session

| ID | Sev | Description | Fix |
|----|-----|-------------|-----|
| F1 | **P1** | `/sales` white-screen: `cn is not defined` | Import `cn` in `Sales.tsx` |
| F2 | **P1** | `lineTotal(-price, qty)` allowed negative money | Clamp unit price ≥ 0 in `money.ts` + regression test |
| F3 | **P2** | Double-confirm on sale submit possible | Guard `if (saving) return` in `AddDebt.tsx` |
| F4 | **P2** | Dashboard stats cache not scoped per user | Key `dashboard_stats_cache:<userId>` |
| F5 | **P2** | PIN errors showed raw `Edge Function returned a non-2xx…` | Friendly mapping in `Auth.tsx` |
| F6 | **P3** | 404 / admin status chips harsh in dark mode | Dark text/chip classes |

### Remaining / blocked (not fully fixed)

| ID | Sev | Description | Notes |
|----|-----|-------------|-------|
| R1 | **P1** | Cloud `pin-login` intermittently returns non-2xx | Infra/deploy/rate-limit; needs Edge logs |
| R2 | **P1** | Registration without OTP (`register-shop`) | Known from prior audit; product decision |
| R3 | **P1** | Live MoMo needs Paypack/MTN credentials + webhook proof | Ops |
| R4 | **P2** | Direct MTN Collection has no webhook path | Prefer Paypack until callback built |
| R5 | **P2** | Apple IAP stub hidden but unfinished | StoreKit later |
| R6 | **P2** | Forgot PIN is guidance-only (no self-serve reset) | By design for PIN auth |
| R7 | **P3** | Chart `dangerouslySetInnerHTML` (shadcn) | Low risk if data trusted |

---

## 4. Security findings

| Finding | Sev | Status |
|---------|-----|--------|
| Admin routes client-gated + RLS expected | — | OK pattern if RLS enforced |
| Reviewer bypass fail-closed when `APP_ENV` unset | — | Already hardened |
| Test payment confirm blocked in production for non-admin | — | Already hardened |
| Live MoMo fail-closed without Paypack secrets | — | Already hardened |
| No secrets committed in this session | — | OK |
| XSS: no app-owned `dangerouslySetInnerHTML` beyond chart helper | P3 | Monitor |

---

## 5. Database / business logic

| Check | Result |
|-------|--------|
| Debts list total vs Dashboard unpaid | **Match 111,700 FRW** |
| Sales “ASIGAYE” vs Debts | **Match** |
| Negative unit price | **Was wrong → fixed** |
| Offline debt id prefix `offline:` + payment block | Present from prior fix |
| Entitlements client vs SQL `active`/`trialing` | Aligned earlier |

---

## 6. UI/UX

| Check | Result |
|-------|--------|
| Floating rounded tab bar | Present |
| Sales crash | Fixed |
| PIN error copy | Improved |
| Dark 404 / admin chips | Improved |
| New-sale empty state | Clear CTA |

---

## 7. Performance / stability

| Check | Result |
|-------|--------|
| Vitest suite | ~1.7s, 49 tests |
| `typecheck` / `eslint` | Clean |
| Sales crash under navigation | Caught by ErrorBoundary (good) then fixed root cause |
| Full production build | Not re-run in final minute; prior sessions clean |

---

## 8. Files modified this session

- `src/pages/Sales.tsx` — missing `cn` import (**P1**)
- `src/lib/money.ts` — clamp negative unit prices
- `src/pages/AddDebt.tsx` — double-submit guard
- `src/pages/Dashboard.tsx` — per-user stats cache
- `src/pages/Auth.tsx` — friendly PIN/network errors
- `src/pages/NotFound.tsx` — dark mode
- `src/pages/AdminPayments.tsx` — dark status chips
- `src/lib/sessionIsolation.ts` — cache prefix note
- `src/test/qa-scenario-matrix.test.ts` — **new** large matrix suite
- `src/test/money.test.ts` — negative price regression
- `docs/QA_FULL_AUDIT_REPORT.md` — this report

---

## 9. Recommended next steps

1. Inspect Supabase logs for `pin-login` non-2xx (R1).  
2. Wire OTP registration or lock down `register-shop` (R2).  
3. Complete one live Paypack MoMo payment proof (R3).  
4. Add Playwright/Cypress smoke: Auth → Dashboard → Sales → Inventory.  
5. Persist pending payment id across PIN lock (already partially handled via `isPaymentInProgress`).

---

## 10. Bottom line

The app’s **core money + debt consistency** checked out on the live demo shop, but **Sales was fully broken** in UI until this session (`cn` missing). Automated matrices now stress money/PIN/phone/entitlements with **thousands of real assertions**. Remaining blockers for “real money app” are mostly **ops/credentials** and **pin-login reliability**, not missing UI screens.
