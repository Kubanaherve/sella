import { beforeEach, describe, expect, it } from "vitest";
import {
  loadRememberedAccounts,
  saveRememberedAccount,
  getPreferredAccount,
  removeRememberedAccount,
  accountForPhoneLogin,
  personName,
} from "@/lib/rememberedAccounts";

describe("remembered accounts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("remembers last shop for PIN unlock", () => {
    saveRememberedAccount({
      phone: "+250788111111",
      displayName: "A",
      pinLength: 4,
      shopName: "Shop A",
      shopCode: "SEL-AAAAAA",
    });
    saveRememberedAccount({
      phone: "+250788222222",
      displayName: "B",
      pinLength: 4,
      shopName: "Shop B",
      shopCode: "SEL-BBBBBB",
    });
    const preferred = getPreferredAccount();
    expect(preferred?.shopName).toBe("Shop B");
    expect(loadRememberedAccounts()).toHaveLength(2);
    removeRememberedAccount("+250788222222");
    expect(getPreferredAccount()?.shopName).toBe("Shop A");
  });

  it("never greets a shop with the phone number that was typed", () => {
    saveRememberedAccount({
      phone: "+250780000001",
      displayName: "780000001",
      pinLength: 4,
      shopName: "Demo Jewel Kigali",
    });
    const saved = loadRememberedAccounts()[0];
    expect(saved.displayName).toBe("Demo Jewel Kigali");
    expect(personName("780000001", "0780000001", "+250780000001")).toBe("");
    expect(personName("780000001", "Demo Owner A")).toBe("Demo Owner A");

    const fresh = accountForPhoneLogin("0780000001", []);
    expect(fresh.displayName).toBe("");
    const known = accountForPhoneLogin("780000001");
    expect(known.displayName).toBe("Demo Jewel Kigali");
    expect(known.phone).toBe("780000001");
  });
});
