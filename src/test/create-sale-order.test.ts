import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/localDb";
import {
  addInventoryItem,
  createSaleOrder,
  listActiveDebts,
  recordPayment,
  signupLocal,
} from "@/db/localApi";

describe("createSaleOrder (local)", () => {
  beforeEach(async () => {
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();
    const result = await signupLocal({
      phone: "0788000099",
      pin: "1234",
      displayName: "Tester",
      businessName: "Test Boutique",
      email: "tester@example.com",
    });
    expect("error" in result).toBe(false);
  });

  it("records split MoMo + cash as fully paid", async () => {
    const item = await addInventoryItem({
      item_name: "Shirt",
      quantity: 10,
      cost_price: 10000,
      selling_price: 25000,
    });

    const result = await createSaleOrder({
      clientName: "Jean",
      phone: "+250788111222",
      amount: 50000,
      payments: [
        { method: "momo", amount: 30000, referenceNumber: "TX1" },
        { method: "cash", amount: 20000 },
      ],
      items: [
        {
          inventory_item_id: item.id,
          item_name: item.item_name,
          quantity: 2,
          unit_price: 25000,
        },
      ],
    });

    expect(result.paid).toBe(50000);
    expect(result.remaining).toBe(0);
    expect(result.payments).toHaveLength(2);
    expect(result.sales.every((s) => s.payment_status === "paid")).toBe(true);
    expect(result.receiptNumber).toMatch(/^R-/);
    const debts = await listActiveDebts();
    expect(debts.length).toBe(0);
  });

  it("keeps partial balance and clears with later payment", async () => {
    const item = await addInventoryItem({
      item_name: "Shoes",
      quantity: 5,
      cost_price: 20000,
      selling_price: 50000,
    });

    const result = await createSaleOrder({
      clientName: "Alice",
      amount: 100000,
      payments: [{ method: "cash", amount: 40000 }],
      items: [
        {
          inventory_item_id: item.id,
          item_name: item.item_name,
          quantity: 2,
          unit_price: 50000,
        },
      ],
    });

    expect(result.remaining).toBe(60000);
    expect(result.sales[0].payment_status).toBe("partial");

    await recordPayment({
      debtId: result.debt.id,
      amount: 60000,
      paymentMethod: "momo",
      referenceNumber: "TX-CLEAR",
    });

    const debts = await listActiveDebts();
    expect(debts.length).toBe(0);
  });
});
