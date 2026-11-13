/**
 * Cron (daily recommended): expire due subs, stale pending, multi-day reminders.
 * Offsets: 7, 3, 2, 1, 0 days before current_period_end (exact clock time window = that calendar day).
 * Header: x-cron-secret: CRON_SECRET
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const REMINDER_DAYS = [7, 3, 2, 1, 0];

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

  const { data: expiredCount } = await admin.rpc("expire_due_subscriptions");
  const { data: staleCount } = await admin.rpc("mark_stale_pending_payments", {
    p_hours: 24,
  });

  let reminders = 0;

  for (const daysBefore of REMINDER_DAYS) {
    const target = new Date();
    target.setDate(target.getDate() + daysBefore);
    const dayStart = new Date(target);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(target);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: subs } = await admin
      .from("user_subscriptions")
      .select("user_id, current_period_end, status, plan_tier")
      .eq("status", "active")
      .gte("current_period_end", dayStart.toISOString())
      .lte("current_period_end", dayEnd.toISOString());

    for (const sub of subs || []) {
      if (!sub.current_period_end) continue;

      // Idempotent: skip if already logged for this period_end + offset
      const { data: existing } = await admin
        .from("subscription_reminder_log")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("period_end", sub.current_period_end)
        .eq("days_before", daysBefore)
        .maybeSingle();
      if (existing) continue;

      const endLabel = new Date(sub.current_period_end).toLocaleString("en-RW");
      const title =
        daysBefore === 0
          ? "Subscription irangira uyu munsi"
          : daysBefore === 1
            ? "Subscription irangira ejo"
            : `Subscription irangira mu minsi ${daysBefore}`;
      const body =
        daysBefore === 0
          ? `Ufite kugeza ${endLabel}. Ongera wishyure: ${appUrl}/subscribe`
          : `Izaba irangiye ${endLabel}. Ongera wishyure: ${appUrl}/subscribe`;

      const { data: notif } = await admin
        .from("billing_notifications")
        .insert({
          user_id: sub.user_id,
          kind: daysBefore === 0 ? "subscription_expiring" : "subscription_reminder",
          title,
          body,
          meta: {
            days_before: daysBefore,
            current_period_end: sub.current_period_end,
            plan_tier: sub.plan_tier,
          },
        })
        .select("id")
        .single();

      await admin.from("subscription_reminder_log").insert({
        user_id: sub.user_id,
        period_end: sub.current_period_end,
        days_before: daysBefore,
        notification_id: notif?.id || null,
      });

      // Best-effort push fan-out (tokens stored; FCM send wired when FIREBASE_SERVER_KEY set)
      try {
        const { data: devices } = await admin
          .from("devices")
          .select("push_token, platform")
          .eq("user_id", sub.user_id);
        const serverKey = Deno.env.get("FIREBASE_SERVER_KEY") || Deno.env.get("FCM_SERVER_KEY");
        if (serverKey && devices?.length) {
          for (const d of devices) {
            await fetch("https://fcm.googleapis.com/fcm/send", {
              method: "POST",
              headers: {
                Authorization: `key=${serverKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: d.push_token,
                notification: { title, body },
                data: { type: "subscription_reminder", days_before: String(daysBefore) },
              }),
            });
          }
        }
      } catch (e) {
        console.error("FCM fan-out error", e);
      }

      reminders += 1;
    }
  }

  // Newly expired notices (status flipped today)
  const justExpiredStart = new Date();
  justExpiredStart.setHours(0, 0, 0, 0);
  const { data: expiredSubs } = await admin
    .from("user_subscriptions")
    .select("user_id, current_period_end")
    .eq("status", "expired")
    .gte("updated_at", justExpiredStart.toISOString());

  let expiredNotices = 0;
  for (const sub of expiredSubs || []) {
    const { data: dup } = await admin
      .from("billing_notifications")
      .select("id")
      .eq("user_id", sub.user_id)
      .eq("kind", "subscription_expired")
      .gte("created_at", justExpiredStart.toISOString())
      .maybeSingle();
    if (dup) continue;
    await admin.from("billing_notifications").insert({
      user_id: sub.user_id,
      kind: "subscription_expired",
      title: "Subscription yarangiye",
      body: `Ongera wishyure kugira ngo ukomeze: ${appUrl}/subscribe`,
      meta: { current_period_end: sub.current_period_end },
    });
    expiredNotices += 1;
  }

  return new Response(
    JSON.stringify({
      reminders,
      expired_notices: expiredNotices,
      expired_flipped: expiredCount ?? null,
      stale_pending: staleCount ?? null,
      offsets: REMINDER_DAYS,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
