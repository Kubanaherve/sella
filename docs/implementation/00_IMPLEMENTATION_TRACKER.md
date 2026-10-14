# Sella Production Hardening — Implementation Tracker

**Started:** 2026-11-12  
**Source:** Product audit 2026-11-12 + founder Phase 1 directive  
**Constraint:** Keep Capacitor; no Flutter migration; no production data destruction

## Phase status

| Phase | Focus | Status |
|-------|--------|--------|
| 1 | Database integrity + security (atomic RPC, RLS) | **CODE COMPLETE — live apply pending** |
| 2 | Dependency vulnerabilities | Not started |
| 3 | Account deletion + privacy | Not started |
| 4 | WhatsApp + financial workflows UX | Not started |
| 5 | Offline + subscriptions | Not started |
| 6 | Mobile UI/UX | Not started |
| 7 | Store prep + device testing | Not started |
| 8 | Final release audit | Not started |

## Issue register (Phase 1 focus)

| ID | Issue | Priority | Root cause | Proposed solution | Status | Tests | Evidence |
|----|-------|----------|------------|-------------------|--------|-------|----------|
| P1-FIN-01 | Cloud POS non-atomic | P0 | Sequential REST in `cloudApi.createSaleOrder` | Postgres RPC `create_sale_order` | **Done in repo** | Unit + SQL notes | migration + cloudApi |
| P1-FIN-02 | Payment TOCTOU / race | P0 | Read-modify-write outside txn | RPC `record_payment` with `FOR UPDATE` | **Done in repo** | SQL notes | migration + cloudApi |
| P1-FIN-03 | Concurrent stock oversell | P0 | Non-atomic qty update | `UPDATE … WHERE quantity >= :q` | **Done in repo** | SQL notes | same RPC |
| P1-FIN-04 | Missing server totals | P0 | Client can send prices | Server recalculates line totals / stock | **Done in repo** | — | RPC |
| P1-FIN-05 | No idempotency keys | P0 | Retries duplicate sales | `pos_idempotency_keys` | **Done in repo** | — | migration |
| P1-SEC-01 | Cross-shop isolation unverified live | P0 | Audit not pentested | RLS review + isolation SQL script | **Script ready; live Not tested** | Manual | `scripts/verify-tenant-isolation.sql` |
| P1-SEC-02 | Superadmin self-grant | P0 | profiles UPDATE | Migration `20261112160000_*` | Code ready; **apply to live DB** | SQL | migration file |
| P1-SEC-03 | Legacy open RLS risk | P0 | Old migrations in tree | Ops: never apply; document | Documented | — | PRODUCTION.md + tracker |
| P1-SEC-04 | Service role in frontend | P0 | — | Verified absent | Verified | Grep | anon only in `src/` |
| P2-DEP-01 | tar/ws audit vulns | P0 | Transitive deps | Phase 2 | Deferred | npm audit | product-audit |
| P1-FIN-06 | Returns / adjust inventory | P1 | No controlled RPC | `process_sale_return`, `adjust_inventory` | **Done in repo** (UI later) | — | migration |
| P1-FIN-07 | Financial audit trail | P1 | No append-only log | `financial_audit_log` | **Done in repo** | — | migration |

## Rollback path (Phase 1)

1. Client: revert `cloudApi.ts` to previous REST multi-step path (git).  
2. DB: new RPCs are additive; dropping functions does not destroy data.  
3. Do **not** drop `financial_audit_log` / idempotency tables if rows exist without backup.

## Backup reminder (operator)

Before applying migrations to a live project:

1. Supabase Dashboard → Database → Backups (or `pg_dump`).  
2. Confirm Point-in-Time Recovery if on Pro.  
3. Apply on staging first when available.
