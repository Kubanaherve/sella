export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type PlanTier = "trial" | "monthly" | "annual" | "lifetime";

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
  provider: PaymentProvider;
  priceRwf: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function getMonthlyPriceRwf(): number {
  const n = Number(import.meta.env.VITE_PLAN_PRICE_MONTHLY_RWF || import.meta.env.VITE_PLAN_PRICE_RWF || 5000);
  return Number.isFinite(n) && n > 0 ? n : 5000;
}

export function getAnnualPriceRwf(): number {
  const n = Number(import.meta.env.VITE_PLAN_PRICE_ANNUAL_RWF || 50000);
  return Number.isFinite(n) && n > 0 ? n : 50000;
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

/** Write access = trial/paid period still open. */
export function hasWriteAccess(sub: SubscriptionSnapshot | null, now = new Date()): boolean {
  if (!sub) return false;
  if (sub.status === "expired" || sub.status === "canceled") {
    const end = sub.currentPeriodEnd || sub.trialEndsAt;
    return !!end && new Date(end).getTime() > now.getTime();
  }
  const end = sub.status === "trialing" ? sub.trialEndsAt : sub.currentPeriodEnd;
  if (!end) return false;
  return new Date(end).getTime() > now.getTime();
}

export function isSubscriptionExpired(sub: SubscriptionSnapshot | null, now = new Date()): boolean {
  return !hasWriteAccess(sub, now);
}

export function accessLabel(sub: SubscriptionSnapshot | null): string {
  if (!sub) return "Nta subscription";
  if (hasWriteAccess(sub)) {
    if (sub.status === "trialing") {
      const days = trialDaysRemaining(sub);
      return `Igihe cy'ubuntu — hasigaye iminsi ${days} (kugeza ${formatDate(sub.trialEndsAt)})`;
    }
    return `Irakora kugeza ${formatDate(sub.currentPeriodEnd)} (${sub.planTier || sub.provider})`;
  }
  return `Yarangiye — ongera wishyure kuva RWF ${getMonthlyPriceRwf().toLocaleString()}/ukwezi`;
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
  bankName: import.meta.env.VITE_BANK_NAME || "Bank of Kigali (BK)",
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || "Sella",
  accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER || "000XXXXXXX",
  swift: import.meta.env.VITE_BANK_SWIFT || "BKIGRWRW",
  /** MTN MoMo Pay / merchant code shown for manual transfers */
  momoCode: import.meta.env.VITE_MOMO_MERCHANT_CODE || "*182*8*1#",
  momoPhone: import.meta.env.VITE_MOMO_MERCHANT_PHONE || "+2507XXXXXXXX",
  momoName: import.meta.env.VITE_MOMO_MERCHANT_NAME || "Sella",
  /** Airtel Money merchant (manual) — replace placeholders when you have the account */
  airtelCode: import.meta.env.VITE_AIRTEL_MERCHANT_CODE || "*500*1#",
  airtelPhone: import.meta.env.VITE_AIRTEL_MERCHANT_PHONE || "+2507XXXXXXXX",
  airtelName: import.meta.env.VITE_AIRTEL_MERCHANT_NAME || "Sella",
} as const;

export const REVIEWER_DEMO_PHONE = "+250780000000";
