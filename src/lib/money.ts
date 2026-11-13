/**
 * RWF money helpers — amounts are integer francs (no subunits in practice).
 * Never use float for authoritative totals; round only at the UI boundary when parsing input.
 */

export type Rwf = number;

export function toRwf(value: unknown): Rwf {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

export function sumRwf(values: Iterable<Rwf>): Rwf {
  let total = 0;
  for (const v of values) total += toRwf(v);
  return total;
}

export function lineTotal(unitPrice: Rwf, quantity: number): Rwf {
  const q = Math.max(0, Math.floor(Number(quantity) || 0));
  const u = Math.max(0, toRwf(unitPrice));
  return u * q;
}

export function clampPaid(amount: Rwf, due: Rwf): Rwf {
  const a = toRwf(amount);
  const d = toRwf(due);
  if (a < 0) return 0;
  return a > d ? d : a;
}

export type PaymentSlice = {
  method: "cash" | "momo" | "airtel" | "bank";
  amount: Rwf;
  referenceNumber?: string | null;
};

export function normalizePaymentSlices(
  slices: PaymentSlice[],
  orderTotal: Rwf
): { slices: PaymentSlice[]; paid: Rwf; remaining: Rwf; changeDue: Rwf } {
  const cleaned = slices
    .map((s) => ({
      method: s.method,
      amount: toRwf(s.amount),
      referenceNumber: s.referenceNumber?.trim() || null,
    }))
    .filter((s) => s.amount > 0);

  const paidRaw = sumRwf(cleaned.map((s) => s.amount));
  const total = toRwf(orderTotal);
  const paid = paidRaw > total ? total : paidRaw;
  const changeDue = paidRaw > total ? paidRaw - total : 0;

  // If overpay, shrink the last slice so recorded payments == total (change is UI-only unless we add a change row)
  let remainingToAllocate = paid;
  const normalized: PaymentSlice[] = [];
  for (const s of cleaned) {
    if (remainingToAllocate <= 0) break;
    const take = Math.min(s.amount, remainingToAllocate);
    normalized.push({ ...s, amount: take });
    remainingToAllocate -= take;
  }

  return {
    slices: normalized,
    paid,
    remaining: Math.max(0, total - paid),
    changeDue,
  };
}

export function paymentStatusFromBalances(
  total: Rwf,
  remaining: Rwf
): "paid" | "credit" | "partial" {
  const t = toRwf(total);
  const r = toRwf(remaining);
  if (r <= 0) return "paid";
  if (r >= t) return "credit";
  return "partial";
}
