/** Shared SaaS subscription activation — payments stay on subscription_payments. */

import {
  asBillingInterval,
  asProductPlan,
  planAmountRwf as catalogAmount,
  type ProductPlan,
} from "./planCatalog.ts";

export type PlanTier = "monthly" | "annual" | "lifetime" | string;

export function planDurationDays(planTier: PlanTier): number {
  if (planTier === "lifetime") return 36500;
  if (planTier === "annual") return 365;
  return 30;
}

export function planAmountRwf(planTier: PlanTier, productPlan: ProductPlan | string = "normal"): number {
  return catalogAmount(asProductPlan(productPlan), asBillingInterval(planTier));
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
    product_plan?: string | null;
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
    .select("id, status, user_id, plan_tier, product_plan, amount, external_transaction_id")
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

  const productPlan = asProductPlan(fresh?.product_plan || payment.product_plan);
  const interval = asBillingInterval(fresh?.plan_tier || payment.plan_tier);
  const expected = catalogAmount(productPlan, interval);
  const paidAmount = Number(fresh?.amount ?? payment.amount);
  if (!Number.isFinite(paidAmount) || paidAmount !== expected) {
    throw new Error("Payment amount does not match the selected plan");
  }

  if (opts.externalId) {
    const { data: prior } = await sb
      .from("subscription_payments")
      .select("id")
      .eq("external_transaction_id", opts.externalId)
      .eq("status", "completed")
      .neq("id", payment.id)
      .maybeSingle();
    if (prior?.id) {
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
  }

  const { start, end } = computePeriodEndIso(
    interval,
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
      plan_tier: interval,
      product_plan: productPlan,
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
