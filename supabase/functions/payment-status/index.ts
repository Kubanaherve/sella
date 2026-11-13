/**
 * Poll a subscription payment status. Never invents success —
 * returns DB state (updated by webhook / verify / admin).
 */
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const paymentId = String(body.payment_id || "").trim();
    const reference = String(body.reference || "").trim();
    if (!paymentId && !reference) {
      return json({ error: "payment_id or reference required" }, 400);
    }

    const sb = adminClient();
    let q = sb.from("subscription_payments").select("*").eq("user_id", userData.user.id);
    if (paymentId) q = q.eq("id", paymentId);
    else q = q.eq("reference_id", reference);

    const { data: payment } = await q.maybeSingle();
    if (!payment) return json({ error: "Payment not found" }, 404);

    const { data: sub } = await sb
      .from("user_subscriptions")
      .select("status, current_period_end, plan_tier")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    const confirmed = payment.status === "completed";
    const failed =
      payment.status === "rejected" ||
      payment.status === "cancelled" ||
      payment.status === "expired_pending";

    return json({
      payment_id: payment.id,
      reference: payment.reference_id,
      status: payment.status,
      confirmed,
      failed,
      amount: payment.amount,
      payment_method: payment.payment_method,
      external_transaction_id: payment.external_transaction_id,
      created_at: payment.created_at,
      verified_at: payment.verified_at,
      subscription: sub
        ? {
            status: sub.status,
            current_period_end: sub.current_period_end,
            plan_tier: sub.plan_tier,
            active:
              sub.status === "active" &&
              !!sub.current_period_end &&
              new Date(sub.current_period_end).getTime() > Date.now(),
          }
        : null,
      message: confirmed
        ? "Payment confirmed — subscription active"
        : failed
          ? `Payment ${payment.status}`
          : "Waiting for provider confirmation (webhook)",
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Status failed" }, 500);
  }
});
