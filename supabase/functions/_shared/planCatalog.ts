/** Keep in sync with src/lib/planCatalog.ts. Edge functions cannot import the Vite source tree. */

export type ProductPlan = "normal" | "pro";
export type BillingInterval = "monthly" | "annual";

export const PLAN_AMOUNT_RWF: Record<ProductPlan, Record<BillingInterval, number>> = {
  normal: { monthly: 27000, annual: 270000 },
  pro: { monthly: 48500, annual: 485000 },
};

export function planAmountRwf(product: ProductPlan, interval: BillingInterval): number {
  return PLAN_AMOUNT_RWF[product][interval];
}

export function asProductPlan(value: unknown): ProductPlan {
  return value === "pro" ? "pro" : "normal";
}

export function asBillingInterval(value: unknown): BillingInterval {
  return value === "annual" ? "annual" : "monthly";
}
