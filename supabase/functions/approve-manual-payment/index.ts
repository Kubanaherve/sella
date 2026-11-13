import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import {
  activateFromPayment,
  markPaymentFailed,
} from "../_shared/subscriptionActivate.ts";
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
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return json({ error: "Unauthorized" }, 401);

    const sb = adminClient();
    const { data: profile } = await sb
      .from("profiles")
      .select("is_superadmin")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!profile?.is_superadmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const paymentId = String(body.payment_id || "");
    const action = String(body.action || "approve");
    const notes = String(body.admin_notes || "");
    if (!paymentId) return json({ error: "payment_id required" }, 400);

    const { data: payment, error } = await sb
      .from("subscription_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    if (error || !payment) return json({ error: "Payment not found" }, 404);

    if (action === "reject") {
      await markPaymentFailed(
        sb,
        paymentId,
        notes || "Rejected by admin",
        "rejected"
      );
      await sb
        .from("subscription_payments")
        .update({ verified_by: userData.user.id })
        .eq("id", paymentId);
      return json({ success: true, status: "rejected" });
    }

    const result = await activateFromPayment(sb, payment, {
      externalId: payment.external_transaction_id || payment.reference_id || payment.id,
      note: notes || "Approved by admin",
      verifiedBy: userData.user.id,
    });

    return json({
      success: true,
      status: "completed",
      current_period_end: result.current_period_end,
      already: result.already || false,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Approve failed" }, 500);
  }
});
