/**
 * Durable offline write queue (cloud mode).
 * Each row belongs to one auth user. A later login on the same device
 * cannot sync or see another merchant's queued sales.
 */
import Dexie, { type Table } from "dexie";

export type OutboxStatus =
  | "pending"
  | "syncing"
  | "failed"
  | "done"
  | "cancelled"
  | "conflict"
  | "resolved";

export type ConflictAction = "retry" | "void";

export interface ConflictResolutionEntry {
  action: ConflictAction;
  note: string;
  resolved_by: string;
  resolved_at: string;
}

export interface OutboxItem {
  id: string;
  /** Supabase auth user id that created the row. */
  owner_key: string;
  /** Stable idempotency key sent to server */
  idempotency_key: string;
  operation: "create_sale_order" | "record_payment" | "generic";
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  /** Set after a conflict review. The original payload is never replaced. */
  resolution_log?: ConflictResolutionEntry[];
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_action?: ConflictAction | null;
  /** Local stock was put back after a conflict. Void must not restore it again. */
  stock_restored?: boolean;
}

class OutboxDB extends Dexie {
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super("sella_sync_outbox");
    this.version(1).stores({
      outbox: "id, status, created_at, idempotency_key, operation",
    });
    this.version(2).stores({
      outbox: "id, owner_key, status, created_at, idempotency_key, operation",
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
  owner_key: string;
}): Promise<OutboxItem> {
  const owner_key = input.owner_key.trim();
  if (!owner_key) throw new Error("Outbox item requires an owner");
  const now = new Date().toISOString();
  const item: OutboxItem = {
    id: uuid(),
    owner_key,
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
  if (
    item.status === "conflict" ||
    item.status === "cancelled" ||
    item.status === "done" ||
    item.status === "resolved"
  ) {
    return false;
  }
  if (item.status === "pending" || item.status === "failed") return true;
  if (item.status !== "syncing") return false;
  const updated = new Date(item.updated_at).getTime();
  return Number.isFinite(updated) && now - updated > STALE_SYNC_MS;
}

function belongsTo(item: OutboxItem, ownerKey: string): boolean {
  return !!ownerKey && item.owner_key === ownerKey;
}

export async function listPendingOutbox(ownerKey: string): Promise<OutboxItem[]> {
  const rows = await db.outbox.toArray();
  return rows
    .filter((item) => belongsTo(item, ownerKey) && isRetryable(item))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** Test helper — drops queued rows without touching business data. */
export async function clearOutbox(): Promise<void> {
  await db.outbox.clear();
}

export async function getOutboxItem(id: string): Promise<OutboxItem | undefined> {
  return db.outbox.get(id);
}

/**
 * Claim the oldest retryable row for this owner inside one IndexedDB
 * transaction so two tabs cannot sync the same sale.
 * Rows with no owner, or another owner's rows, are never claimed.
 */
export async function claimNextOutbox(
  ownerKey: string,
  skipIds: ReadonlySet<string> = new Set()
): Promise<OutboxItem | null> {
  return db.transaction("rw", db.outbox, async () => {
    const rows = await db.outbox.toArray();
    const item = rows
      .filter((row) => belongsTo(row, ownerKey) && isRetryable(row) && !skipIds.has(row.id))
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

export async function countOutboxAttention(
  ownerKey: string
): Promise<{ pending: number; conflicts: number }> {
  const rows = await db.outbox.toArray();
  let pending = 0;
  let conflicts = 0;
  for (const row of rows) {
    if (!belongsTo(row, ownerKey)) continue;
    if (row.status === "conflict") conflicts += 1;
    else if (row.status === "pending" || row.status === "failed" || row.status === "syncing") {
      pending += 1;
    }
  }
  return { pending, conflicts };
}

export async function listConflictOutbox(ownerKey: string): Promise<OutboxItem[]> {
  const rows = await db.outbox.toArray();
  return rows
    .filter((item) => belongsTo(item, ownerKey) && item.status === "conflict")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/**
 * Review a conflict without deleting or rewriting the original payload.
 * `retry` requeues the same idempotency key. `void` keeps the row and
 * does not post a sale. A second call with the same outcome is a no-op.
 * Another owner's key cannot read or change the row.
 */
export async function resolveOutboxConflict(input: {
  ownerKey: string;
  id: string;
  action: ConflictAction;
  note: string;
  resolvedBy: string;
}): Promise<OutboxItem> {
  const ownerKey = input.ownerKey.trim();
  const resolvedBy = input.resolvedBy.trim();
  if (!ownerKey || resolvedBy !== ownerKey) {
    throw new Error("Only this shop can resolve its conflicts");
  }
  return db.transaction("rw", db.outbox, async () => {
    const item = await db.outbox.get(input.id);
    if (!item || !belongsTo(item, ownerKey)) {
      throw new Error("Conflict not found");
    }
    if (item.status === "resolved" || item.status === "done" || item.status === "cancelled") {
      if (input.action === "void") return item;
      throw new Error("This entry was already closed and will not be posted again");
    }
    if (item.status === "pending" && input.action === "retry") return item;
    if (item.status !== "conflict") {
      throw new Error("This entry is not waiting for review");
    }
    const resolved_at = new Date().toISOString();
    const entry: ConflictResolutionEntry = {
      action: input.action,
      note: input.note.trim(),
      resolved_by: resolvedBy,
      resolved_at,
    };
    const next: OutboxItem = {
      ...item,
      payload: item.payload,
      idempotency_key: item.idempotency_key,
      status: input.action === "retry" ? "pending" : "resolved",
      attempts: input.action === "retry" ? 0 : item.attempts,
      last_error: input.action === "retry" ? null : item.last_error,
      resolved_by: resolvedBy,
      resolved_at,
      resolution_action: input.action,
      resolution_log: [...(item.resolution_log ?? []), entry],
      updated_at: resolved_at,
    };
    await db.outbox.put(next);
    return next;
  });
}

export async function markOutbox(
  id: string,
  patch: Partial<
    Pick<OutboxItem, "status" | "attempts" | "last_error" | "stock_restored">
  >
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
 * Stock conflict: stop retrying, but keep the payload.
 * The sale the merchant already completed stays visible for review.
 */
export class OutboxConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutboxConflictError";
  }
}

export type DrainResult = {
  synced: number;
  failed: number;
  cancelled: number;
  conflicts: number;
};

/**
 * Drain this owner's queue when online. Caller supplies the RPC invoker so
 * this module stays free of circular imports with cloudApi.
 */
export async function drainOutbox(
  ownerKey: string,
  invoke: (item: OutboxItem) => Promise<void>
): Promise<DrainResult> {
  if (!ownerKey || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return { synced: 0, failed: 0, cancelled: 0, conflicts: 0 };
  }
  let synced = 0;
  let failed = 0;
  let cancelled = 0;
  let conflicts = 0;
  const attempted = new Set<string>();
  for (;;) {
    const item = await claimNextOutbox(ownerKey, attempted);
    if (!item) break;
    attempted.add(item.id);
    try {
      await invoke(item);
      await markOutbox(item.id, { status: "done", last_error: null });
      synced += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "sync failed";
      if (e instanceof OutboxConflictError) {
        await markOutbox(item.id, { status: "conflict", last_error: msg });
        conflicts += 1;
      } else if (e instanceof OutboxCancelError) {
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
  return { synced, failed, cancelled, conflicts };
}
