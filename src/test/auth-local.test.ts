import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/localDb";
import {
  signupLocal,
  loginLocal,
  logoutLocal,
  getSessionProfile,
  isShopNameAvailableLocal,
} from "@/db/localApi";

describe("local auth + shop uniqueness", () => {
  beforeEach(async () => {
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();
  });

  it("registers shop with unique name, email, phone, 4-digit PIN", async () => {
    const result = await signupLocal({
      phone: "0788123456",
      pin: "1234",
      displayName: "Jeanne",
      businessName: "Jeanne Jewelry",
      email: "jeanne@example.com",
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.profile.shop_code).toMatch(/^SEL-/);
    expect(result.profile.business_name).toBe("Jeanne Jewelry");
    const session = await getSessionProfile();
    expect(session?.id).toBe(result.profile.id);
  });

  it("blocks duplicate shop names", async () => {
    await signupLocal({
      phone: "0788000001",
      pin: "1111",
      displayName: "A",
      businessName: "Unique Shop",
      email: "a@example.com",
    });
    expect(await isShopNameAvailableLocal("unique shop")).toBe(false);
    const dup = await signupLocal({
      phone: "0788000002",
      pin: "2222",
      displayName: "B",
      businessName: "Unique Shop",
      email: "b@example.com",
    });
    expect(dup).toEqual({ error: "Iri zina ryarafashwe — hitamo irindi" });
  });

  it("logs in with phone + PIN and logout clears session", async () => {
    await signupLocal({
      phone: "0788999888",
      pin: "4321",
      displayName: "Owner",
      businessName: "Login Shop",
      email: "owner@example.com",
    });
    await logoutLocal();
    expect(await getSessionProfile()).toBeNull();

    const bad = await loginLocal({ phone: "0788999888", pin: "0000" });
    expect("error" in bad).toBe(true);

    const ok = await loginLocal({ phone: "0788999888", pin: "4321" });
    expect("error" in ok).toBe(false);
    expect(await getSessionProfile()).not.toBeNull();
  });
});
