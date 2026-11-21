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
    const normal = plans.find((plan) => plan.id === "normal");
    const pro = plans.find((plan) => plan.id === "pro");
    expect(normal?.priceRwf).toBe(getMonthlyPriceRwf("normal"));
    expect(pro?.priceRwf).toBe(getMonthlyPriceRwf("pro"));
    expect(normal?.priceLabel).toBe(formatRwf(getMonthlyPriceRwf("normal")));
    expect(getAnnualPriceRwf("normal")).toBe(270000);
    expect(getAnnualPriceRwf("pro")).toBe(485000);
    expect(annualSavingsRwf("normal")).toBe(54000);
    expect(annualSavingsRwf("pro")).toBe(97000);
  });

  it("keeps a free trial plus Normal and Pro", () => {
    expect(commercialPlans().map((plan) => plan.id)).toEqual(["trial", "normal", "pro"]);
    expect(commercialPlans()[0].priceRwf).toBe(0);
  });

  it("grants shop features only while write access is valid", () => {
    expect(entitledFeatures(trial).length).toBeGreaterThan(2);
    expect(entitledFeatures({ ...trial, status: "expired", trialEndsAt: "2020-01-01T00:00:00.000Z" })[0]).toMatch(/Read existing/);
    expect(hasWriteAccess({ ...trial, status: "expired", trialEndsAt: "2020-01-01T00:00:00.000Z" })).toBe(false);
  });
});
