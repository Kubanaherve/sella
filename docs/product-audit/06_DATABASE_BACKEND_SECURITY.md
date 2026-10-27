# 06 — Database, Backend & SaaS Security

**Audit date:** 2026-11-12

## Threat model

Multi-tenant shops must never see another shop’s customers, products, sales, debts, payments, documents, or settings.

## Findings

### P0 (original) — status after this audit

| ID | Issue | Status |
|----|-------|--------|
| SEC-P0-1 | Local Dexie no tenant isolation | **MITIGATED in code** — `profile_id` + Dexie v3 + filters + test |
| SEC-P0-2 | `is_superadmin` self-escalation via profiles UPDATE | **MITIGATION ADDED** — migration `20261112160000_protect_is_superadmin.sql` (**must apply to live DB**) |
| SEC-P0-3 | Paypack webhook matches any pending if ref empty | **FIXED in repo** — `paypack-webhook/index.ts` |
| SEC-P0-4 | Legacy open RLS migrations in tree | **OPEN** — operational: never apply Jan 2026 `USING (true)` to production (`docs/PRODUCTION.md`) |

### P1

| ID | Issue | Status |
|----|-------|--------|
| SEC-P1-1 | Cloud createSaleOrder non-atomic | OPEN |
| SEC-P1-2 | Inventory RMW races / no qty CHECK | OPEN |
| SEC-P1-3 | recordPayment TOCTOU cloud | OPEN |
| SEC-P1-4 | PIN login rate-limit fail-open | **FIXED** fail-closed |

## Positive controls

- Frontend uses **anon key only** (`VITE_SUPABASE_ANON_KEY`).  
- Service role confined to Edge Functions.  
- Intended RLS: `auth.uid() = user_id` on business tables (`20261112010000_*`).  
- OTP table deny-all.  
- Billing hardening migration restricts client-side subscription activation.  
- Account deletion edge function removes core tenant rows + auth user + receipts.  

## Secrets

- `.env` gitignored; `.env.example` documents required secrets.  
- No service role found in `src/`.  
- `config.toml` contains project_id `ixihbqubatyfulnurpco` (non-secret but environment-specific).

## Required live verification (not executed here)

1. Two shops A/B: attempt cross-select via PostgREST with A’s JWT.  
2. Attempt `UPDATE profiles SET is_superadmin=true` after migration.  
3. Webhook without ref returns 400.  
4. Confirm production never ran open-RLS legacy policies.

## Storage

`receipts` bucket private; path scoped to `auth.uid()` per migration notes.
