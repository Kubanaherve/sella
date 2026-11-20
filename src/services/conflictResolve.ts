import { getOutboxItem, markOutbox, resolveOutboxConflict, type ConflictAction, type OutboxItem } from "@/db/outbox";
import { db } from "@/db/localDb";
import { isCashierModeActive } from "@/lib/cashierMode";
import { requireOwnerPin } from "@/lib/ownerGate";

const CASHIER_RESOLVE_ERROR = "Cashier Mode ntishobora gukemura izi sales";

type StockLine = {
  inventory_item_id?: string;
  quantity?: number;
  item_name?: string;
};

function stockLines(payload: Record<string, unknown>): StockLine[] {
  if (!Array.isArray(payload.items)) return [];
  return payload.items.filter((row) => row && typeof row === "object") as StockLine[];
}

async function assertStockForRetry(payload: Record<string, unknown>): Promise<void> {
  for (const line of stockLines(payload)) {
    const id = line.inventory_item_id;
    const qty = Number(line.quantity) || 0;
    if (!id || qty <= 0) continue;
    const inv = await db.inventory_items.get(id);
    if (!inv) continue;
    if ((inv.quantity || 0) < qty) {
      throw new Error(
        `Ububiko ntibuhagije kuri ${inv.item_name || "igicuruzwa"} (has ${inv.quantity || 0}, needs ${qty})`
      );
    }
  }
}

async function adjustLocalStock(
  payload: Record<string, unknown>,
  direction: 1 | -1
): Promise<void> {
  const now = new Date().toISOString();
  for (const line of stockLines(payload)) {
    const id = line.inventory_item_id;
    const qty = Number(line.quantity) || 0;
    if (!id || qty <= 0) continue;
    const inv = await db.inventory_items.get(id);
    if (!inv) continue;
    const next = (inv.quantity || 0) + direction * qty;
    if (next < 0) {
      throw new Error(`Ububiko ntibuhagije kuri ${inv.item_name || "igicuruzwa"}`);
    }
    await db.inventory_items.update(inv.id, { quantity: next, updated_at: now });
  }
}

/**
 * Owner review of one conflict.
 * Retry sends the same payload and idempotency key again. It is refused
 * when local stock that was restored cannot cover the sale.
 * Void keeps the receipt and does not create a sale or payment.
 * A repeated resolution does not move stock a second time.
 */
export async function resolveConflictAsOwner(input: {
  ownerKey: string;
  id: string;
  action: ConflictAction;
  note: string;
  pin: string;
}): Promise<OutboxItem> {
  if (isCashierModeActive()) throw new Error(CASHIER_RESOLVE_ERROR);
  await requireOwnerPin(input.pin);
  const before = await getOutboxItem(input.id);
  if (!before || before.owner_key !== input.ownerKey) {
    throw new Error("Conflict not found");
  }
  if (input.action === "retry" && before.status === "conflict" && before.stock_restored) {
    await assertStockForRetry(before.payload);
  }
  const after = await resolveOutboxConflict({
    ownerKey: input.ownerKey,
    id: input.id,
    action: input.action,
    note: input.note,
    resolvedBy: input.ownerKey,
  });
  if (before.status === "conflict" && after.status === "pending" && before.stock_restored) {
    await adjustLocalStock(before.payload, -1);
    await markOutbox(after.id, { stock_restored: false });
  }
  const adjusted = before.payload.local_stock_adjusted === true;
  if (
    before.status === "conflict" &&
    after.status === "resolved" &&
    adjusted &&
    !before.stock_restored
  ) {
    await adjustLocalStock(before.payload, 1);
    await markOutbox(after.id, { stock_restored: true });
  }
  return (await getOutboxItem(after.id)) ?? after;
}
