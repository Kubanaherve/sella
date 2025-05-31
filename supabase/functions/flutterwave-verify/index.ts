// Verify Flutterwave transaction, apply subscription exactly once.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { reference } = await req.json();
    if (!reference) return json({ message: "reference required" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const flwSecret = Deno.env.get("FLW_SECRET_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: intent } = await admin
      .from("payment_intents")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();
    if (!intent) return json({ message: "Unknown reference" }, 404);

    if (intent.status === "successful") {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("current_period_end")
        .eq("workspace_id", intent.workspace_id)
        .maybeSingle();
      return json({
        status: "successful",
        reference,
        current_period_end: sub?.current_period_end,
        idempotent: true,
      });
    }

    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${flwSecret}` } }
    );
    const verified = await verifyRes.json();

    await admin.from("payment_events").insert({
      workspace_id: intent.workspace_id,
      payment_intent_id: intent.id,
      event_type: "verify_response",
      provider_event_id: verified.data?.id ? `flw_tx_${verified.data.id}` : null,
      payload: verified,
    });

    const ok =
      verified.status === "success" &&
      verified.data?.status === "successful" &&
      Number(verified.data?.amount) === Number(intent.amount) &&
      String(verified.data?.currency).toUpperCase() === String(intent.currency).toUpperCase();

    if (!ok) {
      const failed = verified.data?.status === "failed";
      if (failed) {
        await admin.from("payment_intents").update({ status: "failed", raw_payload: verified }).eq("id", intent.id);
        return json({ status: "failed", reference });
      }
      return json({ status: "pending", reference });
    }

    // Apply paid month once
    const { data: sub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("workspace_id", intent.workspace_id)
      .maybeSingle();

    const now = new Date();
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
      .eq("status", "pending"); // optimistic concurrency

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

    return json({
      status: "successful",
      reference,
      current_period_end: nextEnd.toISOString(),
    });
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
