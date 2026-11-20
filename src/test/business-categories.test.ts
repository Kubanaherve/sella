import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/localDb";
import {
  BUSINESS_CATEGORIES,
  businessCategoryLabel,
  normalizeBusinessCategory,
} from "@/lib/businessCategories";
import { normalizeUnit } from "@/lib/inventoryUnits";
import { signupLocal } from "@/db/localApi";
import { addInventoryItem } from "@/db/localApi";

describe("universal trade catalog", () => {
  beforeEach(async () => {
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();
  });

  it("covers grocery, hardware, clothing, and wholesale", () => {
    const ids = BUSINESS_CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "grocery_supermarket",
        "hardware_quincaillerie",
        "clothing_fashion",
        "wholesale_trade",
      ])
    );
    expect(normalizeBusinessCategory("not-a-trade")).toBe("general_merchandise");
    expect(businessCategoryLabel("hardware_quincaillerie", "en")).toBe(
      "Hardware Stores (Quincailleries)"
    );
  });

  it("accepts grocery and hardware units", () => {
    expect(normalizeUnit("packet")).toBe("pack");
    expect(normalizeUnit("kg")).toBe("kg");
    expect(normalizeUnit("bag")).toBe("bag");
    expect(normalizeUnit("sqm")).toBe("sqm");
  });

  it("stores a shop category and a product variant", async () => {
    const shop = await signupLocal({
      phone: "0788111222",
      pin: "2468",
      displayName: "Aline",
      businessName: "Aline Hardware",
      email: "aline-hardware@example.com",
      businessCategory: "hardware_quincaillerie",
    });
    if ("error" in shop) throw new Error(shop.error);
    expect(shop.profile.business_category).toBe("hardware_quincaillerie");

    const item = await addInventoryItem({
      item_name: "Cement",
      quantity: 40,
      selling_price: 15000,
      cost_price: 12000,
      unit: "bag",
      variant_label: "50kg",
      min_order_qty: 10,
    });
    expect(item.unit).toBe("bag");
    expect(item.variant_label).toBe("50kg");
    expect(item.min_order_qty).toBe(10);
  });
});
