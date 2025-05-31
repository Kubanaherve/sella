// Flutterwave webhook — authenticate + verify + idempotent unlock

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  try {
    const secretHash = Deno.env.get("FLW_WEBHOOK_SECRET");
    const signature = req.headers.get("verif-hash");
    if (!secretHash || signature !== secretHash) {
      return new Response("invalid signature", { status: 401 });
    }

    const payload = await req.json();
    const txRef = payload?.data?.tx_ref || payload?.txRef;
    if (!txRef) return new Response("ok", { status: 200 });

    // Delegate to same verify logic by invoking verify path inline
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const flwSecret = Deno.env.get("FLW_SECRET_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: intent } = await admin
      .from("payment_intents")
      .select("*")
      .eq("reference", txRef)
      .maybeSingle();
    if (!intent) return new Response("unknown", { status: 200 });

    const eventId = payload?.data?.id ? `flw_wh_${payload.data.id}` : `flw_wh_${txRef}_${Date.now()}`;
    const { error: dupErr } = await admin.from("payment_events").insert({
      workspace_id: intent.workspace_id,
      payment_intent_id: intent.id,
      event_type: "webhook",
      provider_event_id: eventId,
      payload,
    });
    if (dupErr) {
      // duplicate webhook
      return new Response("duplicate", { status: 200 });
    }

    if (intent.status === "successful") return new Response("already", { status: 200 });

    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      { headers: { Authorization: `Bearer ${flwSecret}` } }
    );
    const verified = await verifyRes.json();
    const ok =
      verified.status === "success" &&
      verified.data?.status === "successful" &&
      Number(verified.data?.amount) === Number(intent.amount) &&
      String(verified.data?.currency).toUpperCase() === String(intent.currency).toUpperCase();

    if (!ok) return new Response("not successful", { status: 200 });

    const now = new Date();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("workspace_id", intent.workspace_id)
      .maybeSingle();
    const base =
      sub?.current_period_end && new Date(sub.current_period_end) > now
        ? new Date(sub.current_period_end)
        : now;
    const nextEnd = new Date(base);
    nextEnd.setMonth(nextEnd.getMonth() + 1);

    await admin
      .from("payment_intents")
      .update({
        status: "successful",
        provider_tx_id: String(verified.data.id),
        verified_at: now.toISOString(),
        raw_payload: verified,
      })
      .eq("id", intent.id)
      .eq("status", "pending");

    await admin
      .from("subscriptions")
      .update({
        status: "active",
        provider: "flutterwave",
        current_period_start: now.toISOString(),
        current_period_end: nextEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      })
      .eq("workspace_id", intent.workspace_id);

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
});
