import type { PaymentMethod } from "@/db/types";

export const SAME_DEBT_REFERENCE_ERROR =
  "Iyi reference yamaze gukoreshwa kuri iri deni";
export const SHOP_MOMO_REFERENCE_ERROR =
  "Iyi reference ya MoMo yamaze gukoreshwa muri iyi shop";

/** Trimmed, case-folded reference. Empty and whitespace-only become null. */
export function normalizePaymentReference(
  raw: string | null | undefined
): string | null {
  const trimmed = String(raw ?? "").trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export type ReferenceRow = {
  debt_id: string | null;
  payment_method: string;
  reference_number: string | null;
};

/**
 * Same non-empty reference on one debt is always a conflict.
 * A non-empty MoMo reference is also unique across the shop.
 * Cash (and any method) with no reference is allowed to repeat.
 */
export function paymentReferenceConflict(
  existing: ReferenceRow[],
  candidate: {
    debtId: string;
    method: PaymentMethod | string;
    reference: string | null | undefined;
  }
): "same-debt" | "shop-momo" | null {
  const key = normalizePaymentReference(candidate.reference);
  if (!key) return null;
  const sameDebt = existing.some(
    (row) =>
      row.debt_id === candidate.debtId &&
      normalizePaymentReference(row.reference_number) === key
  );
  if (sameDebt) return "same-debt";
  if (String(candidate.method).toLowerCase() !== "momo") return null;
  const otherDebt = existing.some(
    (row) =>
      row.debt_id !== candidate.debtId &&
      String(row.payment_method).toLowerCase() === "momo" &&
      normalizePaymentReference(row.reference_number) === key
  );
  return otherDebt ? "shop-momo" : null;
}

export function referenceConflictMessage(
  kind: "same-debt" | "shop-momo" | null
): string | null {
  if (kind === "same-debt") return SAME_DEBT_REFERENCE_ERROR;
  if (kind === "shop-momo") return SHOP_MOMO_REFERENCE_ERROR;
  return null;
}
