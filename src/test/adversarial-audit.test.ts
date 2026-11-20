import { describe, expect, it } from "vitest";
import { normalizePaymentSlices } from "@/lib/money";
import { isInGracePeriod, hasWriteAccess, type SubscriptionSnapshot } from "@/lib/entitlements";
import { isPermanentStockFailure } from "@/lib/syncErrors";
import { db } from "@/db/localDb";
import { signupLocal, createSaleOrder, addInventoryItem } from "@/db/localApi";

describe("Adversarial audit regressions", () => {
  it("keeps cash tendered when MoMo already covers the bill", () => {
    const result = normalizePaymentSlices(
      [
        { method: "momo", amount: 5000 },
        { method: "cash", amount: 2000 },
      ],
      5000
    );

    expect(result.changeDue).toBe(2000);
    expect(result.cashTendered).toBe(2000);
    expect(result.paid).toBe(5000);
    expect(result.slices).toHaveLength(1);
    expect(result.slices[0].method).toBe("momo");
    expect(result.slices.find((s) => s.method === "cash")).toBeUndefined();
  });

  it("keeps write access for an expired plan inside the 3-day grace window", () => {
    const expiredSub: SubscriptionSnapshot = {
      workspaceId: "user:123",
      userId: "123",
      status: "expired",
      planTier: "monthly",
      provider: "paypack",
      priceRwf: 5000,
      trialEndsAt: null,
      currentPeriodEnd: new Date(Date.now() - 3600 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    };

    expect(isInGracePeriod(expiredSub)).toBe(true);
    expect(hasWriteAccess(expiredSub)).toBe(true);
  });

  it("treats the Kinyarwanda missing-item error as a terminal stock failure", () => {
    expect(isPermanentStockFailure("Igicuruzwa ntabwo kibonetse")).toBe(true);
    expect(isPermanentStockFailure("Stock ya Amata ntihagije")).toBe(true);
    expect(isPermanentStockFailure("timeout")).toBe(false);
  });

  it("stores change_given and receipt_number on the local debt", async () => {
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();

    await signupLocal({
      phone: "0788000088",
      pin: "1234",
      displayName: "Audit Shop",
      businessName: "Audit Shop",
      email: "audit@example.com",
    });

    const item = await addInventoryItem({
      item_name: "Amata",
      quantity: 10,
      cost_price: 500,
      selling_price: 1000,
    });

    const result = await createSaleOrder({
      clientName: "Kalisa",
      phone: "0788111222",
      amount: 4000,
      discountAmount: 1000,
      changeGiven: 1000,
      payments: [{ method: "cash", amount: 5000 }],
      items: [
        {
          inventory_item_id: item.id,
          item_name: item.item_name,
          quantity: 5,
          unit_price: 1000,
        },
      ],
    });

    const storedDebt = await db.debts.get(result.debt.id);
    expect(storedDebt?.change_given).toBe(1000);
    expect(storedDebt?.receipt_number).toBe(result.receiptNumber);
    expect(result.cashTendered).toBe(5000);
  });
});
