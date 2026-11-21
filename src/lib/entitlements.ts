import { getAppLanguage } from "@/lib/appLanguage";
import {
  PLAN_AMOUNT_RWF,
  PLAN_LIMITS,
  type ProductPlan,
} from "@/lib/planCatalog";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type PlanTier = "trial" | "monthly" | "annual" | "lifetime";
export type { ProductPlan };

export type PaymentProvider =
  | "trial"
  | "paypack"
  | "flutterwave"
  | "apple"
  | "google_play"
  | "manual";

export interface SubscriptionSnapshot {
  workspaceId: string;
  userId?: string;
  status: SubscriptionStatus;
  planTier?: PlanTier;
  productPlan?: ProductPlan;
  provider: PaymentProvider;
  priceRwf: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function getMonthlyPriceRwf(product: ProductPlan = "normal"): number {
  return PLAN_AMOUNT_RWF[product].monthly;
}

export function getAnnualPriceRwf(product: ProductPlan = "normal"): number {
  return PLAN_AMOUNT_RWF[product].annual;
}

export function cashierLimit(product: ProductPlan, trial = false): number {
  if (trial) return PLAN_LIMITS.pro.cashiers;
  return PLAN_LIMITS[product].cashiers;
}

/** @deprecated use getMonthlyPriceRwf */
export function getConfiguredPriceRwf(): number {
  return getMonthlyPriceRwf();
}

export function trialDaysRemaining(sub: SubscriptionSnapshot | null, now = new Date()): number {
  if (!sub?.trialEndsAt || sub.status !== "trialing") return 0;
  const ms = new Date(sub.trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export const SUBSCRIPTION_GRACE_DAYS = 3;

/**
 * 3-day grace after a paid period ends.
 * The expiry cron sets status to `expired` as soon as the period ends, so
 * grace must follow currentPeriodEnd for active, past_due, and expired.
 * Trials and canceled plans are not included.
 */
export function isInGracePeriod(sub: SubscriptionSnapshot | null, now = new Date()): boolean {
  if (!sub || !sub.currentPeriodEnd) return false;
  if (sub.status !== "active" && sub.status !== "past_due" && sub.status !== "expired") {
    return false;
  }
  const expiry = new Date(sub.currentPeriodEnd).getTime();
  const current = now.getTime();
  if (!Number.isFinite(expiry) || current <= expiry) return false;
  const graceEnd = expiry + SUBSCRIPTION_GRACE_DAYS * 86400000;
  return current <= graceEnd;
}

export function graceDaysRemaining(sub: SubscriptionSnapshot | null, now = new Date()): number {
  if (!isInGracePeriod(sub, now)) return 0;
  const expiry = new Date(sub!.currentPeriodEnd!).getTime();
  const graceEnd = expiry + SUBSCRIPTION_GRACE_DAYS * 86400000;
  const ms = graceEnd - now.getTime();
  return Math.max(1, Math.ceil(ms / 86400000));
}

/**
 * Write access:
 * - Active trial (trial_ends_at > now)
 * - Active subscription (current_period_end > now)
 * - 3-day grace after the paid period, including status `expired`
 */
export function hasWriteAccess(sub: SubscriptionSnapshot | null, now = new Date()): boolean {
  if (!sub) return false;
  if (sub.status === "trialing") {
    return !!sub.trialEndsAt && new Date(sub.trialEndsAt).getTime() > now.getTime();
  }
  if (sub.status === "active") {
    if (!!sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getTime() > now.getTime()) {
      return true;
    }
    return isInGracePeriod(sub, now);
  }
  if (sub.status === "past_due" || sub.status === "expired") {
    return isInGracePeriod(sub, now);
  }
  return false;
}

export function isSubscriptionExpired(sub: SubscriptionSnapshot | null, now = new Date()): boolean {
  return !hasWriteAccess(sub, now);
}

function planName(sub: SubscriptionSnapshot): string {
  const rw = getAppLanguage() === "rw";
  if (sub.status === "trialing") return rw ? "Igerageza" : "Trial";
  if (sub.productPlan === "pro") return "Pro";
  return rw ? "Isanzwe" : "Normal";
}

export function hasProFeatures(sub: SubscriptionSnapshot | null, now = new Date()): boolean {
  if (!hasWriteAccess(sub, now) || !sub) return false;
  if (sub.status === "trialing") return true;
  if (!sub.productPlan) return true;
  return sub.productPlan === "pro";
}

export function accessLabel(sub: SubscriptionSnapshot | null, now = new Date()): string {
  const rw = getAppLanguage() === "rw";
  if (!sub) return rw ? "Nta gahunda" : "No plan";
  if (isInGracePeriod(sub, now)) {
    const days = graceDaysRemaining(sub, now);
    return rw
      ? `Igihe cyarangiye. Hasigaye iminsi ${days} yo kwishyura.`
      : `The plan ended. ${days} days left to pay.`;
  }
  if (hasWriteAccess(sub, now)) {
    if (sub.status === "trialing") {
      const days = trialDaysRemaining(sub, now);
      return rw
        ? `Igerageza — hasigaye iminsi ${days} (kugeza ${formatDate(sub.trialEndsAt)})`
        : `Trial — ${days} days left (until ${formatDate(sub.trialEndsAt)})`;
    }
    const when = formatDate(sub.currentPeriodEnd);
    return rw
      ? `${planName(sub)} irakora kugeza ${when}`
      : `${planName(sub)} is active until ${when}`;
  }
  return rw
    ? `Yarangiye. Ongera wishyure kuva RWF ${getMonthlyPriceRwf("normal").toLocaleString("en-RW")}/ukwezi`
    : `Ended. Renew from RWF ${getMonthlyPriceRwf("normal").toLocaleString("en-RW")}/month`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function computeNextPeriodEnd(params: {
  now: Date;
  currentPeriodEnd: string | null;
  months?: number;
}): Date {
  const months = params.months ?? 1;
  const base =
    params.currentPeriodEnd && new Date(params.currentPeriodEnd) > params.now
      ? new Date(params.currentPeriodEnd)
      : new Date(params.now);
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

export const MERCHANT = {
  bankName: import.meta.env.VITE_BANK_NAME || "Zigama",
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || "Sella",
  accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER || "",
  swift: import.meta.env.VITE_BANK_SWIFT || "",
  /** MTN MoMo Pay / merchant code shown for manual transfers */
  momoCode: import.meta.env.VITE_MOMO_MERCHANT_CODE || "",
  momoPhone: import.meta.env.VITE_MOMO_MERCHANT_PHONE || "",
  momoName: import.meta.env.VITE_MOMO_MERCHANT_NAME || "Sella",
  /** Airtel Money merchant (manual) — replace placeholders when you have the account */
  airtelCode: import.meta.env.VITE_AIRTEL_MERCHANT_CODE || "*500*1#",
  airtelPhone: import.meta.env.VITE_AIRTEL_MERCHANT_PHONE || "+2507XXXXXXXX",
  airtelName: import.meta.env.VITE_AIRTEL_MERCHANT_NAME || "Sella",
} as const;

export const REVIEWER_DEMO_PHONE = "+250780000000";
