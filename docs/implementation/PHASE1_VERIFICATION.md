# Phase 1 Verification Report — Database integrity & security

**Date:** 2026-11-12  
**Scope:** Atomic POS RPCs + RLS verification materials  
**Framework:** Capacitor retained (no Flutter migration)

---

## Summary verdict (Phase 1 only)

| Criterion | Status |
|-----------|--------|
| Implemented (code + migrations in repo) | **Yes** |
| Tested successfully (local unit/typecheck) | **Yes** (app tests) |
| Tested on live Supabase project | **Not tested** (requires your project apply + JWT probe) |
| Blocked | Live apply / cross-tenant pentest needs your Supabase access |
| Requires external approval | Apply migration to production only after backup |

---

## What changed

### Database (additive migration)

**File:** `supabase/migrations/20261112170000_atomic_pos_rpcs.sql`

| Object | Purpose |
|--------|---------|
| `create_sale_order(jsonb)` | Single-transaction sale: auth, stock lock, totals, debt, items, sales, payments, audit, idempotency |
| `record_payment(jsonb)` | `FOR UPDATE` debt lock + payment + balance + sale status + audit |
| `record_credit_transaction(jsonb)` | Alias → `create_sale_order` |
| `adjust_inventory(jsonb)` | Controlled stock delta + audit |
| `process_sale_return(jsonb)` | Refund row + optional full restock of debt items + audit |
| `pos_idempotency_keys` | Prevent duplicate POS commits on retry |
| `financial_audit_log` | Append-only financial trail (tenant SELECT; insert via RPCs) |
| CHECK constraints | `inventory_items.quantity >= 0`, `debts.remaining_balance >= 0` |

### Application

**File:** `src/db/cloudApi.ts`

- `createSaleOrder` → `rpc('create_sale_order')`
- `recordPayment` → `rpc('record_payment')`
- Clear error if migration not applied
- Local Dexie path unchanged (already transactional for sales)

### Security tooling

| File | Purpose |
|------|---------|
| `scripts/verify-tenant-isolation.sql` | Operator checklist for RLS / cross-shop probes |
| `docs/implementation/00_IMPLEMENTATION_TRACKER.md` | Living tracker |
| Prior: `20261112160000_protect_is_superadmin.sql` | Still must be applied on live |

---

## Tests run (this environment)

```text
npm run typecheck  → PASS
npm test           → PASS (23 tests; local money/sale/isolation)
```

**Not run here:**

- Applying SQL to hosted Supabase `ixihbqubatyfulnurpco`
- Live Shop A vs Shop B JWT isolation
- Concurrent double-sale load test against RPC
- Physical device / WhatsApp (Phase 4+)

---

## How you know financial atomicity is fixed (after apply)

1. Apply migration on staging/production (after backup).  
2. Sell items while forcing failure mid-way is no longer possible at the REST layer — one RPC.  
3. Retry same `idempotency_key` returns same response without double stock deduct.  
4. Two concurrent sales of last unit: one succeeds, one raises stock error.  
5. Partial payment cannot push `remaining_balance` negative (CHECK + RPC guard).

---

## RLS verification status

| Check | Status |
|-------|--------|
| Tenant policies `auth.uid() = user_id` in SaaS migration | Present in repo |
| Service role absent from frontend | Verified (anon only) |
| Superadmin trigger migration in repo | Present; **apply live** |
| Live cross-shop SELECT/INSERT/UPDATE/DELETE | **Not tested** — run `scripts/verify-tenant-isolation.sql` |
| Legacy open-RLS migrations | Still in tree — never apply to prod (ops) |

---

## Rollback

1. Revert `cloudApi.ts` RPC calls (git).  
2. Optionally `DROP FUNCTION` the new RPCs — data tables remain.  
3. Do not drop `financial_audit_log` if you need history.

---

## Operator checklist before Phase 2

- [ ] Backup / PITR confirmed  
- [ ] Apply `20261112160000_protect_is_superadmin.sql` if not applied  
- [ ] Apply `20261112170000_atomic_pos_rpcs.sql`  
- [ ] Redeploy Edge Functions if needed (unchanged this phase)  
- [ ] Run `scripts/verify-tenant-isolation.sql` with two shops  
- [ ] Smoke-test one paid sale + one partial payment + one credit sale in cloud mode  

---

## Next phase (do not start until above checklist passes)

**Phase 2 — Dependency vulnerabilities** (`tar` / `ws` audit paths; no `--force`).
