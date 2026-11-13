# SELLA P0 source-code audit (vs store-readiness review)

**Date:** 2026-11-13  
**Scope:** Full local workspace (not GitHub web UI).  
**Method:** Confirmed in code · Potential risk · Not verified by runtime test

> You do **not** need to upload a ZIP — this workspace already contains `src/`, `supabase/`, Android/iOS Capacitor projects.

---

## Executive agreement with the external audit

| Verdict | Agree? |
|---------|--------|
| Not ready for public store launch yet | **Yes** |
| Promising foundation (React/Vite/Capacitor/Supabase) | **Yes** |
| Auth / RLS / payments / offline / testing gaps | **Yes** |

---

## 1. Authentication & security

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| A1 | Reviewer bypass `+250780000000` / OTP `123456` exists in `supabase/functions/_shared/phone.ts` | Critical **if** enabled in prod | **Confirmed** — gated by `ENABLE_REVIEWER_BYPASS` (default false in `.env`). **Hardened:** also blocked when `APP_ENV=production` unless `REVIEWER_ALLOW_IN_PRODUCTION=true`. |
| A2 | Docs (`docs/STORE_LAUNCH.md`) advertise reviewer OTP | High (ops risk) | **Confirmed** — docs must say “dev/TestFlight only” |
| A3 | Cloud PIN login uses Supabase Auth password (`sella_{pin}_{last4}`) via `pin-login` | Medium | **Confirmed** — PIN not stored plaintext server-side; Supabase hashes Auth passwords. Rate limit via `check_auth_rate_limit` (fail-closed). |
| A4 | Local Dexie PIN uses `hashPin` / `verifyPin` in `src/lib/pin.ts` | Low | **Confirmed** hashed locally |
| A5 | OTP send rate limit 3 / 15 min (`send-whatsapp-otp`) | — | **Confirmed** present |
| A6 | Cross-shop session wipe on switch | Medium | **Potential** — `sessionIsolation.ts` intentionally keeps Dexie on logout; switch paths need device test |

**Fixes applied this session:** production double-gate on reviewer bypass; ErrorBoundary; ConfigGate.

---

## 2. Multi-tenant RLS

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| R1 | SaaS tables use `auth.uid() = user_id` policies | — | **Confirmed** pattern in migrations |
| R2 | `create_sale_order` / `record_payment` RPCs are SECURITY DEFINER with `v_uid := auth.uid()` and tenant filters | — | **Confirmed** in `20261112170000_atomic_pos_rpcs.sql` |
| R3 | Idempotency keys for POS ops | — | **Confirmed** `pos_idempotency_keys` |
| R4 | Exhaustive Shop A vs Shop B matrix | Critical if any policy missing | **Not verified** by live cross-tenant test — **required before launch** |
| R5 | Storage bucket `receipts` policies | High | **Not verified** in this pass — inspect Storage policies in dashboard |

---

## 3. Payments & subscriptions

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| P1 | Subscription activate only via webhook / FLW verify / admin / explicit test confirm | Critical | **Confirmed** current Edge design; frontend polls status, does not self-activate |
| P2 | `PAYMENT_MODE=test` never claims real money | — | **Confirmed** |
| P3 | Paypack/MTN/Airtel live credentials absent on project | Critical for live money | **Confirmed** — secrets list lacks `PAYPACK_*` / `FLW_*` / `MTN_*` / `AIRTEL_*` |
| P4 | Double webhook / renew stacking | High | **Confirmed** idempotent activate + period stacking helpers exist; **need** live webhook duplicate test |
| P5 | Old docs saying “Paypack debt clearing not wired” | Medium | **Potential** — shop debt Paypack ≠ SaaS subscription Paypack; do not confuse |

---

## 4. Offline

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| O1 | `OfflineBanner` was banner-only | Critical for cloud shops | **Confirmed** historically |
| O2 | Durable outbox | Critical | **Started** — `src/db/outbox.ts` + pending count in banner. **Not complete:** sale path not yet enqueueing on network failure |
| O3 | Local mode (`VITE_DATA_MODE=local`) already persists in Dexie | — | **Confirmed** — offline works for local-only demos |

---

## 5. White screens / crashes

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| W1 | No React ErrorBoundary | High | **Fixed** — root + key routes |
| W2 | Cloud mode without env → throw on `getSupabase()` | High | **Mitigated** — `ConfigGate` shows setup screen |
| W3 | Per-page empty/error/retry consistency | Medium | **Potential** — not uniform across all pages |
| W4 | Missing migrations on remote | High | **Potential** — keep `supabase db push` in release checklist |

---

## 6. Scale (2,000+ rows)

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| S1 | Indexes on `user_id` + name/sku exist for inventory | — | **Confirmed** partial |
| S2 | Full pagination on all lists | High | **Potential** — `react-window` present; not proven on 2k dataset |
| S3 | Dashboard aggregation server-side | High | **Not verified** — may still compute client-side |

---

## 7. Store / build config

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| B1 | Authoritative mobile path is **Capacitor** (`capacitor.config.ts`, `android/`, `ios/`) | — | **Confirmed** |
| B2 | `app.json` Expo/EAS leftover | Medium confusion | **Confirmed** — not used by `npm run android:sync`; mark deprecated |
| B3 | Apple IAP for digital unlock | Critical for iOS paid unlock | **Confirmed** stub only — compliance decision required |
| B4 | Account deletion edge function exists | — | **Confirmed** path; **Not verified** end-to-end wipe |
| B5 | Play target SDK 36 by Aug 2026 | High | **Not verified** this pass — check `android/` Gradle |

---

## 8. Fixes shipped in this audit response

1. Reviewer bypass production double-gate (`phone.ts`)  
2. Global + route `ErrorBoundary`  
3. `ConfigGate` for missing Supabase in cloud mode  
4. Durable `outbox` Dexie DB + banner pending count  
5. This report (`docs/AUDIT_P0_SOURCE_REPORT.md`)

## 9. Remaining P0 before public launch (ordered)

1. Live cross-tenant RLS test matrix (two shops)  
2. Wire sale/payment failure → `enqueueOutbox` + drain on `sella:online`  
3. Complete refund UI + restock  
4. Decide iOS billing: Apple IAP vs business exemption  
5. Physical Android + iOS device QA  
6. Stress dataset (2k products / 20k sales)  
7. Keep `ENABLE_REVIEWER_BYPASS=false` in production forever (or use Apple’s private demo account tooling)

---

## Technology answer (for the audit author)

**SELLA = React + TypeScript + Vite + Tailwind + Capacitor 8 + Supabase.**  
GitHub: https://github.com/Kubanaherve/sella.git
