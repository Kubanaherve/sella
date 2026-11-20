import { mkdirSync } from "node:fs";
import { buildDebtReportPdf } from "../src/lib/invoicePdf";

const names = [
  "Aline Mukamana",
  "Claude Nkurunziza",
  "Uwamahoro Ingabire",
  "Jean de Dieu Habimana",
  "Marie Claire Uwase",
  "Patrick Mugisha",
  "Chantal Ingabire",
  "Eric Ndayambaje",
];
const goods = [
  [{ name: "Gold ring", quantity: 1 }],
  [
    { name: "Chain", quantity: 2 },
    { name: "Beads", quantity: 3 },
  ],
  [{ name: "Wedding necklace with a long workshop description", quantity: 1 }],
  [{ name: "Bracelet", quantity: 4 }],
  [{ name: "Earrings", quantity: 1 }],
];

const rows = Array.from({ length: 18 }, (_, index) => {
  const total = 15000 + index * 3500;
  const payments =
    index % 7 === 0 ? [total] : index % 3 === 0 ? [4000, 2500] : index % 2 === 0 ? [5000] : [];
  return {
    name: names[index % names.length],
    createdAt: new Date(Date.UTC(2026, 10, 1 + index, 8)).toISOString(),
    originalAmount: total,
    paidAmount: 0,
    remainingAmount: total,
    paymentAmounts: payments,
    lines: goods[index % goods.length].map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: 1000,
    })),
  };
});

const shared = {
  shopName: "Demo Jewel Kigali",
  shopPayPhone: "0788 111 222",
  generatedAtIso: "2026-11-20T08:00:00.000Z",
  rows,
  grandTotal: 0,
};
const doc = await buildDebtReportPdf({ ...shared, format: "desktop" });
const phone = await buildDebtReportPdf({ ...shared, format: "phone" });

mkdirSync("/tmp/sella-pdf-preview", { recursive: true });
doc.save("/tmp/sella-pdf-preview/all-debts.pdf");
phone.save("/tmp/sella-pdf-preview/all-debts-phone.pdf");
console.log("pages", doc.getNumberOfPages(), "phone", phone.getNumberOfPages());
