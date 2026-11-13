import { describe, expect, it } from "vitest";
import {
  renderInvoiceSvgPages,
  renderReceiptSvgPages,
  renderStatementSvgPages,
} from "@/lib/blueGlass/renderSvg";

const ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const WORDMARK =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("blue glass SVG docs", () => {
  it("embeds the glass handwritten Sella wordmark image", () => {
    const invoice = renderInvoiceSvgPages(
      {
        id: "INV-1",
        date: "Nov 12, 2026",
        due: "Nov 20, 2026",
        customer: "Aline Mukamana",
        phone: "0780000000",
        address: "Kigali, Rwanda",
        currency: "RWF",
        paid: 15000,
        items: [
          { description: "Chainette", qty: 2, unit: 25000 },
          { description: "Bracelet", qty: 1, unit: 10000 },
        ],
        note: ["Thank you for choosing Isoko rya Kacyiru.", "Pay to shop: 0781111111."],
        contacts: ["www.sella.app", "support@sella.app", "0781111111"],
      },
      ICON,
      WORDMARK
    );
    expect(invoice[0]).toContain(WORDMARK);
    expect(invoice[0]).toContain("Aline Mukamana");
    expect(invoice[0]).toContain("Partial");
    expect(invoice[0]).toContain("#0b3fcc");
  });

  it("renders receipt and statement with glass script mark", () => {
    const receipt = renderReceiptSvgPages(
      {
        shop: "Isoko rya Kacyiru",
        customer: "Aline Mukamana",
        address: "Kacyiru, Kigali",
        date: "Nov 12, 2026",
        id: "RC-1",
        invoice: "INV-1",
        method: "MTN MoMo",
        ref: "MOMO-1",
        currency: "RWF",
        previousBalance: 60000,
        payment: 15000,
        contacts: ["Isoko rya Kacyiru", "Kacyiru, Kigali"],
      },
      ICON,
      WORDMARK
    );
    expect(receipt[0]).toContain(WORDMARK);
    expect(receipt[0]).toContain("Received");

    const statement = renderStatementSvgPages(
      {
        shop: "Isoko rya Kacyiru",
        id: "ST-261112",
        asOf: "2026-11-12",
        date: "Nov 12, 2026",
        currency: "RWF",
        rows: [
          { name: "Claude Nkurunziza", due: "2026-11-08", original: 78000, paid: 18000 },
          { name: "Aline Mukamana", due: "2026-11-20", original: 85000, paid: 35000 },
        ],
      },
      ICON,
      WORDMARK
    );
    expect(statement[0]).toContain(WORDMARK);
    expect(statement[0]).toContain("Open debt");
  });
});
