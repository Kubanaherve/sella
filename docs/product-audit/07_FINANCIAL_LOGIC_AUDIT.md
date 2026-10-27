# 07 — Financial Logic Audit

**Audit date:** 2026-11-12

## Money model

- App authority: integer RWF via `toRwf` / `lineTotal` / `normalizePaymentSlices` (`src/lib/money.ts`).  
- Postgres: `NUMERIC(12,2)` — app rounds at boundaries.  
- Sale-first: every stocked order creates debt + sales; payments separate.

## Verified by automated tests (this audit)

```
npm test → 22 passed
- money.test.ts
- create-sale-order.test.ts (split + partial lifecycle)
- local-tenant-isolation.test.ts
- whatsappReminder phone validation
```

## Correct behaviors

- Dashboard cash = sum(payments); volume = sale lines (no double count by design).  
- Partial payments clamp and status derivation.  
- Local createSaleOrder is Dexie-transactional.  

## Defects

| ID | Issue | Severity | Fix status |
|----|-------|----------|------------|
| FIN-1 | Cloud POS multi-step not atomic | P1 | OPEN — need RPC |
| FIN-2 | Concurrent oversell | P1 | OPEN |
| FIN-3 | Local recordPayment non-txn | P1 | **FIXED** |
| FIN-4 | deleteDebt left sales (inflates volume) | P2 | **FIXED local** |
| FIN-5 | UTC today vs local week | P2 | **FIXED Kigali helpers** |
| FIN-6 | Walk-in cash sale without payment row | P2 | OPEN |
| FIN-7 | Daily report unpaidOutstanding not historical snapshot | P2 | OPEN (document semantics) |

## Credit date preservation

`debt_items.created_at` / line `takenAt` used on invoice PDF — **supported** when items exist.

## Recommendation

Ship Postgres functions:

```sql
-- conceptual
create_sale_order(...)
record_payment(debt_id, amount, ...) -- SELECT FOR UPDATE debt + inventory
```

Until then, treat cloud mode as **beta-risk** for high concurrency.
