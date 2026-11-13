/**
 * Complete Flutterwave card auth (OTP / PIN) then activate subscription.
 * Secrets: FLW_SECRET_KEY
 */
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import { activateSubscription, encryptFlwPayload } from "../_shared/flwEncrypt.ts";
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
    if (!flwSecret) return json({ error: "FLW_SECRET_KEY not configured" }, 503);

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const mode = String(body.mode || "otp").toLowerCase();
    const otp = String(body.otp || "").trim();
    const pin = String(body.pin || "").trim();
    const flwRef = String(body.flw_ref || "").trim();

    if (!reference) return json({ error: "reference required" }, 400);

    const sb = adminClient();
    const { data: payment } = await sb
      .from("subscription_payments")
      .select("*")
      .eq("reference_id", reference)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!payment) return json({ error: "Payment not found" }, 404);
    if (payment.status === "completed") {
      return json({ success: true, status: "successful", payment_id: payment.id });
    }

    let flwJson: Record<string, unknown> = {};

    if (mode === "otp") {
      if (!otp || !flwRef) return json({ error: "otp and flw_ref required" }, 400);
      const res = await fetch(
        "https://api.flutterwave.com/v3/validate-charge",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${flwSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ otp, flw_ref: flwRef }),
        }
      );
      flwJson = await res.json();
    } else if (mode === "pin") {
      if (!pin || !flwEnc) return json({ error: "pin required / encryption missing" }, 400);
      // Re-charge with PIN authorization (Flutterwave card PIN flow)
      const card = body.card || {};
      const payload = {
        card_number: String(card.card_number || "").replace(/\D/g, ""),
        cvv: String(card.cvv || "").replace(/\D/g, ""),
        expiry_month: String(card.expiry_month || "").padStart(2, "0"),
        expiry_year: String(card.expiry_year || "").replace(/\D/g, "").slice(-2),
        currency: "RWF",
        amount: Number(payment.amount),
        email: String(body.email || userData.user.email || `pay@sella.app`),
        fullname: String(body.fullname || "Sella Subscriber"),
        tx_ref: reference,
        enckey: flwEnc,
        authorization: { mode: "pin", pin },
      };
      const encrypted = encryptFlwPayload(flwEnc, payload);
      const res = await fetch("https://api.flutterwave.com/v3/charges?type=card", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${flwSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ client: encrypted }),
      });
      flwJson = await res.json();
    } else {
      return json({ error: "Unsupported mode" }, 400);
    }

    const ok =
      flwJson.status === "success" &&
      String((flwJson.data as { status?: string } | undefined)?.status || "").toLowerCase() ===
        "successful";

    if (!ok) {
      const authMode = String(
        (flwJson.meta as { authorization?: { mode?: string } } | undefined)?.authorization
          ?.mode || ""
      ).toLowerCase();
      if (authMode === "redirect") {
        return json({
          success: true,
          status: "redirect_required",
          redirect_url: (flwJson.meta as { authorization?: { redirect?: string } })
            ?.authorization?.redirect,
          reference,
        });
      }
      return json({
        error: (flwJson.message as string) || "Validation failed",
        status: "failed",
        detail: flwJson,
      }, 400);
    }

    const externalId = String(
      (flwJson.data as { id?: string; flw_ref?: string } | undefined)?.id ||
        flwRef ||
        reference
    );
    const end = await activateSubscription(
      sb,
      payment,
      externalId,
      "Flutterwave card validated"
    );

    return json({
      success: true,
      status: "successful",
      payment_id: payment.id,
      reference,
      current_period_end: end,
      message: "Payment successful",
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Validate failed" }, 500);
  }
});
