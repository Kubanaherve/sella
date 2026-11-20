import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/localDb";
import { signupLocal, createSaleOrder, addInventoryItem } from "@/db/localApi";
import {
  normalizeShopCode,
  findShopByCode,
  staffRegisterOrSetPin,
  staffLoginWithPin,
  listShopStaff,
  toggleStaffStatus,
} from "@/lib/staff";
import { handleLookupShopCode } from "@/server/staffApiHandler";

describe("PHASE 2 & 3: Shop Code Validation & Cashier Onboarding", () => {
  beforeEach(async () => {
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();
  });

  describe("Shop Code Format & Normalization", () => {
    it("normalizes case, whitespace and missing prefix", () => {
      expect(normalizeShopCode("SEL-MXA8TT")).toBe("SEL-MXA8TT");
      expect(normalizeShopCode(" sel-mxa8tt ")).toBe("SEL-MXA8TT");
      expect(normalizeShopCode("mxa8tt")).toBe("SEL-MXA8TT");
      expect(normalizeShopCode("SEL8421")).toBe("SEL-8421");
      expect(normalizeShopCode(" sel8421 ")).toBe("SEL-8421");
      expect(normalizeShopCode("SEL-8421")).toBe("SEL-8421");
    });

    it("rejects invalid characters and malformed codes", async () => {
      await expect(findShopByCode("")).rejects.toThrow();
      await expect(findShopByCode("   ")).rejects.toThrow();
      await expect(findShopByCode("AB")).rejects.toThrow(/format ya SEL-XXXX/i);
      await expect(findShopByCode("SEL-!@#$")).rejects.toThrow();
    });
  });

  describe("Critical Issue: SEL-MXA8TT Resolution Against Real Database", () => {
    it("successfully resolves SEL-MXA8TT to Demo Jewel Kigali and Demo Owner A", async () => {
      const result = await handleLookupShopCode("SEL-MXA8TT");
      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.shop).toBeDefined();
      expect(result.shop?.businessName).toBe("Demo Jewel Kigali");
      expect(result.shop?.ownerName).toBe("Demo Owner A");
      expect(result.shop?.shopCode).toBe("SEL-MXA8TT");
      expect(result.shop?.hasWriteAccess).toBe(true);
    });

    it("resolves lowercase sel-mxa8tt identically", async () => {
      const result = await handleLookupShopCode("sel-mxa8tt");
      expect(result.ok).toBe(true);
      expect(result.shop?.businessName).toBe("Demo Jewel Kigali");
      expect(result.shop?.shopCode).toBe("SEL-MXA8TT");
    });

    it("resolves with whitespace: '  SEL-MXA8TT  '", async () => {
      const result = await handleLookupShopCode("  SEL-MXA8TT  ");
      expect(result.ok).toBe(true);
      expect(result.shop?.businessName).toBe("Demo Jewel Kigali");
    });

    it("rejects genuinely non-existent shop codes with 404 and clear message", async () => {
      const result = await handleLookupShopCode("SEL-NOTFOUND99");
      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
      expect(result.error).toMatch(/SEL-NOTFOUND99.*ntibonetse/i);
    });
  });

  describe("Employee PIN Setting, Confirmation & Onboarding", () => {
    let localShopCode: string;

    beforeEach(async () => {
      const owner = await signupLocal({
        phone: "0788000111",
        pin: "5555",
        displayName: "Shop Owner One",
        businessName: "Kigali Electronics",
        email: "owner@kigali.rw",
      });
      if ("error" in owner) throw new Error(owner.error);
      localShopCode = owner.profile.shop_code!;
    });

    it("requires exactly 4 digits for cashier work PIN", async () => {
      await expect(
        staffRegisterOrSetPin({
          shopCode: localShopCode,
          phone: "0788555666",
          name: "Kalisa",
          pin: "123", // too short
        })
      ).rejects.toThrow(/PIN igomba kuba imibare 4/);

      await expect(
        staffRegisterOrSetPin({
          shopCode: localShopCode,
          phone: "0788555666",
          name: "Kalisa",
          pin: "12345", // too long
        })
      ).rejects.toThrow(/PIN igomba kuba imibare 4/);

      await expect(
        staffRegisterOrSetPin({
          shopCode: localShopCode,
          phone: "0788555666",
          name: "Kalisa",
          pin: "abcd", // not digits
        })
      ).rejects.toThrow(/PIN igomba kuba imibare 4/);
    });

    it("requires a valid Rwandan phone number", async () => {
      await expect(
        staffRegisterOrSetPin({
          shopCode: localShopCode,
          phone: "invalid_phone",
          name: "Kalisa",
          pin: "1234",
        })
      ).rejects.toThrow(/telefone ntiyemewe/i);
    });

    it("registers cashier and enables fast daily PIN login", async () => {
      const reg = await staffRegisterOrSetPin({
        shopCode: localShopCode,
        phone: "0788777888",
        name: "Keza Diane",
        pin: "4321",
        role: "cashier",
      });

      expect(reg.staff).toBeDefined();
      expect(reg.staff.name).toBe("Keza Diane");
      expect(reg.staff.role).toBe("cashier");
      expect(reg.staff.status).toBe("active");
      expect(reg.shop.businessName).toBe("Kigali Electronics");

      // Verify correct PIN login
      const login = await staffLoginWithPin({
        shopCode: localShopCode,
        phone: "0788777888",
        pin: "4321",
      });
      expect(login.staff.name).toBe("Keza Diane");

      // Reject incorrect PIN
      await expect(
        staffLoginWithPin({
          shopCode: localShopCode,
          phone: "0788777888",
          pin: "9999",
        })
      ).rejects.toThrow(/PIN sibyo/i);
    });

    it("blocks deactivated cashiers from logging in", async () => {
      const reg = await staffRegisterOrSetPin({
        shopCode: localShopCode,
        phone: "0788999000",
        name: "Eric Gasana",
        pin: "8888",
        role: "cashier",
      });

      // Owner deactivates employee
      await toggleStaffStatus(reg.staff.id, false);

      // Login must be rejected
      await expect(
        staffLoginWithPin({
          shopCode: localShopCode,
          phone: "0788999000",
          pin: "8888",
        })
      ).rejects.toThrow(/yarahagaritswe na nyiri ubucuruzi/i);
    });
  });

  describe("Sales Attribution to Authenticated Cashier", () => {
    it("correctly attributes sales to the logged in cashier", async () => {
      const owner = await signupLocal({
        phone: "0788111333",
        pin: "1234",
        displayName: "Owner Biz",
        businessName: "Fashion Hub",
        email: "owner@fashion.rw",
      });
      if ("error" in owner) throw new Error(owner.error);
      const sCode = owner.profile.shop_code!;

      const item = await addInventoryItem({
        item_name: "Silk Dress",
        quantity: 20,
        selling_price: 15000,
        cost_price: 9000,
      });

      const reg = await staffRegisterOrSetPin({
        shopCode: sCode,
        phone: "0788444555",
        name: "Cashier Sarah",
        pin: "7777",
        role: "cashier",
      });

      // Cashier creates a sale
      const saleResult = await createSaleOrder({
        items: [
          {
            inventory_item_id: item.id,
            item_name: item.item_name,
            quantity: 2,
            unit_price: 15000,
          },
        ],
        amount: 30000,
        paidNow: true,
        paymentMethod: "cash",
        cashierUserId: reg.staff.id,
        cashierName: reg.staff.name,
        shopId: sCode,
      });

      expect(saleResult.sales.length).toBe(1);
      const sale = saleResult.sales[0];
      expect(sale.cashier_user_id).toBe(reg.staff.id);
      expect(sale.cashier_name).toBe("Cashier Sarah");

      // Verify that owner's staff list correctly aggregates this cashier's sales
      const staffList = await listShopStaff(owner.profile.id, sCode);
      const sarah = staffList.find((s) => s.id === reg.staff.id);
      expect(sarah).toBeDefined();
      expect(sarah?.total_sales_count).toBe(1);
      expect(sarah?.total_sales_volume).toBe(30000);
    });
  });
});
