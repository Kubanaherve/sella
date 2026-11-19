/**
 * Durable offline write queue (cloud mode).
 * Sales/payments enqueued here survive app restarts until sync succeeds.
 * Sync worker is intentionally conservative — never marks remote success without API OK.
 */
import Dexie, { type Table } from "dexie";

export type OutboxStatus = "pending" | "syncing" | "failed" | "done" | "cancelled";

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

const STALE_SYNC_MS = 2 * 60 * 1000;

function isRetryable(item: OutboxItem, now = Date.now()): boolean {
  if (item.status === "pending" || item.status === "failed") return true;
  if (item.status !== "syncing") return false;
  const updated = new Date(item.updated_at).getTime();
  return Number.isFinite(updated) && now - updated > STALE_SYNC_MS;
}

export async function listPendingOutbox(): Promise<OutboxItem[]> {
  const rows = await db.outbox.toArray();
  return rows.filter((item) => isRetryable(item)).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** Test helper — drops queued rows without touching business data. */
export async function clearOutbox(): Promise<void> {
  await db.outbox.clear();
}

/**
 * Claim the oldest retryable row inside one IndexedDB transaction so two
 * tabs cannot sync the same sale.
 */
export async function claimNextOutbox(
  skipIds: ReadonlySet<string> = new Set()
): Promise<OutboxItem | null> {
  return db.transaction("rw", db.outbox, async () => {
    const rows = await db.outbox.toArray();
    const item = rows
      .filter((row) => isRetryable(row) && !skipIds.has(row.id))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
    if (!item) return null;
    const claimed: OutboxItem = {
      ...item,
      status: "syncing",
      attempts: item.attempts + 1,
      updated_at: new Date().toISOString(),
    };
    await db.outbox.put(claimed);
    return claimed;
  });
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

/** Throw from invoke to permanently cancel an outbox row (no retry). */
export class OutboxCancelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutboxCancelError";
  }
}

/**
 * Drain queue when online. Caller supplies the actual RPC invoker so this
 * module stays free of circular imports with cloudApi.
 */
export async function drainOutbox(
  invoke: (item: OutboxItem) => Promise<void>
): Promise<{ synced: number; failed: number; cancelled: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0, cancelled: 0 };
  }
  let synced = 0;
  let failed = 0;
  let cancelled = 0;
  const attempted = new Set<string>();
  for (;;) {
    const item = await claimNextOutbox(attempted);
    if (!item) break;
    attempted.add(item.id);
    try {
      await invoke(item);
      await markOutbox(item.id, { status: "done", last_error: null });
      synced += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "sync failed";
      if (e instanceof OutboxCancelError) {
        await markOutbox(item.id, { status: "cancelled", last_error: msg });
        cancelled += 1;
      } else {
        await markOutbox(item.id, {
          status: "failed",
          last_error: msg,
        });
        failed += 1;
      }
    }
  }
  return { synced, failed, cancelled };
}
