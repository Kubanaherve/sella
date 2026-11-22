import { describe, expect, it } from "vitest";
import { billingPath, safeReturnPath } from "@/lib/checkoutIntent";
import { maskPhone, subscriptionPhoneDigits } from "@/lib/subscriptionPhone";

describe("public checkout helpers", () => {
  it("keeps the selected plan in the billing path", () => {
    expect(billingPath({ product: "normal", interval: "annual" })).toBe("/billing?product=normal&interval=annual");
  });

  it("rejects external return paths", () => {
    expect(safeReturnPath("/billing?product=pro&interval=monthly")).toBe("/billing?product=pro&interval=monthly");
    expect(safeReturnPath("//evil.example")).toBeNull();
    expect(safeReturnPath("https://evil.example")).toBeNull();
  });

  it("accepts the subscription phone contract and rejects short numbers", () => {
    expect(subscriptionPhoneDigits("078 000 0000")).toBe("0780000000");
    expect(subscriptionPhoneDigits("+250780000000")).toBe("250780000000");
    expect(subscriptionPhoneDigits("078")).toBeNull();
    expect(maskPhone("0780000000")).toBe("•••• 000");
  });
});