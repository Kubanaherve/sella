import type { OutboxItem } from "@/db/outbox";

export type ConflictSaleView = {
  idempotencyKey: string;
  createdAt: string;
  reason: string | null;
  clientName: string;
  phone: string;
  amount: number;
  soldAt: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    inventoryItemId: string | null;
  }>;
  payments: Array<{
    method: string;
    amount: number;
    reference: string | null;
  }>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

/**
 * Read-only view of a conflict. The original payload is not rewritten.
 */
export function describeConflict(item: OutboxItem): ConflictSaleView {
  const payload = item.payload;
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const rawPayments = Array.isArray(payload.payments) ? payload.payments : [];
  const items = rawItems.map((raw) => {
    const row = asRecord(raw) ?? {};
    return {
      name: String(row.item_name || row.name || "Item"),
      quantity: Number(row.quantity) || 0,
      unitPrice: Number(row.unit_price ?? row.unitPrice) || 0,
      inventoryItemId: row.inventory_item_id ? String(row.inventory_item_id) : null,
    };
  });
  const payments = rawPayments.map((raw) => {
    const row = asRecord(raw) ?? {};
    return {
      method: String(row.method || row.payment_method || "cash"),
      amount: Number(row.amount) || 0,
      reference:
        row.reference_number || row.referenceNumber
          ? String(row.reference_number || row.referenceNumber)
          : null,
    };
  });
  const lineTotal = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const discount = Number(payload.discount_amount ?? payload.discountAmount) || 0;
  const explicit = Number(payload.amount ?? payload.total_amount);
  const amount = Number.isFinite(explicit) && explicit > 0 ? explicit : Math.max(0, lineTotal - discount);
  return {
    idempotencyKey: item.idempotency_key,
    createdAt: item.created_at,
    reason: item.last_error,
    clientName: String(payload.client_name || payload.clientName || ""),
    phone: String(payload.phone || ""),
    amount,
    soldAt: String(payload.sold_at || payload.soldAt || item.created_at),
    items,
    payments,
  };
}
