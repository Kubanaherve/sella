import { OutboxConflictError } from "@/db/outbox";

/**
 * Stock and missing-item failures will not succeed on retry.
 * Includes the Kinyarwanda messages raised by create_sale_order.
 *
 * `ntihagije` is not a substring of `ntibuhagije`, so both spellings are
 * listed. The live Postgres exception
 * `Ububiko ntibuhagije kuri Amata (has 0, needs 2)` and the migration text
 * `Stock ya % ntihagije` both match.
 */

export function isPermanentStockFailure(message: string): boolean {
  return /insufficient|not enough|out of stock|ntibuhagije|ntihagije|ntabwo kibonetse|stock ya |ububiko ntibuhagije/i.test(
    message
  );
}

/** Duplicate MoMo references are permanent. Retrying would loop forever. */
export function isPermanentReferenceConflict(message: string): boolean {
  return /yamaze gukoreshwa/i.test(message);
}

/**
 * How an outbox failure should be stored. Conflict keeps the original
 * payload and idempotency key and is not claimed again.
 */
export function syncFailureDisposition(
  operation: string,
  message: string
): "conflict" | "retry" {
  if (operation === "create_sale_order" && isPermanentStockFailure(message)) {
    return "conflict";
  }
  if (operation === "record_payment" && isPermanentReferenceConflict(message)) {
    return "conflict";
  }
  return "retry";
}

/** Map a sync failure onto the outbox error that stops or retries the row. */
export function asOutboxError(operation: string, error: unknown): Error {
  const msg = error instanceof Error ? error.message : String(error);
  if (syncFailureDisposition(operation, msg) === "conflict") {
    return new OutboxConflictError(msg);
  }
  return error instanceof Error ? error : new Error(msg);
}
