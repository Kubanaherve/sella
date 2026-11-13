/** Flutterwave 3DES-ECB + re-exports shared activation helpers. */
import forge from "https://esm.sh/node-forge@1.3.1";
export {
  activateFromPayment as activateSubscriptionPayment,
  computePeriodEndIso,
  planAmountRwf,
  planDurationDays,
  markPaymentFailed,
} from "./subscriptionActivate.ts";
import { activateFromPayment } from "./subscriptionActivate.ts";

export function encryptFlwPayload(
  encryptionKey: string,
  payload: Record<string, unknown>
): string {
  const text = JSON.stringify(payload);
  const cipher = forge.cipher.createCipher(
    "3DES-ECB",
    forge.util.createBuffer(encryptionKey)
  );
  cipher.start({ iv: "" });
  cipher.update(forge.util.createBuffer(text, "utf-8"));
  cipher.finish();
  return forge.util.encode64(cipher.output.getBytes());
}

export function periodEndIso(planTier: string): string {
  const days = planTier === "annual" ? 365 : 30;
  return new Date(Date.now() + days * 86400000).toISOString();
}

/** Back-compat wrapper used by existing Flutterwave functions. */
export async function activateSubscription(
  // deno-lint-ignore no-explicit-any
  sb: any,
  payment: { id: string; user_id: string; plan_tier?: string },
  externalId: string,
  note: string
) {
  const result = await activateFromPayment(sb, payment, {
    externalId,
    note,
  });
  return result.current_period_end;
}
