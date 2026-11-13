import { jsPDF } from "jspdf";
import { toRwf } from "@/lib/money";
import { getAppLanguage, type AppLanguage } from "@/lib/appLanguage";
import { BRAND } from "@/lib/brand";
import type {
  DebtorStatementRow,
  InvoiceData,
} from "@/lib/pdfTypes";
import {
  renderInvoiceSvgPages,
  renderReceiptSvgPages,
  renderStatementSvgPages,
} from "@/lib/blueGlass/renderSvg";
import {
  blueGlassSvgPagesToPdf,
  loadBlueGlassIconDataUrl,
  loadBlueGlassWordmarkDataUrl,
} from "@/lib/blueGlass/svgToPdf";

function formatDocDate(iso: string, lang: AppLanguage): string {
  try {
    return new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "fr-RW", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDueIso(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return String(iso).slice(0, 10);
  }
}

function shopContacts(data: {
  shopName?: string;
  shopEmail?: string | null;
  shopPhone?: string;
  payPhone?: string;
  shopLocation?: string | null;
  shopAddress?: string | null;
}): string[] {
  return [
    "www.sella.app",
    data.shopEmail || "support@sella.app",
    data.payPhone || data.shopPhone || "—",
  ];
}

/** Invoice / credit note — blue-glass SVG design. */
export async function buildBlueGlassInvoicePdf(
  data: InvoiceData
): Promise<jsPDF> {
  const lang = data.language || getAppLanguage();
  const [icon, wordmark] = await Promise.all([
    loadBlueGlassIconDataUrl(data.shopLogoDataUrl),
    loadBlueGlassWordmarkDataUrl(),
  ]);
  const total = toRwf(data.total);
  const remaining =
    typeof data.remaining === "number"
      ? toRwf(data.remaining)
      : Math.max(0, total - toRwf(data.paid ?? 0));
  let paid = toRwf(data.paid ?? Math.max(0, total - remaining));
  if (data.status === "paid" || remaining <= 0) paid = total;
  else if (
    (data.status === "unpaid" || data.status === "credit") &&
    paid <= 0
  ) {
    paid = 0;
  }
  const tax = toRwf(data.tax ?? 0);
  const lines = (data.lines || []).map((l) => ({
    description: l.name,
    qty: l.quantity,
    unit: toRwf(l.unitPrice),
  }));
  const note = [
    data.note ||
      `Thank you for choosing ${data.shopName || BRAND.name}.`,
    `Pay to shop: ${data.payPhone || data.shopPhone || "—"}.`,
  ];

  const pages = renderInvoiceSvgPages(
    {
      id: data.invoiceNumber,
      date: formatDocDate(data.createdAt, lang),
      due: data.dueDate
        ? formatDocDate(data.dueDate, lang)
        : formatDocDate(data.createdAt, lang),
      customer: data.customerName,
      email: data.customerEmail || data.customerPhone || undefined,
      phone: data.customerPhone || undefined,
      address:
        data.customerLocation ||
        data.shopLocation ||
        data.shopAddress ||
        "Kigali, Rwanda",
      currency: "RWF",
      discount: 0,
      taxRate: 0,
      taxAmount: tax,
      paid,
      items: lines.length
        ? lines
        : [{ description: "Balance", qty: 1, unit: total }],
      note,
      contacts: shopContacts(data),
    },
    icon,
    wordmark
  );

  return blueGlassSvgPagesToPdf(pages);
}

export type BlueGlassReceiptPdfInput = {
  shopName: string;
  shopPhone?: string | null;
  shopEmail?: string | null;
  shopLocation?: string | null;
  receiptNumber: string;
  invoiceNumber?: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string | null;
  customerLocation?: string | null;
  method: string;
  reference: string;
  currency?: string;
  previousBalance: number;
  payment: number;
  thankYouMessage?: string;
};

/** Payment receipt — blue-glass SVG design. */
export async function buildBlueGlassReceiptPdf(
  data: BlueGlassReceiptPdfInput
): Promise<jsPDF> {
  const lang = getAppLanguage();
  const [icon, wordmark] = await Promise.all([
    loadBlueGlassIconDataUrl(),
    loadBlueGlassWordmarkDataUrl(),
  ]);
  const pages = renderReceiptSvgPages(
    {
      shop: data.shopName || BRAND.name,
      customer: data.customerName,
      address:
        data.customerLocation ||
        data.shopLocation ||
        "Kigali, Rwanda",
      date: formatDocDate(data.createdAt, lang),
      id: data.receiptNumber,
      invoice: data.invoiceNumber || data.receiptNumber,
      method: data.method,
      ref: data.reference || data.receiptNumber,
      currency: data.currency || "RWF",
      previousBalance: toRwf(data.previousBalance),
      payment: toRwf(data.payment),
      contacts: [
        data.shopName || BRAND.name,
        data.shopLocation || "Kigali, Rwanda",
        data.shopPhone || "",
      ].filter(Boolean),
    },
    icon,
    wordmark
  );
  return blueGlassSvgPagesToPdf(pages);
}

/** All-debtors statement — blue-glass SVG design. */
export async function buildBlueGlassStatementPdf(opts: {
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
  language?: AppLanguage;
}): Promise<jsPDF> {
  const lang = opts.language || getAppLanguage();
  const [icon, wordmark] = await Promise.all([
    loadBlueGlassIconDataUrl(opts.shopLogoDataUrl),
    loadBlueGlassWordmarkDataUrl(),
  ]);
  const asOfIso = (opts.generatedAtIso || new Date().toISOString()).slice(0, 10);
  const dateLabel =
    opts.reportDate ||
    formatDocDate(opts.generatedAtIso || new Date().toISOString(), lang);
  const id = `ST-${asOfIso.replace(/-/g, "").slice(2)}`;

  const pages = renderStatementSvgPages(
    {
      shop: opts.shopName || BRAND.name,
      id,
      asOf: asOfIso,
      date: dateLabel,
      currency: "RWF",
      rows: opts.rows.map((r) => ({
        name: r.name,
        due: formatDueIso(r.dueDate || r.createdAt),
        original: toRwf(r.originalAmount),
        paid: toRwf(r.paidAmount),
      })),
      contacts: [
        opts.shopName || BRAND.name,
        opts.shopPayPhone || opts.shopPhone || "—",
        opts.shopLocation || opts.shopAddress || "Kigali, Rwanda",
      ],
    },
    icon,
    wordmark
  );
  return blueGlassSvgPagesToPdf(pages);
}
