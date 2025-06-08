// Cron-triggered: email workspaces whose trial/paid period ends in 3 days.
// Schedule via Supabase cron or external scheduler hitting this function with a secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("unauthorized", { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const appUrl = Deno.env.get("APP_URL") || "http://127.0.0.1:5173";
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const dayStart = new Date(inThreeDays);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(inThreeDays);
  dayEnd.setHours(23, 59, 59, 999);

  const { data: subs } = await admin
    .from("subscriptions")
    .select("workspace_id, trial_ends_at, current_period_end, status, price_rwf")
    .or(
      `and(status.eq.trialing,trial_ends_at.gte.${dayStart.toISOString()},trial_ends_at.lte.${dayEnd.toISOString()}),and(current_period_end.gte.${dayStart.toISOString()},current_period_end.lte.${dayEnd.toISOString()})`
    );

  let sent = 0;
  for (const sub of subs || []) {
    const { data: ws } = await admin
      .from("workspaces")
      .select("owner_id, name")
      .eq("id", sub.workspace_id)
      .maybeSingle();
    if (!ws) continue;
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", ws.owner_id)
      .maybeSingle();
    if (!profile?.email) continue;

    // Log reminder event; wire Resend/SMTP later via Supabase Auth hooks or external mailer
    await admin.from("payment_events").insert({
      workspace_id: sub.workspace_id,
      event_type: "expiry_reminder_queued",
      payload: {
        email: profile.email,
        billing_url: `${appUrl}/billing`,
        price_rwf: sub.price_rwf,
        ends: sub.trial_ends_at || sub.current_period_end,
      },
    });
    sent += 1;
  }

  return new Response(JSON.stringify({ queued: sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
