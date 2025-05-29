// Deno Edge Function — initiate Rwanda MoMo charge via Flutterwave
// Secrets: FLW_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ message: "Missing auth" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const flwSecret = Deno.env.get("FLW_SECRET_KEY");
    if (!flwSecret) return json({ message: "FLW_SECRET_KEY not configured" }, 500);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ message: "Unauthorized" }, 401);

    const body = await req.json();
    const workspaceId = body.workspace_id as string;
    const amount = Number(body.amount);
    const currency = (body.currency || "RWF") as string;
    const phone = String(body.phone || "").replace(/\s/g, "");

    if (!workspaceId || !amount || !phone) {
      return json({ message: "workspace_id, amount, phone required" }, 400);
    }

    const { data: member } = await admin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!member) return json({ message: "Not a workspace member" }, 403);

    const { data: sub } = await admin
      .from("subscriptions")
      .select("provider, status, current_period_end")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (sub?.provider === "apple" && sub.current_period_end && new Date(sub.current_period_end) > new Date()) {
      return json({ message: "Account billed via Apple IAP", status: "failed" }, 409);
    }

    const reference = `ws_${workspaceId.slice(0, 8)}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    await admin.from("payment_intents").insert({
      workspace_id: workspaceId,
      provider: "flutterwave",
      reference,
      amount,
      currency,
      status: "pending",
      phone,
    });

    // Flutterwave Rwanda Mobile Money
    // Docs: https://developer.flutterwave.com/docs/collecting-payments/mobile-money/rwanda
    const flwRes = await fetch("https://api.flutterwave.com/v3/charges?type=mobile_money_rwanda", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flwSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount,
        currency,
        email: userData.user.email,
        phone_number: phone,
        fullname: userData.user.user_metadata?.full_name || "Business Owner",
        redirect_url: `${Deno.env.get("APP_URL") || "http://127.0.0.1:5173"}/billing`,
      }),
    });

    const flwJson = await flwRes.json();
    await admin.from("payment_events").insert({
      workspace_id: workspaceId,
      event_type: "charge_initiated",
      payload: flwJson,
    });

    if (flwJson.status !== "success") {
      await admin.from("payment_intents").update({ status: "failed", raw_payload: flwJson }).eq("reference", reference);
      return json({ status: "failed", message: flwJson.message || "Flutterwave error", reference }, 400);
    }

    const flwStatus = flwJson.data?.status || "pending";
    if (flwStatus === "successful") {
      // Rare immediate success — still verify via verify function path in production
      return json({ status: "pending", reference, meta: flwJson.data });
    }

    return json({ status: "pending", reference, meta: flwJson.data });
  } catch (e) {
    console.error(e);
    return json({ message: "Server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
