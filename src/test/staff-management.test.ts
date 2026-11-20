import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/localDb";
import { signupLocal, createSaleOrder, addInventoryItem } from "@/db/localApi";
import {
  findShopByCode,
  staffRegisterOrSetPin,
  staffLoginWithPin,
  listShopStaff,
  addShopStaff,
  toggleStaffStatus,
  resetStaffPin,
  revokeStaffSession,
  normalizeShopCode,
} from "@/lib/staff";

describe("Owner's Staff Management & Cashier PIN Onboarding", () => {
  let shopCode = "";
  let ownerId = "";

  beforeEach(async () => {
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();

    const signup = await signupLocal({
      phone: "0788111222",
      pin: "9041",
      displayName: "Jean Owner",
      businessName: "Bijoux Boutique",
      email: "jean@bijoux.rw",
    });

    if ("error" in signup) throw new Error(signup.error);
    shopCode = signup.profile.shop_code!;
    ownerId = signup.profile.id;
    expect(shopCode).toMatch(/^SEL-/);
  });

  it("1. Shop Code normalization and discovery", async () => {
    expect(normalizeShopCode(" sel-8421 ")).toBe("SEL-8421");
    expect(normalizeShopCode("SEL8421")).toBe("SEL-8421");

    // Discover the shop by code
    const shop = await findShopByCode(shopCode.toLowerCase());
    expect(shop.businessName).toBe("Bijoux Boutique");
    expect(shop.shopCode).toBe(shopCode);

    // Reject invalid shop code
    await expect(findShopByCode("SEL-999999")).rejects.toThrow(/Shop Code .*ntibonetse/i);
  }, 30000);

  it("2. Cashier registers and sets confirmed PIN via Shop Code", async () => {
    const result = await staffRegisterOrSetPin({
      shopCode,
      phone: "0788333444",
      name: "Aline Mutesi",
      pin: "1425",
      role: "cashier",
    });

    expect(result.staff.name).toBe("Aline Mutesi");
    expect(result.staff.phone_normalized).toBe("+250788333444");
    expect(result.staff.status).toBe("active");
    expect(result.staff.pin_hash).toBeDefined();

    // Verify staff login succeeds with correct PIN
    const login = await staffLoginWithPin({
      shopCode,
      phone: "0788333444",
      pin: "1425",
    });
    expect(login.staff.id).toBe(result.staff.id);
    expect(login.shop.businessName).toBe("Bijoux Boutique");

    // Reject wrong PIN
    await expect(
      staffLoginWithPin({
        shopCode,
        phone: "0788333444",
        pin: "9999",
      })
    ).rejects.toThrow(/PIN sibyo/);
  });

  it("3. Owner adds a staff member and sets role", async () => {
    const staff = await addShopStaff(ownerId, shopCode, {
      name: "Eric Manager",
      phone: "0788555666",
      role: "manager",
    });

    expect(staff.name).toBe("Eric Manager");
    expect(staff.role).toBe("manager");
    expect(staff.status).toBe("active");

    const allStaff = await listShopStaff(ownerId, shopCode);
    expect(allStaff.some((s) => s.name === "Eric Manager")).toBe(true);
  });

  it("4. Owner deactivates and reactivates a cashier", async () => {
    const { staff } = await staffRegisterOrSetPin({
      shopCode,
      phone: "0788333444",
      name: "Aline Mutesi",
      pin: "1425",
    });

    // Owner deactivates Aline
    await toggleStaffStatus(staff.id, false);

    // Aline tries to log in while deactivated
    await expect(
      staffLoginWithPin({
        shopCode,
        phone: "0788333444",
        pin: "1425",
      })
    ).rejects.toThrow(/Konti yawe yarahagaritswe/);

    // Owner reactivates Aline
    await toggleStaffStatus(staff.id, true);
    const login = await staffLoginWithPin({
      shopCode,
      phone: "0788333444",
      pin: "1425",
    });
    expect(login.staff.status).toBe("active");
  });

  it("5. Owner resets cashier PIN", async () => {
    const { staff } = await staffRegisterOrSetPin({
      shopCode,
      phone: "0788333444",
      name: "Aline Mutesi",
      pin: "1425",
    });

    // Owner resets PIN to 8888
    await resetStaffPin(staff.id, "8888");

    // Old PIN fails
    await expect(
      staffLoginWithPin({
        shopCode,
        phone: "0788333444",
        pin: "1425",
      })
    ).rejects.toThrow(/PIN sibyo/);

    // New PIN succeeds
    const login = await staffLoginWithPin({
      shopCode,
      phone: "0788333444",
      pin: "8888",
    });
    expect(login.staff.id).toBe(staff.id);
  });

  it("6. Owner immediately revokes staff session", async () => {
    const { staff } = await staffRegisterOrSetPin({
      shopCode,
      phone: "0788333444",
      name: "Aline Mutesi",
      pin: "1425",
    });

    expect(staff.session_revoked_at).toBeUndefined();

    await revokeStaffSession(staff.id);
    const updated = await db.staff.get(staff.id);
    expect(updated?.session_revoked_at).toBeDefined();
    expect(new Date(updated!.session_revoked_at!).getTime()).toBeGreaterThan(0);
  });

  it("7. Tracks and aggregates sales per staff member", async () => {
    const item = await addInventoryItem({
      item_name: "Ikanzu (Dress)",
      quantity: 50,
      cost_price: 5000,
      selling_price: 15000,
    });

    const { staff } = await staffRegisterOrSetPin({
      shopCode,
      phone: "0788333444",
      name: "Aline Mutesi",
      pin: "1425",
    });

    // Cashier Aline makes a sale of 2 dresses (30,000 RWF)
    const sale = await createSaleOrder({
      clientName: "Customer 1",
      phone: "0788111999",
      amount: 30000,
      payments: [{ method: "cash", amount: 30000 }],
      items: [
        {
          inventory_item_id: item.id,
          item_name: item.item_name,
          quantity: 2,
          unit_price: 15000,
        },
      ],
    });

    // Stamp cashier ID on the sale record
    await db.sales.where("id").equals(sale.sales[0].id).modify({
      cashier_id: staff.id,
      cashier_name: staff.name,
    } as any);

    const staffList = await listShopStaff(ownerId, shopCode);
    const aline = staffList.find((s) => s.id === staff.id);
    expect(aline).toBeDefined();
    expect(aline?.total_sales_count).toBe(1);
    expect(aline?.total_sales_volume).toBe(30000);
  });
});
