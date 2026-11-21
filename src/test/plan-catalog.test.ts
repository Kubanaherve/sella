import { describe, expect, it } from "vitest";
import { amountMatchesPlan, officialPlanAmounts, planAmountRwf } from "@/lib/planCatalog";
import { paypackCashinNumber } from "@/lib/phone";

describe("official plan amounts", () => {
  it("charges the four published prices", () => {
    expect(planAmountRwf("normal", "monthly")).toBe(27000);
    expect(planAmountRwf("normal", "annual")).toBe(270000);
    expect(planAmountRwf("pro", "monthly")).toBe(48500);
    expect(planAmountRwf("pro", "annual")).toBe(485000);
    expect(officialPlanAmounts()).toEqual([27000, 270000, 48500, 485000]);
    expect(amountMatchesPlan(27000, "normal", "monthly")).toBe(true);
    expect(amountMatchesPlan(5000, "normal", "monthly")).toBe(false);
  });
});

describe("Paypack phone", () => {
  it("accepts 078, 079, 072, and 073 in local or international form", () => {
    expect(paypackCashinNumber("0781234567")).toBe("0781234567");
    expect(paypackCashinNumber("0791234567")).toBe("0791234567");
    expect(paypackCashinNumber("+250721234567")).toBe("0721234567");
    expect(paypackCashinNumber("250731234567")).toBe("0731234567");
    expect(paypackCashinNumber("0711234567")).toBeNull();
    expect(paypackCashinNumber("078123")).toBeNull();
  });
});
