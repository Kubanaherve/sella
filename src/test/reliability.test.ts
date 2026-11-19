import { beforeEach, describe, expect, it } from "vitest";
import { buildLedgerDailyReports, isDateInFilter, netSalesVolume } from "@/lib/reporting";
import { buildWhatsAppReceiptMessage, type ReceiptData } from "@/lib/receipt";
import { isLowStock } from "@/lib/uiTheme";
import { phoneToWhatsAppDigits } from "@/lib/phone";
import { clearOutbox, drainOutbox, enqueueOutbox } from "@/db/outbox";

describe("reported sales after a discount", () => {
  it("subtracts the basket discount from gross line totals", () => {
    const at = "2026-05-02T10:00:00.000Z";
    const net = netSalesVolume(
      [{ sale_price: 50000, quantity: 2, created_at: at }],
      [{ discount_amount: 10000, created_at: at, total_amount: 90000 }],
    );
    expect(net).toBe(90000);
  });

  it("attributes a late-evening UTC sale to the Kigali business day", () => {
    const reports = buildLedgerDailyReports({
      sales: [
        {
          sale_price: 5000,
          quantity: 1,
          created_at: "2026-05-01T22:30:00.000Z",
        },
      ],
      payments: [{ amount: 5000, created_at: "2026-05-01T22:30:00.000Z" }],
      debts: [
        {
          discount_amount: 0,
          total_amount: 5000,
          remaining_balance: 0,
          status: "paid",
          created_at: "2026-05-01T22:30:00.000Z",
        },
      ],
    });
    expect(reports).toHaveLength(1);
    expect(reports[0].date).toBe("2026-05-02");
    expect(reports[0].receivedTotal).toBe(5000);
    expect(isDateInFilter("2026-05-02", "today", new Date("2026-05-01T22:30:00.000Z"))).toBe(
      true
    );
  });
});

describe("low stock and WhatsApp", () => {
  it("uses the product minimum instead of a hardcoded 3", () => {
    expect(isLowStock(8, 10)).toBe(true);
    expect(isLowStock(8, 3)).toBe(false);
    expect(isLowStock(3, null)).toBe(true);
  });

  it("includes change on the WhatsApp receipt", () => {
    const data: ReceiptData = {
      shopName: "Test Shop",
      receiptNumber: "R-1",
      createdAt: "2026-05-02T10:00:00.000Z",
      customerName: "Aline",
      lines: [{ name: "Soap", quantity: 1, unitPrice: 1000 }],
      total: 1000,
      paid: 1000,
      remaining: 0,
      changeDue: 500,
      payments: [{ method: "cash", amount: 1000 }],
      paymentStatus: "paid",
    };
    expect(buildWhatsAppReceiptMessage(data)).toContain("Change:");
  });

  it("normalizes a 00 international prefix for WhatsApp", () => {
    expect(phoneToWhatsAppDigits("00250788123456")).toBe("250788123456");
    expect(phoneToWhatsAppDigits("0788123456")).toBe("250788123456");
  });
});

describe("offline outbox", () => {
  beforeEach(async () => {
    await clearOutbox();
  });

  it("does not sync the same queued sale from two overlapping drains", async () => {
    await enqueueOutbox({
      operation: "create_sale_order",
      idempotency_key: "sale-1",
      payload: { items: [{ inventory_item_id: "a", quantity: 1 }] },
    });
    let calls = 0;
    const invoke = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 30));
    };
    const [a, b] = await Promise.all([drainOutbox(invoke), drainOutbox(invoke)]);
    expect(calls).toBe(1);
    expect(a.synced + b.synced).toBe(1);
  });

  it("retries a failed sync and then marks it done", async () => {
    await enqueueOutbox({
      operation: "record_payment",
      idempotency_key: "pay-1",
      payload: { amount: 1000 },
    });
    const first = await drainOutbox(async () => {
      throw new Error("timeout");
    });
    expect(first.failed).toBe(1);
    const second = await drainOutbox(async () => {});
    expect(second.synced).toBe(1);
    const third = await drainOutbox(async () => {});
    expect(third.synced).toBe(0);
  });
});
