import { corsHeaders, json } from "../_shared/cors.ts";
import { normalizePhoneE164 } from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import { planAmountRwf } from "../_shared/subscriptionActivate.ts";
import { collectPayment, logWebhook } from "../_shared/paymentProviders.ts";
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
    const phone = normalizePhoneE164(String(body.phone || ""));
    const planTier = String(body.plan_tier || "monthly") === "annual" ? "annual" : "monthly";
    const amount = planAmountRwf(planTier);
    const network =
      String(body.network || "mtn").toLowerCase() === "airtel" ? "airtel" : "mtn";
    const method = network === "airtel" ? "airtel_paypack" : "momo_paypack";

    if (!phone) return json({ error: "Valid MoMo / Airtel phone required" }, 400);

    const reference = `sella_${userData.user.id.slice(0, 8)}_${Date.now()}`;
    const sb = adminClient();

    const { data: payment, error: payErr } = await sb
      .from("subscription_payments")
      .insert({
        user_id: userData.user.id,
        amount,
        currency: "RWF",
        plan_tier: planTier,
        payment_method: method,
        reference_id: reference,
        status: "pending",
        admin_notes: `network=${network}; phone=${phone}`,
      })
      .select("*")
      .single();
    if (payErr) throw payErr;

    try {
      await sb.from("billing_notifications").insert({
        user_id: userData.user.id,
        payment_id: payment.id,
        kind: "payment_pending",
        title: "Kwishyura birimo gukorwa",
        body: `Emeza ${network === "airtel" ? "Airtel Money" : "MTN MoMo"} kuri ${phone}`,
        meta: { reference, amount, network },
      });
    } catch {
      /* optional until migration */
    }

    const collected = await collectPayment({
      phoneE164: phone,
      amountRwf: amount,
      reference,
      network,
    });

    await logWebhook(sb, {
      provider: collected.provider,
      event_type: "collect_initiated",
      external_ref: collected.externalRef,
      payment_id: payment.id,
      signature_valid: true,
      payload: collected.raw,
      processed: false,
    });

    if (!collected.accepted) {
      await sb
        .from("subscription_payments")
        .update({
          status: "rejected",
          admin_notes: collected.message.slice(0, 400),
          verified_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
      return json(
        {
          error: collected.message,
          payment_id: payment.id,
          reference,
          provider: collected.provider,
          confirmed: false,
        },
        502
      );
    }

    if (collected.externalRef) {
      await sb
        .from("subscription_payments")
        .update({
          external_transaction_id: collected.externalRef,
          admin_notes: `provider=${collected.provider}; network=${network}; phone=${phone}`,
        })
        .eq("id", payment.id);
    }

    // NEVER activate here — wait for webhook / admin / test confirm
    return json({
      success: true,
      confirmed: false,
      payment_id: payment.id,
      reference,
      external_transaction_id: collected.externalRef,
      amount,
      plan_tier: planTier,
      network,
      provider: collected.provider,
      test_mode: collected.provider === "test",
      message: collected.message,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Cashin failed", confirmed: false }, 500);
  }
});
