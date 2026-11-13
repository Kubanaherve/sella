# Offline sale synchronization (Priority 2)

**Status:** Implemented and typechecked — verify on device with airplane mode.

## Behavior (complete only when tested)

1. User completes a sale while offline / network fails mid-request.
2. `createSaleOrder` (cloud) detects failure via `isNetworkFailure` / `navigator.onLine`.
3. Payload is saved in durable Dexie outbox (`sella_sync_outbox`) with a stable `idempotency_key`.
4. UI shows receipt with `OFF-…` number and toast that sync will run when online.
5. On reconnect (`online` / `sella:online`), `syncOutboxNow` drains the queue.
6. Server RPC `create_sale_order` uses the same idempotency key → no duplicate sales.
7. Banner shows pending count until queue is empty.

Same path for `record_payment`.

## Manual verification checklist

| Step | Expected | Result |
|------|----------|--------|
| Airplane mode → complete cash sale | Toast offline + OFF receipt | _pending device test_ |
| Kill app, reopen still offline | Pending count still > 0 | _pending_ |
| Go online | Toast “synced”; pending → 0 | _pending_ |
| Repeat same offline sale twice (two taps) | Two outbox rows OR one if UI disables — server never double-applies same key | _pending_ |
| Online sale still works | Normal receipt, no outbox | _pending_ |

## Code

- `src/db/outbox.ts`
- `src/db/cloudApi.ts` (`createSaleOrder`, `recordPayment`)
- `src/services/outboxSync.ts`
- `src/components/OfflineBanner.tsx`
- `src/components/AppShell.tsx`
