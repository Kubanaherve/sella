/**
 * Direct Visa/Mastercard charge via Flutterwave (encrypted).
 * Secrets: FLW_SECRET_KEY, FLW_ENCRYPTION_KEY, SUPABASE_*
 */
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import { encryptFlwPayload, activateSubscription, planAmountRwf } from "../_shared/flwEncrypt.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const flwSecret = Deno.env.get("FLW_SECRET_KEY") || "";
    const flwEnc = Deno.env.get("FLW_ENCRYPTION_KEY") || "";
    if (!flwSecret || !flwEnc) {
      return json(
        {
          error:
            "Card payments not configured. Set FLW_SECRET_KEY and FLW_ENCRYPTION_KEY in Supabase secrets.",
        },
        503
      );
    }

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const planTier =
      String(body.plan_tier || "monthly") === "annual" ? "annual" : "monthly";
    const amount = planAmountRwf(planTier);
    const cardNumber = String(body.card_number || "").replace(/\D/g, "");
    const cvv = String(body.cvv || "").replace(/\D/g, "");
    const expiryMonth = String(body.expiry_month || "").padStart(2, "0");
    const expiryYear = String(body.expiry_year || "").replace(/\D/g, "").slice(-2);
    const fullname = String(body.fullname || body.fullname || "Sella Subscriber").trim();
    const email =
      String(body.email || userData.user.email || "").trim() ||
      `pay+${userData.user.id.slice(0, 8)}@sella.app`;
    const phone = String(body.phone || "").replace(/\s/g, "") || undefined;

    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return json({ error: "Invalid card number" }, 400);
    }
    if (cvv.length < 3 || cvv.length > 4) {
      return json({ error: "Invalid CVC" }, 400);
    }
    if (!/^(0[1-9]|1[0-2])$/.test(expiryMonth) || expiryYear.length !== 2) {
      return json({ error: "Invalid expiry (use MM/YY)" }, 400);
    }

    const reference = `sella_card_${userData.user.id.slice(0, 8)}_${Date.now()}`;
    const sb = adminClient();

    const { data: payment, error: payErr } = await sb
      .from("subscription_payments")
      .insert({
        user_id: userData.user.id,
        amount,
        currency: "RWF",
        plan_tier: planTier,
        payment_method: "card_flutterwave",
        reference_id: reference,
        status: "pending",
      })
      .select("*")
      .single();
    if (payErr) throw payErr;

    const payload: Record<string, unknown> = {
      card_number: cardNumber,
      cvv,
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      currency: "RWF",
      amount,
      email,
      fullname,
      tx_ref: reference,
      enckey: flwEnc,
      redirect_url:
        Deno.env.get("APP_URL") ||
        Deno.env.get("VITE_APP_URL") ||
        "https://sella.app/subscribe",
    };
    if (phone) payload.phone_number = phone;

    const encrypted = encryptFlwPayload(flwEnc, payload);
    const flwRes = await fetch("https://api.flutterwave.com/v3/charges?type=card", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flwSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ client: encrypted }),
    });

    const flwJson = await flwRes.json();

    if (flwJson.status !== "success") {
      await sb
        .from("subscription_payments")
        .update({
          status: "rejected",
          admin_notes: String(flwJson.message || "card charge failed").slice(0, 500),
        })
        .eq("id", payment.id);
      return json(
        {
          error: flwJson.message || "Card charge failed",
          detail: flwJson,
        },
        400
      );
    }

    const flwRef = String(flwJson.data?.flw_ref || flwJson.data?.id || "");
    if (flwRef) {
      await sb
        .from("subscription_payments")
        .update({ external_transaction_id: flwRef })
        .eq("id", payment.id);
    }

    const authMode = String(flwJson.meta?.authorization?.mode || "").toLowerCase();
    const dataStatus = String(flwJson.data?.status || "").toLowerCase();

    if (dataStatus === "successful") {
      const end = await activateSubscription(
        sb,
        payment,
        flwRef || reference,
        "Flutterwave card immediate success"
      );
      return json({
        success: true,
        status: "successful",
        payment_id: payment.id,
        reference,
        current_period_end: end,
        message: "Payment successful",
      });
    }

    if (authMode === "redirect") {
      return json({
        success: true,
        status: "redirect_required",
        payment_id: payment.id,
        reference,
        flw_ref: flwRef,
        redirect_url: flwJson.meta?.authorization?.redirect,
        message: "Complete 3D Secure with your bank",
      });
    }

    if (authMode === "pin") {
      return json({
        success: true,
        status: "pin_required",
        payment_id: payment.id,
        reference,
        flw_ref: flwRef,
        message: "Enter your card PIN to continue",
      });
    }

    if (authMode === "otp" || authMode === "avs_noauth") {
      return json({
        success: true,
        status: "otp_required",
        payment_id: payment.id,
        reference,
        flw_ref: flwRef,
        message: "Enter the OTP sent by your bank",
      });
    }

    return json({
      success: true,
      status: "pending",
      payment_id: payment.id,
      reference,
      flw_ref: flwRef,
      message: "Processing card payment…",
      meta: flwJson.meta || null,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Card charge failed" }, 500);
  }
});
