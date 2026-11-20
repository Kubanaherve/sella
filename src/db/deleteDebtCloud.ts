import { assertDebtDeleteAllowed } from "@/lib/debtDeletion";

export type DebtDeleteRpc = (
  name: string,
  args: Record<string, unknown>
) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;

/**
 * Cloud debt deletion. The only write is `delete_debt_owner`.
 * There is no fallback to `debts.delete()` — a missing RPC fails closed
 * until migration 20261119210000 is applied on a non-production database.
 */
export async function deleteDebtViaOwnerRpc(
  rpc: DebtDeleteRpc,
  debtId: string,
  ownerPin: string
): Promise<void> {
  const pin = assertDebtDeleteAllowed(ownerPin);
  const { error } = await rpc("delete_debt_owner", {
    p_debt_id: debtId,
    p_pin: pin,
  });
  if (!error) return;
  const msg = error.message || "Delete failed";
  if (/could not find the function|schema cache|PGRST202/i.test(msg)) {
    throw new Error(
      "Server update required: apply migration 20261119210000_owner_debt_delete_and_momo_ref.sql before deleting debts"
    );
  }
  throw new Error(msg);
}
