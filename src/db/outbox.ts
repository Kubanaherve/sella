/**
 * Durable offline write queue (cloud mode).
 * Sales/payments enqueued here survive app restarts until sync succeeds.
 * Sync worker is intentionally conservative — never marks remote success without API OK.
 */
import Dexie, { type Table } from "dexie";

export type OutboxStatus = "pending" | "syncing" | "failed" | "done";

export interface OutboxItem {
  id: string;
  /** Stable idempotency key sent to server */
  idempotency_key: string;
  operation: "create_sale_order" | "record_payment" | "generic";
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

class OutboxDB extends Dexie {
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super("sella_sync_outbox");
    this.version(1).stores({
      outbox: "id, status, created_at, idempotency_key, operation",
    });
  }
}

const db = new OutboxDB();

function uuid(): string {
  return crypto.randomUUID();
}

export async function enqueueOutbox(input: {
  operation: OutboxItem["operation"];
  payload: Record<string, unknown>;
  idempotency_key?: string;
}): Promise<OutboxItem> {
  const now = new Date().toISOString();
  const item: OutboxItem = {
    id: uuid(),
    idempotency_key: input.idempotency_key || uuid(),
    operation: input.operation,
    payload: input.payload,
    status: "pending",
    attempts: 0,
    last_error: null,
    created_at: now,
    updated_at: now,
  };
  await db.outbox.put(item);
  return item;
}

export async function listPendingOutbox(): Promise<OutboxItem[]> {
  return db.outbox.where("status").anyOf(["pending", "failed"]).sortBy("created_at");
}

export async function countPendingOutbox(): Promise<number> {
  return db.outbox.where("status").anyOf(["pending", "failed", "syncing"]).count();
}

export async function markOutbox(
  id: string,
  patch: Partial<Pick<OutboxItem, "status" | "attempts" | "last_error">>
): Promise<void> {
  await db.outbox.update(id, { ...patch, updated_at: new Date().toISOString() });
}

/**
 * Drain queue when online. Caller supplies the actual RPC invoker so this
 * module stays free of circular imports with cloudApi.
 */
export async function drainOutbox(
  invoke: (item: OutboxItem) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }
  const pending = await listPendingOutbox();
  let synced = 0;
  let failed = 0;
  for (const item of pending) {
    await markOutbox(item.id, { status: "syncing", attempts: item.attempts + 1 });
    try {
      await invoke(item);
      await markOutbox(item.id, { status: "done", last_error: null });
      synced += 1;
    } catch (e) {
      await markOutbox(item.id, {
        status: "failed",
        last_error: e instanceof Error ? e.message : "sync failed",
      });
      failed += 1;
    }
  }
  return { synced, failed };
}
