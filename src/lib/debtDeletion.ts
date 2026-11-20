import { isCashierModeActive } from "@/lib/cashierMode";

export const CASHIER_DELETE_ERROR = "Cashier Mode ntishobora gusiba ideni";
export const DELETE_PIN_ERROR = "PIN y'umuyobozi sibyo";
export const DELETE_SUBSCRIPTION_ERROR =
  "Subscription yarangiye — jya kuri Billing wishyure to delete";

/**
 * Session lock used by the page and both data APIs.
 * This is not cloud authorization. Cloud deletion only succeeds through
 * the `delete_debt_owner` RPC, which checks the signed-in user, the PIN
 * against auth.users, and write access.
 */
export function assertDebtDeleteAllowed(ownerPin: string): string {
  if (isCashierModeActive()) throw new Error(CASHIER_DELETE_ERROR);
  const pin = ownerPin.trim();
  if (!/^\d{4}$/.test(pin)) throw new Error(DELETE_PIN_ERROR);
  return pin;
}

/**
 * UI handler. Hiding the button is not the check: callers that pass
 * cashier mode, a missing PIN, or a blocked subscription are rejected
 * before `remove` runs.
 */
export async function requestDebtDelete(input: {
  isCashier: boolean;
  canWrite: boolean;
  pin: string | null;
  debtId: string;
  remove: (debtId: string, pin: string) => Promise<void>;
}): Promise<void> {
  if (input.isCashier) throw new Error(CASHIER_DELETE_ERROR);
  if (!input.canWrite) throw new Error(DELETE_SUBSCRIPTION_ERROR);
  const pin = (input.pin ?? "").trim();
  if (!/^\d{4}$/.test(pin)) throw new Error(DELETE_PIN_ERROR);
  await input.remove(input.debtId, pin);
}
