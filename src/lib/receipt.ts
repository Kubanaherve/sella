import { formatCurrency } from "@/lib/kinyarwanda";
import type { PaymentMethod } from "@/db/types";
import { toRwf } from "@/lib/money";

export type ReceiptLine = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type ReceiptPayment = {
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string | null;
};

export type ReceiptData = {
  shopName: string;
  shopPhone?: string | null;
  shopEmail?: string | null;
  receiptNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string | null;
  lines: ReceiptLine[];
  discountAmount?: number;
  total: number;
  paid: number;
  remaining: number;
  payments: ReceiptPayment[];
  thankYouMessage?: string;
  paymentStatus: "paid" | "credit" | "partial";
};

/** Deterministic accent from shop name (not a trademark claim). */
export function shopAccentFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hues = [210, 195, 168, 152, 24, 340];
  const hue = hues[h % hues.length];
  return `hsl(${hue} 55% 38%)`;
}

export function shopInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function buildWhatsAppReceiptMessage(data: ReceiptData): string {
  const lines = data.lines
    .map(
      (l) =>
        `${l.quantity} × ${l.name} — ${formatCurrency(toRwf(l.unitPrice) * l.quantity)}`
    )
    .join("\n");
  const pays = data.payments
    .map(
      (p) =>
        `${labelMethod(p.method)}: ${formatCurrency(p.amount)}${
          p.referenceNumber ? ` (Ref ${p.referenceNumber})` : ""
        }`
    )
    .join("\n");

  return [
    `Hello ${data.customerName || "customer"}!`,
    "",
    `Thank you for shopping at ${data.shopName}.`,
    "",
    "Purchase summary:",
    lines || "—",
    data.discountAmount
      ? `\nDiscount: -${formatCurrency(data.discountAmount)}`
      : "",
    "",
    `Total: ${formatCurrency(data.total)}`,
    "",
    "Payment received:",
    pays || "None yet (credit)",
    "",
    `Outstanding balance: ${formatCurrency(data.remaining)}`,
    `Receipt: ${data.receiptNumber}`,
    "",
    data.thankYouMessage || "Thank you for choosing us!",
  ]
    .filter((x) => x !== "")
    .join("\n");
}

function labelMethod(m: PaymentMethod): string {
  switch (m) {
    case "momo":
      return "MTN MoMo";
    case "airtel":
      return "Airtel Money";
    case "bank":
      return "Bank";
    default:
      return "Cash";
  }
}

async function buildReceiptDoc(data: ReceiptData) {
  const { buildBlueGlassReceiptPdf } = await import("@/lib/blueGlass/buildDocs");
  const primary = data.payments[0];
  const payment = toRwf(data.paid);
  const previousBalance = toRwf(data.remaining) + payment;
  return buildBlueGlassReceiptPdf({
    shopName: data.shopName,
    shopPhone: data.shopPhone,
    shopEmail: data.shopEmail,
    shopLocation: "Kigali, Rwanda",
    receiptNumber: data.receiptNumber,
    invoiceNumber: data.receiptNumber,
    createdAt: data.createdAt,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerLocation: "Kigali, Rwanda",
    method: primary ? labelMethod(primary.method) : "Payment",
    reference: primary?.referenceNumber || data.receiptNumber,
    previousBalance,
    payment,
    thankYouMessage: data.thankYouMessage,
  });
}

/** Blue-glass receipt PDF matching the official Sella HTML reference. */
export async function downloadReceiptPdf(data: ReceiptData): Promise<string> {
  const filename = `sella-receipt-${data.receiptNumber}.pdf`;
  const doc = await buildReceiptDoc(data);
  doc.save(filename);
  return filename;
}

export async function receiptPdfBlob(data: ReceiptData): Promise<Blob> {
  const doc = await buildReceiptDoc(data);
  return doc.output("blob");
}
