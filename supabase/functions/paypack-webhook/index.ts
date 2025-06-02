import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

function periodEnd(planTier: string): string {
  const days = planTier === "annual" ? 365 : 30;
  return new Date(Date.now() + days * 86400000).toISOString();
}

/** Constant-time string compare for webhook secrets. */
function secretsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function extractProvidedSecret(req: Request): string {
  const sig = req.headers.get("x-paypack-signature");
  if (sig) return sig.trim();
  const wh = req.headers.get("x-webhook-secret");
  if (wh) return wh.trim();
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return auth.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const secret = Deno.env.get("PAYPACK_WEBHOOK_SECRET") || "";
    if (!secret) {
      console.error("PAYPACK_WEBHOOK_SECRET is not set — rejecting webhook");
      return json({ error: "Webhook not configured" }, 503);
    }
    const provided = extractProvidedSecret(req);
    if (!provided || !secretsEqual(provided, secret)) {
      return json({ error: "Invalid webhook signature" }, 401);
    }

    const payload = await req.json();
    const event = String(payload.event || payload.type || "");
    const data = payload.data || payload;
    const status = String(data.status || payload.status || "").toLowerCase();
    const ref = String(
      data.ref || data.reference || data.transaction_id || payload.ref || ""
    ).trim();

    const success =
      status === "successful" ||
      status === "success" ||
      event === "transaction:processed" ||
      event === "transaction:successful";

    if (!success) return json({ ok: true, ignored: true, status, event });

    // Never match "any pending payment" — require an explicit transaction reference.
    if (!ref) {
      console.error("Paypack webhook success without ref — refusing to auto-activate");
      return json({ error: "Missing payment reference" }, 400);
    }

    const sb = adminClient();
    const { data: payments } = await sb
      .from("subscription_payments")
      .select("*")
      .eq("status", "pending")
      .or(`external_transaction_id.eq.${ref},reference_id.eq.${ref}`)
      .order("created_at", { ascending: false })
      .limit(1);
    const payment = payments?.[0];
    if (!payment) return json({ ok: true, message: "No matching pending payment" });

    await sb
      .from("subscription_payments")
      .update({
        status: "completed",
        verified_at: new Date().toISOString(),
        external_transaction_id: ref || payment.external_transaction_id,
        admin_notes: "Paypack webhook auto-verified",
      })
      .eq("id", payment.id);

    const end = periodEnd(payment.plan_tier || "monthly");
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

    return json({ ok: true, payment_id: payment.id, current_period_end: end });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Webhook failed" }, 500);
  }
});
