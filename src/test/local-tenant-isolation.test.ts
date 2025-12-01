import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/localDb";
import {
  addInventoryItem,
  listInventory,
  setSession,
  signupLocal,
} from "@/db/localApi";

describe("local multi-shop isolation", () => {
  beforeEach(async () => {
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();
  });

  it("does not show shop A inventory to shop B", async () => {
    const a = await signupLocal({
      phone: "0788111111",
      pin: "1111",
      displayName: "Owner A",
      businessName: "Shop Alpha",
      email: "a@example.com",
    });
    expect("error" in a).toBe(false);
    if ("error" in a) return;

    await addInventoryItem({
      item_name: "Alpha Only",
      quantity: 3,
      cost_price: 1000,
      selling_price: 2000,
    });

    const b = await signupLocal({
      phone: "0788222222",
      pin: "2222",
      displayName: "Owner B",
      businessName: "Shop Beta",
      email: "b@example.com",
    });
    if ("error" in b) {
      throw new Error(`shop B signup failed: ${b.error}`);
    }

    await setSession(b.profile.id);
    const bInv = await listInventory();
    expect(bInv.find((i) => i.item_name === "Alpha Only")).toBeUndefined();

    await setSession(a.profile.id);
    const aInv = await listInventory();
    expect(aInv.some((i) => i.item_name === "Alpha Only")).toBe(true);
  });
});
