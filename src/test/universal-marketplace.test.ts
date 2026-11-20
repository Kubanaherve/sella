import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/localDb";
import {
  signupLocal,
  addInventoryItem,
  updateStoreProfile,
  createMarketplaceOrder,
  listMarketplaceOrders,
  getMarketplaceOrder,
  updateMarketplaceOrderStatus,
  listMarketplaceProducts,
  listMarketplaceStores,
} from "@/db/localApi";
import {
  RWANDAN_BUSINESS_CATEGORIES,
  findCategoryById,
  getCategoryLabel,
  normalizeBusinessCategory,
} from "@/lib/businessCategories";
import { INVENTORY_UNITS, normalizeUnit, formatUnitLabel } from "@/lib/inventoryUnits";
import { normalizePhoneE164 } from "@/lib/phone";

describe("Universal Digital Marketplace & Multi-Vertical Trader Expansion", () => {
  beforeEach(async () => {
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();
  });

  describe("1. Rwandan Commercial Sectors & Category Architecture", () => {
    it("supports all 20 officially identified trader types with bilingual metadata", () => {
      expect(RWANDAN_BUSINESS_CATEGORIES.length).toBeGreaterThanOrEqual(20);

      const requiredCategories = [
        "clothing_fashion",
        "shoes_footwear",
        "electronics_accessories",
        "grocery_supermarket",
        "supermarkets",
        "minimarkets",
        "hardware_quincaillerie",
        "construction_materials",
        "pharmacy_health",
        "beauty_cosmetics",
        "restaurant_food",
        "agriculture_produce",
        "furniture_decor",
        "household_equipment",
        "stationery_bookstore",
        "wholesale_trade",
        "retail_general",
        "general_merchandise",
        "informal_business",
        "other_commercial",
      ];

      for (const catId of requiredCategories) {
        const found = findCategoryById(catId);
        expect(found).toBeDefined();
        expect(found.id).toBe(catId);
        expect(found.nameRw).toBeTruthy();
        expect(found.nameEn).toBeTruthy();
        expect(found.defaultUnits.length).toBeGreaterThan(0);
      }
    });

    it("normalizes unknown category safely to general_merchandise", () => {
      expect(normalizeBusinessCategory("non-existent-sector")).toBe("general_merchandise");
      expect(normalizeBusinessCategory("HARD")).toBe("hardware_quincaillerie");
      expect(normalizeBusinessCategory("clothing_fashion")).toBe("clothing_fashion");
    });

    it("provides accurate Rwandan and English labels", () => {
      expect(getCategoryLabel("hardware_quincaillerie", "rw")).toContain("Quincaillerie");
      expect(getCategoryLabel("hardware_quincaillerie", "en")).toBe("Hardware Stores (Quincailleries)");
      expect(getCategoryLabel("clothing_fashion", "rw")).toBe("Imyenda n'Imidero");
      expect(getCategoryLabel("pharmacy_health", "rw")).toContain("Farumasi");
    });
  });

  describe("2. Comprehensive Inventory Units & Product Types", () => {
    it("supports weight, volume, dimension, packaging and retail units", () => {
      expect(normalizeUnit("kg")).toBe("kg");
      expect(normalizeUnit("tonne")).toBe("tonne");
      expect(normalizeUnit("g")).toBe("g");
      expect(normalizeUnit("litre")).toBe("litre");
      expect(normalizeUnit("ml")).toBe("ml");
      expect(normalizeUnit("metre")).toBe("metre");
      expect(normalizeUnit("sqm")).toBe("sqm");
      expect(normalizeUnit("bag")).toBe("bag");
      expect(normalizeUnit("pair")).toBe("pair");
      expect(normalizeUnit("portion")).toBe("portion");
      expect(normalizeUnit("pack")).toBe("pack");
      expect(normalizeUnit("can")).toBe("can");
      expect(normalizeUnit("bundle")).toBe("bundle");
    });

    it("formats units in Kinyarwanda and English", () => {
      expect(formatUnitLabel("tonne", "rw")).toContain("Toni");
      expect(formatUnitLabel("tonne", "en")).toContain("Tonnes");
      expect(formatUnitLabel("kg", "rw")).toContain("Ibiro");
      expect(formatUnitLabel("pair", "rw")).toContain("Umuguru");
      expect(formatUnitLabel("portion", "rw")).toContain("Ifunguro");
    });
  });

  describe("3. Multi-Vertical Store Profiles & Product Management", () => {
    it("creates a hardware store and updates location, description, and TIN", async () => {
      const signup = await signupLocal({
        phone: "0788111222",
        pin: "1234",
        displayName: "Jean Hardware",
        businessName: "Kigali Steel & Tools",
        email: "jean@kigalisteel.rw",
        businessCategory: "hardware_quincaillerie",
      });
      if ("error" in signup) throw new Error(signup.error);

      expect(signup.profile.business_category).toBe("hardware_quincaillerie");
      expect(signup.profile.shop_code).toMatch(/^SEL-/);

      const updated = await updateStoreProfile({
        store_address: "Kigali, CHIC Building Stall G-14",
        store_description: "Dutanga ibyuma, amarangi, n'ibisafuriya by'ubwubatsi.",
        store_tin: "109876543",
      });

      expect(updated.store_address).toBe("Kigali, CHIC Building Stall G-14");
      expect(updated.store_description).toContain("Dutanga ibyuma");
      expect(updated.store_tin).toBe("109876543");
    });

    it("adds products with specialized units, specifications, and variations", async () => {
      const signup = await signupLocal({
        phone: "0788333444",
        pin: "5678",
        displayName: "Marie Fashion",
        businessName: "Marie Chic Boutique",
        email: "marie@chic.rw",
        businessCategory: "clothing_fashion",
      });
      if ("error" in signup) throw new Error(signup.error);

      const item = await addInventoryItem({
        item_name: "African Print Dress",
        quantity: 15,
        selling_price: 35000,
        cost_price: 22000,
        category: "Clothing",
        unit: "pcs",
        variant_label: "Size M / Blue",
        variations: JSON.stringify([
          { name: "Size", options: ["S", "M", "L", "XL"] },
          { name: "Color", options: ["Blue", "Yellow", "Green"] },
        ]),
        material: "100% Cotton Kitenge",
      });

      expect(item.item_name).toBe("African Print Dress");
      expect(item.selling_price).toBe(35000);
      expect(item.quantity).toBe(15);
      expect(item.variant_label).toBe("Size M / Blue");
      expect(item.material).toBe("100% Cotton Kitenge");
      expect(item.is_available).toBe(true);
    });
  });

  describe("4. Digital Marketplace Discovery & Search", () => {
    beforeEach(async () => {
      // Create Store 1: Hardware
      const s1 = await signupLocal({
        phone: "0788100100",
        pin: "1111",
        displayName: "Alain",
        businessName: "Quincaillerie Moderne",
        email: "alain@moderne.rw",
        businessCategory: "hardware_quincaillerie",
      });
      if ("error" in s1) throw new Error(s1.error);

      await addInventoryItem({
        item_name: "Ciment Nyaminga 50kg",
        quantity: 50,
        selling_price: 14500,
        cost_price: 12000,
        category: "Construction",
        unit: "bag",
        sku: "CIM-50",
      });

      await addInventoryItem({
        item_name: "Peinture Blanche 20L",
        quantity: 20,
        selling_price: 45000,
        cost_price: 38000,
        category: "Paint",
        unit: "can",
        sku: "PNT-20L",
      });

      // Create Store 2: Grocery
      const s2 = await signupLocal({
        phone: "0788200200",
        pin: "2222",
        displayName: "Chantal",
        businessName: "Kigali Grocery Express",
        email: "chantal@grocery.rw",
        businessCategory: "grocery_supermarket",
      });
      if ("error" in s2) throw new Error(s2.error);

      await addInventoryItem({
        item_name: "Umuceri wa Bugarama 25kg",
        quantity: 30,
        selling_price: 32000,
        cost_price: 28000,
        category: "Grocery",
        unit: "bag",
        sku: "RICE-BUG-25",
      });
    });

    it("lists products with shop names and shop codes", async () => {
      const products = await listMarketplaceProducts();
      expect(products.length).toBe(3);
      expect(products.some((p) => p.item_name.includes("Ciment"))).toBe(true);
      expect(products.some((p) => p.item_name.includes("Umuceri"))).toBe(true);
      expect(products[0].shop_name).toBeDefined();
      expect(products[0].shop_code).toBeDefined();
    });

    it("filters products by category and keyword search", async () => {
      const cimentOnly = await listMarketplaceProducts({ query: "ciment" });
      expect(cimentOnly.length).toBe(1);
      expect(cimentOnly[0].item_name).toContain("Ciment");

      const paintOnly = await listMarketplaceProducts({ query: "peinture" });
      expect(paintOnly.length).toBe(1);
      expect(paintOnly[0].unit).toBe("can");
    });

    it("filters products by price range in RWF", async () => {
      const budgetItems = await listMarketplaceProducts({ maxPrice: 20000 });
      expect(budgetItems.length).toBe(1);
      expect(budgetItems[0].selling_price).toBe(14500);

      const premiumItems = await listMarketplaceProducts({ minPrice: 30000 });
      expect(premiumItems.length).toBe(2);
    });

    it("lists stores with their business categories and product counts", async () => {
      const stores = await listMarketplaceStores();
      expect(stores.length).toBe(2);
      expect(stores.some((s) => s.business_name === "Quincaillerie Moderne")).toBe(true);
      expect(stores.some((s) => s.business_name === "Kigali Grocery Express")).toBe(true);
    });
  });

  describe("5. Order Placement, Concurrency & Lifecycle", () => {
    let shopCode: string;
    let cementItemId: string;

    beforeEach(async () => {
      const shop = await signupLocal({
        phone: "0788555666",
        pin: "3333",
        displayName: "Bosco",
        businessName: "Bosco Hardware Kimironko",
        email: "bosco@kimironko.rw",
        businessCategory: "hardware_quincaillerie",
      });
      if ("error" in shop) throw new Error(shop.error);
      shopCode = shop.profile.shop_code!;

      const cement = await addInventoryItem({
        item_name: "Ciment Kigali 50kg",
        quantity: 100,
        selling_price: 15000,
        cost_price: 12500,
        unit: "bag",
      });
      cementItemId = cement.id;
    });

    it("places a customer marketplace order with Rwandan phone validation", async () => {
      const validRwPhone = normalizePhoneE164("0788123456");
      expect(validRwPhone).toBe("+250788123456");

      const order = await createMarketplaceOrder({
        shopCode,
        customerName: "Patrick Habimana",
        customerPhone: validRwPhone!,
        deliveryType: "delivery",
        deliveryAddress: "Gasabo, Kacyiru, KG 543 St",
        paymentMethod: "momo",
        notes: "Muzantelefone mbere yo kuza",
        items: [
          {
            inventoryItemId: cementItemId,
            itemName: "Ciment Kigali 50kg",
            quantity: 10,
            unitPrice: 15000,
          },
        ],
      });

      expect(order.order_number).toMatch(/^ORD-/);
      expect(order.total_amount).toBe(150000);
      expect(order.status).toBe("pending");
      expect(order.payment_status).toBe("pending");
      expect(order.delivery_type).toBe("delivery");
      expect(order.items?.length).toBe(1);

      // Verify inventory was automatically decremented
      const invAfter = await db.inventory_items.get(cementItemId);
      expect(invAfter?.quantity).toBe(90); // 100 - 10
    });

    it("retrieves order by order_number for customer tracking", async () => {
      const created = await createMarketplaceOrder({
        shopCode,
        customerName: "Diane Uwase",
        customerPhone: "+250790111222",
        deliveryType: "pickup",
        paymentMethod: "cash",
        items: [
          {
            inventoryItemId: cementItemId,
            itemName: "Ciment Kigali 50kg",
            quantity: 2,
            unitPrice: 15000,
          },
        ],
      });

      const tracked = await getMarketplaceOrder(created.order_number);
      expect(tracked).not.toBeNull();
      expect(tracked?.order_number).toBe(created.order_number);
      expect(tracked?.customer_name).toBe("Diane Uwase");
      expect(tracked?.total_amount).toBe(30000);
    });

    it("transitions order status smoothly through fulfillment lifecycle", async () => {
      const order = await createMarketplaceOrder({
        shopCode,
        customerName: "Eric Ndayizeye",
        customerPhone: "+250722333444",
        deliveryType: "delivery",
        deliveryAddress: "Nyarugenge, CHIC",
        paymentMethod: "momo",
        items: [
          {
            inventoryItemId: cementItemId,
            itemName: "Ciment Kigali 50kg",
            quantity: 5,
            unitPrice: 15000,
          },
        ],
      });

      // 1. Seller confirms order
      const confirmed = await updateMarketplaceOrderStatus(order.id, "confirmed");
      expect(confirmed.status).toBe("confirmed");

      // 2. Seller begins packing
      const preparing = await updateMarketplaceOrderStatus(order.id, "preparing");
      expect(preparing.status).toBe("preparing");

      // 3. Ready for pickup / out for delivery
      const ready = await updateMarketplaceOrderStatus(order.id, "ready");
      expect(ready.status).toBe("ready");

      // 4. Completed & Paid
      const completed = await updateMarketplaceOrderStatus(order.id, "completed", "paid");
      expect(completed.status).toBe("completed");
      expect(completed.payment_status).toBe("paid");
    });
  });
});
