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

/** Glass invoice-style A4 PDF (shared Sella PDF design system). */
export async function downloadReceiptPdf(data: ReceiptData): Promise<string> {
  const { downloadInvoicePdf } = await import("@/lib/invoicePdf");
  const filename = `sella-receipt-${data.receiptNumber}.pdf`;
  const status =
    data.paymentStatus === "paid"
      ? "paid"
      : data.paymentStatus === "partial"
        ? "partial"
        : "credit";
  await downloadInvoicePdf(
    {
      invoiceNumber: data.receiptNumber,
      createdAt: data.createdAt,
      shopName: data.shopName,
      shopPhone: data.shopPhone || "",
      shopEmail: data.shopEmail,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerLocation: "Kigali, Rwanda",
      lines: data.lines.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        takenAt: data.createdAt,
      })),
      total: data.total,
      paid: data.paid,
      remaining: data.remaining,
      payPhone: data.shopPhone || "—",
      kind: "receipt",
      status,
      note:
        data.thankYouMessage ||
        undefined,
    },
    filename
  );
  return filename;
}
