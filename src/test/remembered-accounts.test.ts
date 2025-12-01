import { beforeEach, describe, expect, it } from "vitest";
import {
  loadRememberedAccounts,
  saveRememberedAccount,
  getPreferredAccount,
  removeRememberedAccount,
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
});
