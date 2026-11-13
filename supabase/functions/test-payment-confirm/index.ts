/**
 * TEST ONLY — confirm a pending payment without a real provider.
 * Enabled when PAYMENT_MODE=test OR ENABLE_TEST_PAYMENTS=true.
 * Superadmin can always use it for discrepancy drills.
 */
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import { activateFromPayment, markPaymentFailed } from "../_shared/subscriptionActivate.ts";
import { logWebhook } from "../_shared/paymentProviders.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const testEnabled =
      Deno.env.get("PAYMENT_MODE") === "test" ||
      Deno.env.get("ENABLE_TEST_PAYMENTS") === "true";

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

    if (!testEnabled && !profile?.is_superadmin) {
      return json(
        {
          error:
            "Test payment confirm disabled. Set PAYMENT_MODE=test or ENABLE_TEST_PAYMENTS=true, or use a superadmin account.",
        },
        403
      );
    }

    const body = await req.json();
    const paymentId = String(body.payment_id || "");
    const action = String(body.action || "success"); // success | fail
    if (!paymentId) return json({ error: "payment_id required" }, 400);

    const { data: payment } = await sb
      .from("subscription_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    if (!payment) return json({ error: "Payment not found" }, 404);

    // Non-admins may only confirm their own test payments
    if (!profile?.is_superadmin && payment.user_id !== userData.user.id) {
      return json({ error: "Forbidden" }, 403);
    }

    await logWebhook(sb, {
      provider: "test",
      event_type: action === "fail" ? "test_fail" : "test_success",
      external_ref: payment.external_transaction_id || payment.reference_id,
      payment_id: payment.id,
      signature_valid: true,
      payload: { action, by: userData.user.id },
      processed: true,
    });

    if (action === "fail") {
      await markPaymentFailed(sb, payment.id, "Test payment failed", "rejected");
      return json({ success: true, status: "rejected", confirmed: false });
    }

    const result = await activateFromPayment(sb, payment, {
      externalId: payment.external_transaction_id || `test_ok_${payment.id}`,
      note: "TEST confirm — not real money",
      verifiedBy: userData.user.id,
    });

    return json({
      success: true,
      confirmed: true,
      status: "completed",
      current_period_end: result.current_period_end,
      warning: "This was a TEST activation. No real money was collected.",
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Test confirm failed" }, 500);
  }
});
