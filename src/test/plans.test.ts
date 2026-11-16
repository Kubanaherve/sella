import { describe, expect, it } from "vitest";
import { getAnnualPriceRwf, getMonthlyPriceRwf, hasWriteAccess, type SubscriptionSnapshot } from "@/lib/entitlements";
import { annualSavingsRwf, commercialPlans, entitledFeatures, formatRwf } from "@/lib/plans";

const trial: SubscriptionSnapshot = {
  workspaceId: "w",
  status: "trialing",
  provider: "trial",
  priceRwf: 0,
  trialEndsAt: "2099-01-01T00:00:00.000Z",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

describe("commercial plans", () => {
  it("uses the same prices as checkout", () => {
    const plans = commercialPlans();
    const monthly = plans.find((plan) => plan.id === "pro_monthly");
    const annual = plans.find((plan) => plan.id === "pro_annual");
    expect(monthly?.priceRwf).toBe(getMonthlyPriceRwf());
    expect(annual?.priceRwf).toBe(getAnnualPriceRwf());
    expect(monthly?.priceLabel).toBe(formatRwf(getMonthlyPriceRwf()));
    expect(annualSavingsRwf()).toBe(Math.max(0, getMonthlyPriceRwf() * 12 - getAnnualPriceRwf()));
  });

  it("keeps a free trial and two prepaid Pro options", () => {
    expect(commercialPlans().map((plan) => plan.id)).toEqual(["trial", "pro_monthly", "pro_annual"]);
    expect(commercialPlans()[0].priceRwf).toBe(0);
  });

  it("grants shop features only while write access is valid", () => {
    expect(entitledFeatures(trial).length).toBeGreaterThan(2);
    expect(entitledFeatures({ ...trial, status: "expired", trialEndsAt: "2020-01-01T00:00:00.000Z" })[0]).toMatch(/Read existing/);
    expect(hasWriteAccess({ ...trial, status: "expired", trialEndsAt: "2020-01-01T00:00:00.000Z" })).toBe(false);
  });
});
