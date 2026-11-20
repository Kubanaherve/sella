import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/localDb";
import {
  addInventoryItem,
  createSaleOrder,
  deleteInventoryItem,
  getDailyReports,
  getDashboardStats,
  listActiveDebts,
  listInventory,
  recordCashSale,
  recordPayment,
  resetSalesMoney,
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

  it("rejects a second repayment that reuses the same MoMo reference", async () => {
    const item = await addInventoryItem({
      item_name: "Rice",
      quantity: 4,
      cost_price: 8000,
      selling_price: 15000,
    });
    const sale = await createSaleOrder({
      clientName: "Alice",
      amount: 30000,
      payments: [{ method: "cash", amount: 10000 }],
      items: [
        {
          inventory_item_id: item.id,
          item_name: item.item_name,
          quantity: 2,
          unit_price: 15000,
        },
      ],
    });

    await recordPayment({
      debtId: sale.debt.id,
      amount: 5000,
      paymentMethod: "momo",
      referenceNumber: "TX-99",
    });
    await expect(
      recordPayment({
        debtId: sale.debt.id,
        amount: 5000,
        paymentMethod: "momo",
        referenceNumber: "tx-99",
      })
    ).rejects.toThrow(/reference/i);

    const debts = await listActiveDebts();
    expect(debts[0].remaining_balance).toBe(15000);
  });

  it("does not sell a zero quantity and does not touch stock", async () => {
    const item = await addInventoryItem({
      item_name: "Soap",
      quantity: 6,
      cost_price: 400,
      selling_price: 800,
    });
    await expect(
      createSaleOrder({
        clientName: "Walk-in",
        amount: 0,
        payments: [],
        items: [
          {
            inventory_item_id: item.id,
            item_name: item.item_name,
            quantity: 0,
            unit_price: 800,
          },
        ],
      })
    ).rejects.toThrow(/1/);
    const left = await listInventory();
    expect(left[0].quantity).toBe(6);
  });

  it("rejects two lines of the same product when they exceed stock together", async () => {
    const item = await addInventoryItem({
      item_name: "Oil",
      quantity: 5,
      cost_price: 2000,
      selling_price: 3000,
    });
    await expect(
      createSaleOrder({
        clientName: "Walk-in",
        amount: 18000,
        payments: [{ method: "cash", amount: 18000 }],
        items: [
          {
            inventory_item_id: item.id,
            item_name: item.item_name,
            quantity: 3,
            unit_price: 3000,
          },
          {
            inventory_item_id: item.id,
            item_name: item.item_name,
            quantity: 3,
            unit_price: 3000,
          },
        ],
      })
    ).rejects.toThrow(/Stock/);
    const left = await listInventory();
    expect(left[0].quantity).toBe(5);
    expect(await db.sales.count()).toBe(0);
  });

  it("reports the discounted amount the customer was charged", async () => {
    const item = await addInventoryItem({
      item_name: "Dress",
      quantity: 3,
      cost_price: 10000,
      selling_price: 50000,
    });
    await createSaleOrder({
      clientName: "Marie",
      amount: 100000,
      discountAmount: 10000,
      payments: [{ method: "cash", amount: 90000 }],
      items: [
        {
          inventory_item_id: item.id,
          item_name: item.item_name,
          quantity: 2,
          unit_price: 50000,
        },
      ],
    });
    const stats = await getDashboardStats();
    expect(stats.salesVolume).toBe(90000);
    expect(stats.moneyCollected).toBe(90000);
    const reports = await getDailyReports();
    expect(reports[0].cashSales).toBe(90000);
    expect(reports[0].accrualNewBusiness).toBe(90000);
  });

  it("records collected cash for a sale that is not tied to stock", async () => {
    const sale = await recordCashSale({
      item_name: "Delivery fee",
      quantity: 2,
      cost_price: 0,
      sale_price: 1500,
      payment_method: "cash",
    });
    expect(sale.quantity).toBe(2);
    expect(sale.payment_status).toBe("paid");
    const stats = await getDashboardStats();
    expect(stats.moneyCollected).toBe(3000);
    expect(stats.salesVolume).toBe(3000);
  });

  it("blocks a duplicate barcode and deletion of a product that was sold", async () => {
    const item = await addInventoryItem({
      item_name: "Belt",
      quantity: 2,
      cost_price: 3000,
      selling_price: 7000,
      barcode: "600111",
    });
    await expect(
      addInventoryItem({
        item_name: "Belt copy",
        quantity: 1,
        cost_price: 3000,
        selling_price: 7000,
        barcode: "600111",
      })
    ).rejects.toThrow(/Barcode/);

    await createSaleOrder({
      clientName: "Walk-in",
      amount: 7000,
      payments: [{ method: "cash", amount: 7000 }],
      items: [
        {
          inventory_item_id: item.id,
          item_name: item.item_name,
          quantity: 1,
          unit_price: 7000,
        },
      ],
    });
    await expect(deleteInventoryItem(item.id)).rejects.toThrow(/gusiba/);
    expect((await listInventory())[0].quantity).toBe(1);
  });

  it("rejects a fractional quantity so stock and the charge cannot drift", async () => {
    const item = await addInventoryItem({
      item_name: "Sugar",
      quantity: 10,
      cost_price: 500,
      selling_price: 1000,
    });
    await expect(
      createSaleOrder({
        clientName: "Walk-in",
        amount: 1900,
        payments: [{ method: "cash", amount: 1900 }],
        items: [
          {
            inventory_item_id: item.id,
            item_name: item.item_name,
            quantity: 1.9,
            unit_price: 1000,
          },
        ],
      })
    ).rejects.toThrow(/wuzuye/);
    expect((await listInventory())[0].quantity).toBe(10);
  });

  it("replays the same repayment once", async () => {
    const item = await addInventoryItem({
      item_name: "Soap",
      quantity: 5,
      cost_price: 200,
      selling_price: 1000,
    });
    const sale = await createSaleOrder({
      clientName: "Keza",
      phone: "0788123456",
      amount: 2000,
      payments: [],
      items: [
        {
          inventory_item_id: item.id,
          item_name: item.item_name,
          quantity: 2,
          unit_price: 1000,
        },
      ],
    });
    const key = "pay-replay-1";
    const first = await recordPayment({
      debtId: sale.debt.id,
      amount: 1000,
      paymentMethod: "cash",
      idempotencyKey: key,
    });
    const second = await recordPayment({
      debtId: sale.debt.id,
      amount: 1000,
      paymentMethod: "cash",
      idempotencyKey: key,
    });
    expect(second.id).toBe(first.id);
    const stored = await db.debts.get(sale.debt.id);
    expect(stored?.remaining_balance).toBe(1000);
  });

  it("refuses to wipe sales without the owner PIN", async () => {
    await expect(resetSalesMoney("0000")).rejects.toThrow(/PIN/);
    await resetSalesMoney("1234");
  });
});
