import type { jsPDF } from "jspdf";
import { getAppLanguage } from "@/lib/appLanguage";
import type {
  DebtorStatementRow,
  InvoiceData,
  InvoiceLine,
  InvoicePaymentStatus,
} from "@/lib/pdfTypes";

export type {
  DebtorStatementRow,
  InvoiceData,
  InvoiceLine,
  InvoicePaymentStatus,
};

/**
 * Final visual system: Sella Blue-Glass HTML/SVG reference
 * (invoice + receipt + debtors statement).
 */
export async function buildInvoicePdf(data: InvoiceData): Promise<jsPDF> {
  if (data.kind === "receipt") {
    const { buildBlueGlassReceiptPdf } = await import("@/lib/blueGlass/buildDocs");
    const payment = data.paid ?? 0;
    const remaining = data.remaining ?? Math.max(0, data.total - payment);
    return buildBlueGlassReceiptPdf({
      shopName: data.shopName,
      shopPhone: data.shopPhone,
      shopEmail: data.shopEmail,
      shopLocation: data.shopLocation || data.shopAddress,
      receiptNumber: data.invoiceNumber,
      invoiceNumber: data.invoiceNumber,
      createdAt: data.createdAt,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerLocation: data.customerLocation,
      method: data.paymentMethodLabel || "Payment",
      reference: data.paymentReference || data.invoiceNumber,
      previousBalance: remaining + payment,
      payment,
      thankYouMessage: data.note,
    });
  }

  const { buildBlueGlassInvoicePdf } = await import("@/lib/blueGlass/buildDocs");
  return buildBlueGlassInvoicePdf(data);
}

export async function downloadInvoicePdf(data: InvoiceData, filename?: string) {
  const doc = await buildInvoicePdf(data);
  const name =
    filename ||
    `invoice-sella-${data.invoiceNumber.replace(/[^\w-]+/g, "")}.pdf`;
  doc.save(name);
  return name;
}

export async function invoicePdfBlob(data: InvoiceData): Promise<Blob> {
  const doc = await buildInvoicePdf(data);
  return doc.output("blob");
}

export async function buildDebtReportPdf(opts: {
  shopName: string;
  shopPhone?: string;
  shopEmail?: string | null;
  shopAddress?: string | null;
  shopLocation?: string | null;
  shopPayPhone?: string | null;
  shopLogoDataUrl?: string | null;
  rows: DebtorStatementRow[];
  grandTotal: number;
  reportDate?: string;
  generatedAtIso?: string;
  language?: InvoiceData["language"];
}): Promise<jsPDF> {
  const { buildBlueGlassStatementPdf } = await import("@/lib/blueGlass/buildDocs");
  return buildBlueGlassStatementPdf(opts);
}

export async function downloadDebtReportPdf(
  opts: Parameters<typeof buildDebtReportPdf>[0],
  filename?: string
) {
  const doc = await buildDebtReportPdf(opts);
  const name = filename || `sella-debt-report-${Date.now()}.pdf`;
  doc.save(name);
  return name;
}

export async function debtReportPdfBlob(
  opts: Parameters<typeof buildDebtReportPdf>[0]
): Promise<Blob> {
  const doc = await buildDebtReportPdf(opts);
  return doc.output("blob");
}

/** Pretty items string: (Bracelets: 2 , Chainette: 3 ) */
export function formatItemsParen(lines: InvoiceLine[]): string {
  if (!lines.length) return "(—)";
  const inner = lines.map((l) => `${l.name}: ${l.quantity}`).join(" , ");
  return `(${inner} )`;
}

export function buildDebtWhatsAppMessage(opts: {
  itemsParen: string;
  shopName: string;
  payPhone: string;
}): string {
  const lang = getAppLanguage();
  if (lang === "en") {
    return [
      "Hello valued customer, we wanted to remind you that you still have these items on credit:",
      opts.itemsParen,
      "Please review the PDF and come settle when you can.",
      "Thank you very much!",
      "",
      `Thank you for shopping at ${opts.shopName}`,
      `Pay to: ${opts.payPhone}`,
    ].join("\n");
  }
  return [
    "Muraho mukiliya mwiza twifuzaga kubibutsa ko mufite mwafashe ibi bintu bikurikira",
    opts.itemsParen,
    "nimubone umwanya murebe PDF twabahaye muze kuyigenderaho mwishyura.",
    "Turabashimiye cyane!",
    "",
    `Murakoze kugana ${opts.shopName}`,
    `Ishura kuri: ${opts.payPhone}`,
  ].join("\n");
}
