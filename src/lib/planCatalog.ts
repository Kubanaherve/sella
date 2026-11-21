/** Official Sella prices. Checkout, webhooks, and the UI all use these figures. */

export type ProductPlan = "normal" | "pro";
export type BillingInterval = "monthly" | "annual";

export const PLAN_AMOUNT_RWF: Record<ProductPlan, Record<BillingInterval, number>> = {
  normal: { monthly: 27000, annual: 270000 },
  pro: { monthly: 48500, annual: 485000 },
};

export const PLAN_LIMITS: Record<ProductPlan, { shops: number; cashiers: number }> = {
  normal: { shops: 1, cashiers: 1 },
  pro: { shops: 3, cashiers: 5 },
};

export const TRIAL_DAYS = 7;

export function isProductPlan(value: unknown): value is ProductPlan {
  return value === "normal" || value === "pro";
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

export function planAmountRwf(product: ProductPlan, interval: BillingInterval): number {
  return PLAN_AMOUNT_RWF[product][interval];
}

export function officialPlanAmounts(): readonly number[] {
  return [27000, 270000, 48500, 485000];
}

export function amountMatchesPlan(
  amount: number,
  product: ProductPlan,
  interval: BillingInterval
): boolean {
  return Math.round(amount) === planAmountRwf(product, interval);
}
