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

/**
 * Stock valuation for fractional quantities (kg, litre).
 * Sale lines stay on `lineTotal`, which only bills whole units.
 */
export function extendTotal(unitPrice: unknown, quantity: unknown): Rwf {
  const q = typeof quantity === "number" ? quantity : Number(quantity);
  if (!Number.isFinite(q) || q <= 0) return 0;
  const u = Math.max(0, toRwf(unitPrice));
  return toRwf(u * q);
}

/**
 * Whole units only.
 * Stock columns are integers and the checkout RPC floors a fraction, which
 * would charge for fewer units than the cashier typed. Reject instead.
 */
export function stockQuantity(quantity: unknown, min = 0): number {
  const n = typeof quantity === "number" ? quantity : Number(quantity);
  if (!Number.isFinite(n) || n < min || !Number.isInteger(n)) {
    throw new Error(
      min >= 1
        ? "Umubare ugomba kuba umubare wuzuye (1, 2, 3…)"
        : "Umubare ugomba kuba umubare wuzuye (0, 1, 2…)"
    );
  }
  return n;
}

/** Whole units actually sold. Rejects zero, negative, and fractional quantities. */
export function saleQuantity(quantity: unknown): number {
  return stockQuantity(quantity, 1);
}

const PAYMENT_METHODS = ["cash", "momo", "airtel", "bank"] as const;

export function assertPaymentMethod(method: string): PaymentSlice["method"] {
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) {
    throw new Error("Uburyo bwo kwishyura ntibwemewe");
  }
  return method as PaymentSlice["method"];
}

/**
 * Parse shop-entered money. RWF has no cents, so "11.000" and "11,000"
 * are eleven thousand, not eleven.
 */
export function parseMoneyText(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let s = trimmed.replace(/[^\d.,-]/g, "");
  if (!s || s === "-" || s === "." || s === ",") return null;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  } else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) {
    s = s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const frac = s.slice(lastComma + 1);
    s = /^\d{3}$/.test(frac) ? s.replace(/,/g, "") : s.replace(",", ".");
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return toRwf(n);
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
): {
  slices: PaymentSlice[];
  paid: Rwf;
  remaining: Rwf;
  changeDue: Rwf;
  /** Cash the customer handed over, including the part given back as change. */
  cashTendered: Rwf;
} {
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
  const cashTendered = sumRwf(
    cleaned.filter((s) => s.method === "cash").map((s) => s.amount)
  );

  // Non-cash settles the bill first. Cash is last so extra cash is change,
  // and cashTendered still records what the customer handed over.
  let remainingToAllocate = paid;
  const normalized: PaymentSlice[] = [];
  const ordered = [
    ...cleaned.filter((s) => s.method !== "cash"),
    ...cleaned.filter((s) => s.method === "cash"),
  ];
  for (const s of ordered) {
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
    cashTendered,
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
