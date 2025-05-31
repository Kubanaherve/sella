import { corsHeaders, json } from "../_shared/cors.ts";
import { normalizePhoneE164 } from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function paypackToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPACK_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("PAYPACK_CLIENT_SECRET") || "";
  if (!clientId || !clientSecret) throw new Error("Paypack credentials missing");

  const res = await fetch("https://payments.paypack.rw/api/auth/agents/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });
  if (!res.ok) throw new Error(`Paypack auth failed: ${await res.text()}`);
  const data = await res.json();
  const token = data.access || data.access_token || data.token;
  if (!token) throw new Error("Paypack auth response missing token");
  return token;
}

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
    const amount = planTier === "annual" ? 50000 : 5000;
    const method =
      String(body.network || "mtn").toLowerCase() === "airtel"
        ? "airtel_paypack"
        : "momo_paypack";

    if (!phone) return json({ error: "Valid MoMo phone required" }, 400);

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
      })
      .select("*")
      .single();
    if (payErr) throw payErr;

    const token = await paypackToken();
    const cashinRes = await fetch("https://payments.paypack.rw/api/transactions/cashin", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        number: phone.replace("+", ""),
        amount,
        environment: Deno.env.get("PAYPACK_ENV") || "production",
      }),
    });

    const cashinText = await cashinRes.text();
    let cashinJson: Record<string, unknown> = {};
    try {
      cashinJson = JSON.parse(cashinText);
    } catch {
      cashinJson = { raw: cashinText };
    }

    if (!cashinRes.ok) {
      await sb
        .from("subscription_payments")
        .update({ status: "rejected", admin_notes: cashinText.slice(0, 500) })
        .eq("id", payment.id);
      return json({ error: "Paypack cashin failed", detail: cashinJson }, 502);
    }

    const externalId = String(
      cashinJson.ref || cashinJson.reference || cashinJson.transaction_id || ""
    );
    if (externalId) {
      await sb
        .from("subscription_payments")
        .update({ external_transaction_id: externalId })
        .eq("id", payment.id);
    }

    return json({
      success: true,
      payment_id: payment.id,
      reference,
      external_transaction_id: externalId || null,
      amount,
      plan_tier: planTier,
      message: "Approve the MoMo prompt on your phone",
      paypack: cashinJson,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Cashin failed" }, 500);
  }
});
