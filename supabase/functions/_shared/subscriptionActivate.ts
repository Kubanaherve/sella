/** Shared SaaS subscription activation — payments stay on subscription_payments. */

export type PlanTier = "monthly" | "annual" | "lifetime" | string;

export function planDurationDays(planTier: PlanTier): number {
  if (planTier === "lifetime") return 36500;
  if (planTier === "annual") return 365;
  return 30; // exactly 30 days for monthly
}

export function planAmountRwf(planTier: PlanTier): number {
  const monthly = Number(Deno.env.get("PLAN_PRICE_MONTHLY_RWF") || 5000);
  const annual = Number(Deno.env.get("PLAN_PRICE_ANNUAL_RWF") || 50000);
  if (planTier === "annual") return Number.isFinite(annual) && annual > 0 ? annual : 50000;
  return Number.isFinite(monthly) && monthly > 0 ? monthly : 5000;
}

/** Extend from remaining period when renewing; otherwise from now. */
export function computePeriodEndIso(
  planTier: PlanTier,
  existingPeriodEnd: string | null | undefined,
  now = new Date()
): { start: string; end: string } {
  const days = planDurationDays(planTier);
  const existing =
    existingPeriodEnd && new Date(existingPeriodEnd).getTime() > now.getTime()
      ? new Date(existingPeriodEnd)
      : now;
  const end = new Date(existing.getTime() + days * 86400000);
  return { start: now.toISOString(), end: end.toISOString() };
}

export async function activateFromPayment(
  // deno-lint-ignore no-explicit-any
  sb: any,
  payment: {
    id: string;
    user_id: string;
    plan_tier?: string;
    amount?: number;
  },
  opts: {
    externalId: string;
    note: string;
    verifiedBy?: string | null;
  }
): Promise<{ current_period_end: string; already?: boolean }> {
  // Idempotent: if already completed, return existing sub end
  const { data: fresh } = await sb
    .from("subscription_payments")
    .select("id, status, user_id, plan_tier")
    .eq("id", payment.id)
    .maybeSingle();
  if (fresh?.status === "completed") {
    const { data: sub } = await sb
      .from("user_subscriptions")
      .select("current_period_end")
      .eq("user_id", payment.user_id)
      .maybeSingle();
    return {
      current_period_end: sub?.current_period_end || new Date().toISOString(),
      already: true,
    };
  }

  const { data: existingSub } = await sb
    .from("user_subscriptions")
    .select("current_period_end")
    .eq("user_id", payment.user_id)
    .maybeSingle();

  const { start, end } = computePeriodEndIso(
    payment.plan_tier || "monthly",
    existingSub?.current_period_end
  );

  const { error: payErr } = await sb
    .from("subscription_payments")
    .update({
      status: "completed",
      verified_at: new Date().toISOString(),
      verified_by: opts.verifiedBy || null,
      external_transaction_id: opts.externalId,
      admin_notes: opts.note,
    })
    .eq("id", payment.id)
    .eq("status", "pending"); // optimistic concurrency — only one winner

  if (payErr) throw payErr;

  // Re-check: if another worker completed it, still upsert is fine
  const { data: after } = await sb
    .from("subscription_payments")
    .select("status")
    .eq("id", payment.id)
    .maybeSingle();
  if (after?.status !== "completed") {
    // Lost race — someone else completed; read sub
    const { data: sub } = await sb
      .from("user_subscriptions")
      .select("current_period_end")
      .eq("user_id", payment.user_id)
      .maybeSingle();
    return {
      current_period_end: sub?.current_period_end || end,
      already: true,
    };
  }

  await sb.from("user_subscriptions").upsert(
    {
      user_id: payment.user_id,
      plan_tier: payment.plan_tier || "monthly",
      status: "active",
      current_period_start: start,
      current_period_end: end,
      auto_renew: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  // In-app notification row (best-effort)
  try {
    await sb.from("billing_notifications").insert({
      user_id: payment.user_id,
      payment_id: payment.id,
      kind: "payment_success",
      title: "Kwishyura byagenze neza",
      body: `Subscription irakora kugeza ${new Date(end).toLocaleDateString("en-RW")}`,
      meta: { current_period_end: end, external_id: opts.externalId },
    });
    await sb.from("billing_notifications").insert({
      user_id: payment.user_id,
      payment_id: payment.id,
      kind: "subscription_activated",
      title: "Subscription yemejwe",
      body: `Ufite iminsi ${planDurationDays(payment.plan_tier || "monthly")} y'uburyo.`,
      meta: { current_period_end: end },
    });
  } catch {
    // table may not exist yet on older deploys
  }

  return { current_period_end: end };
}

export async function markPaymentFailed(
  // deno-lint-ignore no-explicit-any
  sb: any,
  paymentId: string,
  note: string,
  status: "rejected" | "cancelled" = "rejected"
) {
  await sb
    .from("subscription_payments")
    .update({
      status,
      admin_notes: note.slice(0, 500),
      verified_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("status", "pending");

  try {
    const { data: payment } = await sb
      .from("subscription_payments")
      .select("user_id")
      .eq("id", paymentId)
      .maybeSingle();
    if (payment?.user_id) {
      await sb.from("billing_notifications").insert({
        user_id: payment.user_id,
        payment_id: paymentId,
        kind: status === "cancelled" ? "payment_cancelled" : "payment_failed",
        title: status === "cancelled" ? "Kwishyura byahagaritswe" : "Kwishyura byanze",
        body: note.slice(0, 200),
      });
    }
  } catch {
    /* ignore */
  }
}
