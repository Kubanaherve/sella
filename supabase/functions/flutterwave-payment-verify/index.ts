/**
 * Poll / verify a Flutterwave subscription payment by tx_ref.
 * Activates user_subscriptions on success.
 */
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import { activateSubscription } from "../_shared/flwEncrypt.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const flwSecret = Deno.env.get("FLW_SECRET_KEY") || "";
    if (!flwSecret) return json({ error: "FLW_SECRET_KEY not configured" }, 503);

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { reference } = await req.json();
    if (!reference) return json({ error: "reference required" }, 400);

    const sb = adminClient();
    const { data: payment } = await sb
      .from("subscription_payments")
      .select("*")
      .eq("reference_id", String(reference))
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!payment) return json({ error: "Payment not found" }, 404);

    if (payment.status === "completed") {
      return json({ status: "successful", payment_id: payment.id, idempotent: true });
    }

    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(
        String(reference)
      )}`,
      { headers: { Authorization: `Bearer ${flwSecret}` } }
    );
    const verified = await verifyRes.json();

    const ok =
      verified.status === "success" &&
      String(verified.data?.status || "").toLowerCase() === "successful" &&
      Number(verified.data?.amount) === Number(payment.amount);

    if (!ok) {
      const failed = String(verified.data?.status || "").toLowerCase() === "failed";
      if (failed) {
        await sb
          .from("subscription_payments")
          .update({ status: "rejected", admin_notes: "Flutterwave verify failed" })
          .eq("id", payment.id);
        return json({ status: "failed", reference });
      }
      return json({ status: "pending", reference });
    }

    const end = await activateSubscription(
      sb,
      payment,
      String(verified.data.id),
      "Flutterwave verify_by_reference"
    );

    return json({
      status: "successful",
      payment_id: payment.id,
      reference,
      current_period_end: end,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Verify failed" }, 500);
  }
});
