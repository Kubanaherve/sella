/** Flutterwave 3DES-ECB payload encryption (Dashboard → Settings → API → Encryption key). */
import forge from "https://esm.sh/node-forge@1.3.1";

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

export async function activateSubscription(
  // deno-lint-ignore no-explicit-any
  sb: any,
  payment: { id: string; user_id: string; plan_tier?: string },
  externalId: string,
  note: string
) {
  await sb
    .from("subscription_payments")
    .update({
      status: "completed",
      verified_at: new Date().toISOString(),
      external_transaction_id: externalId,
      admin_notes: note,
    })
    .eq("id", payment.id);

  const end = periodEndIso(payment.plan_tier || "monthly");
  await sb.from("user_subscriptions").upsert(
    {
      user_id: payment.user_id,
      plan_tier: payment.plan_tier || "monthly",
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: end,
      auto_renew: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return end;
}
