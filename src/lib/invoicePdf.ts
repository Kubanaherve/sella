import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/kinyarwanda";
import { toRwf } from "@/lib/money";
import { getAppLanguage, type AppLanguage } from "@/lib/appLanguage";
import { getPdfCopy } from "@/lib/pdfCopy";
import { BRAND } from "@/lib/brand";
import sellaIconUrl from "@/assets/brand/sella-icon.png";

export type InvoiceLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  takenAt?: string | null;
};

export type InvoicePaymentStatus = "paid" | "partial" | "credit" | "unpaid";

export type InvoiceData = {
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string | null;
  shopName: string;
  shopPhone: string;
  shopEmail?: string | null;
  shopLocation?: string | null;
  shopAddress?: string | null;
  /** Optional shop-uploaded logo (data URL). Falls back to Sella mark. */
  shopLogoDataUrl?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerLocation?: string | null;
  lines: InvoiceLine[];
  total: number;
  paid?: number;
  remaining?: number;
  tax?: number;
  /** MoMo / pay-to number — distinct from customer phone */
  payPhone: string;
  note?: string;
  status?: InvoicePaymentStatus;
  /** invoice | receipt — affects title */
  kind?: "invoice" | "receipt";
  language?: AppLanguage;
};

/** One debtor block for the all-debtors statement PDF. */
export type DebtorStatementRow = {
  name: string;
  phone?: string | null;
  createdAt?: string | null;
  dueDate?: string | null;
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status?: InvoicePaymentStatus;
  lines: InvoiceLine[];
};

function formatRwDate(iso: string, lang: AppLanguage): string {
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

function formatRwDateTime(iso: string, lang: AppLanguage): string {
  try {
    return new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "fr-RW", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function drawPageChrome(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  opts: {
    logo: string | null;
    shopName: string;
    copy: ReturnType<typeof getPdfCopy>;
    pageLabel: string;
  }
) {
  paintGlassBackground(doc, pageW, pageH);
  paintGlassCard(doc, 10, 10, pageW - 20, pageH - 20);
  const footerY = pageH - 18;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(22, footerY, pageW - 22, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(opts.copy.generatedBy, 22, footerY + 6);
  doc.text(opts.pageLabel, pageW / 2, footerY + 6, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 79, 217);
  doc.text(opts.shopName || BRAND.name, pageW - 22, footerY + 6, {
    align: "right",
  });
}

async function loadSellaLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(sellaIconUrl);
    const blob = await res.blob();
    const raw = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    // Ensure crisp PNG for jsPDF (works for jpg→canvas too).
    return await rasterizeLogoForPdf(raw);
  } catch {
    return null;
  }
}

/** Normalize brand mark to a square PNG data URL for reliable PDF embeds. */
async function rasterizeLogoForPdf(src: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = src;
  });
}

function resolveStatus(data: InvoiceData): InvoicePaymentStatus {
  if (data.status) return data.status;
  const remaining =
    typeof data.remaining === "number"
      ? toRwf(data.remaining)
      : Math.max(0, toRwf(data.total) - toRwf(data.paid ?? 0));
  const paid = toRwf(data.paid ?? 0);
  if (remaining <= 0) return "paid";
  if (paid > 0) return "partial";
  return "credit";
}

function statusLabel(
  status: InvoicePaymentStatus,
  copy: ReturnType<typeof getPdfCopy>
): string {
  switch (status) {
    case "paid":
      return copy.statusPaid;
    case "partial":
      return copy.statusPartial;
    case "credit":
      return copy.statusCredit;
    default:
      return copy.statusUnpaid;
  }
}

function statusRgb(status: InvoicePaymentStatus): [number, number, number] {
  switch (status) {
    case "paid":
      return [34, 197, 94];
    case "partial":
      return [245, 158, 11];
    case "credit":
      return [26, 111, 255];
    default:
      return [185, 28, 28];
  }
}

/** Soft gradient mesh approximating the reference glass background. */
function paintGlassBackground(doc: jsPDF, pageW: number, pageH: number) {
  doc.setFillColor(232, 242, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFillColor(147, 197, 253);
  doc.ellipse(pageW * 0.15, pageH * 0.08, 70, 45, "F");

  doc.setFillColor(167, 139, 250);
  doc.ellipse(pageW * 0.92, pageH * 0.18, 55, 50, "F");

  doc.setFillColor(56, 189, 248);
  doc.ellipse(pageW * 0.75, pageH * 0.92, 80, 55, "F");

  doc.setFillColor(96, 165, 250);
  doc.ellipse(pageW * 0.05, pageH * 0.75, 50, 40, "F");

  doc.setFillColor(196, 181, 253);
  doc.ellipse(pageW * 0.5, pageH * 0.45, 40, 30, "F");
}

function paintGlassCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Soft shadow
  doc.setFillColor(148, 163, 184);
  doc.roundedRect(x + 1.2, y + 1.6, w, h, 6, 6, "F");
  // Frosted white panel
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 6, 6, "F");
  // Subtle blue glass tint overlay (second lighter pass via border)
  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 6, 6, "S");
}

function drawStatusPill(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  rgb: [number, number, number]
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const tw = doc.getTextWidth(label);
  const padX = 4;
  const w = tw + padX * 2 + 6;
  const h = 8;
  doc.setFillColor(...rgb);
  doc.roundedRect(x - w, y, w, h, 4, 4, "F");
  // check mark
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.line(x - w + 3.2, y + 4.2, x - w + 4.5, y + 5.5);
  doc.line(x - w + 4.5, y + 5.5, x - w + 7, y + 2.8);
  doc.setTextColor(255, 255, 255);
  doc.text(label, x - padX, y + 5.4, { align: "right" });
}

/** Build glass-style invoice / receipt PDF matching the Sella design reference. */
export async function buildInvoicePdf(data: InvoiceData): Promise<jsPDF> {
  const lang = data.language || getAppLanguage();
  const copy = getPdfCopy(lang);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const logo = await loadSellaLogoDataUrl();
  const status = resolveStatus(data);
  const title = data.kind === "receipt" ? copy.receipt : copy.invoice;

  paintGlassBackground(doc, pageW, pageH);

  const cardX = 10;
  const cardY = 10;
  const cardW = pageW - 20;
  const cardH = pageH - 20;
  paintGlassCard(doc, cardX, cardY, cardW, cardH);

  const left = cardX + 12;
  const right = cardX + cardW - 12;
  let y = cardY + 14;

  // ── Brand + shop ──────────────────────────────────────────────────────────
  if (logo) {
    try {
      doc.addImage(logo, "PNG", left, y - 5, 16, 16);
    } catch {
      /* ignore */
    }
  }
  const brandX = logo ? left + 19 : left;
  doc.setTextColor(11, 79, 217);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.shopName || BRAND.name, brandX, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 140, 200);
  doc.text(copy.tagline, brandX, y + 9);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${BRAND.name} · ${title}`, brandX, y + 13.5);

  // Meta top-right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const meta = [
    `${copy.invoiceNo}: ${data.invoiceNumber}`,
    `${copy.date}: ${formatRwDate(data.createdAt, lang)}`,
  ];
  if (data.dueDate) {
    meta.push(`${copy.due}: ${formatRwDate(data.dueDate, lang)}`);
  }
  meta.forEach((line, i) => {
    doc.text(line, right, y + 2 + i * 5, { align: "right" });
  });

  y += 24;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(left, y, right, y);
  y += 10;

  // ── Bill to + status ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(96, 165, 250);
  doc.text(copy.billTo, left, y);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text(data.customerName || "—", left, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const billExtra = [
    data.customerEmail,
    data.customerPhone,
    data.customerLocation || "Kigali, Rwanda",
  ].filter(Boolean) as string[];
  billExtra.forEach((line, i) => doc.text(line, left, y + 13 + i * 4.5));

  drawStatusPill(doc, right, y - 1, statusLabel(status, copy), statusRgb(status));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(96, 165, 250);
  doc.text(copy.from, right, y + 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const fromLines = [
    data.shopName,
    data.shopPhone || data.payPhone,
    data.shopEmail || "",
  ].filter(Boolean);
  fromLines.forEach((line, i) =>
    doc.text(line, right, y + 17 + i * 4.5, { align: "right" })
  );

  y += 13 + Math.max(billExtra.length, fromLines.length) * 4.5 + 10;

  // ── Line items table ──────────────────────────────────────────────────────
  const body = data.lines.map((l) => {
    const unit = toRwf(l.unitPrice);
    const lineTotal = unit * l.quantity;
    return [
      l.name +
        (l.takenAt ? `\n(${formatRwDate(l.takenAt, lang)})` : ""),
      String(l.quantity),
      formatCurrency(unit),
      formatCurrency(lineTotal),
    ];
  });
  if (!body.length) {
    body.push(["—", "0", formatCurrency(0), formatCurrency(0)]);
  }

  autoTable(doc, {
    startY: y,
    head: [[copy.description, copy.qty, copy.unitPrice, copy.amount]],
    body,
    margin: { left, right: pageW - right },
    styles: {
      fontSize: 9,
      cellPadding: { top: 3.5, bottom: 3.5, left: 2, right: 2 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: "middle",
      fillColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [11, 79, 217],
      fontStyle: "bold",
      lineWidth: 0.35,
      lineColor: [191, 219, 254],
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 78 },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 38, halign: "right" },
      3: { cellWidth: 38, halign: "right" },
    },
  });

  const finalY =
    ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY as number) || y + 40;
  y = finalY + 10;

  // ── Totals (right glass pill for Total) ───────────────────────────────────
  const subTotal = data.lines.reduce(
    (s, l) => s + toRwf(l.unitPrice) * l.quantity,
    0
  );
  const taxAmt = toRwf(data.tax ?? 0);
  const paidAmt = toRwf(data.paid ?? 0);
  const remainAmt =
    typeof data.remaining === "number"
      ? toRwf(data.remaining)
      : Math.max(0, toRwf(data.total || subTotal) - paidAmt);
  const displayTotal = toRwf(data.total || subTotal);

  const totalsX = right - 70;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(copy.subtotal, totalsX, y);
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(displayTotal), right, y, { align: "right" });
  y += 6;
  doc.setTextColor(100, 116, 139);
  doc.text(copy.tax, totalsX, y);
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(taxAmt), right, y, { align: "right" });
  y += 8;

  // Glass total pill
  const pillW = 70;
  const pillH = 12;
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(right - pillW, y - 4, pillW, pillH, 3.5, 3.5, "F");
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.3);
  doc.roundedRect(right - pillW, y - 4, pillW, pillH, 3.5, 3.5, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(11, 79, 217);
  doc.text(copy.total, right - pillW + 4, y + 3.5);
  doc.text(formatCurrency(displayTotal), right - 3, y + 3.5, { align: "right" });
  y += 16;

  if (paidAmt > 0 || remainAmt > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    if (paidAmt > 0) {
      doc.setTextColor(22, 163, 74);
      doc.text(`${copy.paid}: ${formatCurrency(paidAmt)}`, right, y, {
        align: "right",
      });
      y += 5;
    }
    if (remainAmt > 0) {
      doc.setTextColor(185, 28, 28);
      doc.setFont("helvetica", "bold");
      doc.text(`${copy.remaining}: ${formatCurrency(remainAmt)}`, right, y, {
        align: "right",
      });
      y += 6;
    }
  }

  // ── Note + pay info ──────────────────────────────────────────────────────
  const noteY = Math.max(y, cardY + cardH - 62);
  y = noteY;

  doc.setFillColor(26, 111, 255);
  doc.circle(left + 2.5, y + 1, 2.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("i", left + 2.5, y + 2.2, { align: "center" });

  doc.setTextColor(11, 79, 217);
  doc.setFontSize(9);
  doc.text(copy.note, left + 8, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const noteText =
    data.note ||
    `${copy.defaultNote(data.shopName)} ${copy.shopPayNumber}: ${data.payPhone}`;
  const noteLines = doc.splitTextToSize(noteText, cardW - 28);
  doc.text(noteLines, left + 8, y + 7);

  // Footer bar
  const footerY = cardY + cardH - 18;

  // Distinct shop payment strip (never confused with customer phone)
  const payStripY = y + 7 + noteLines.length * 3.8 + 2;
  if (payStripY < footerY - 8) {
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(left, payStripY, right - left, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(11, 79, 217);
    doc.text(
      `${copy.shopPayNumber}: ${data.payPhone}`,
      left + 3,
      payStripY + 5.2
    );
  }
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(left, footerY, right, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const contacts = [
    data.shopEmail || "support@sella.app",
    data.shopPhone || data.payPhone || "—",
    data.shopLocation || "Kigali, Rwanda",
  ];
  doc.text(contacts.join("   ·   "), left, footerY + 7);

  if (logo) {
    try {
      doc.addImage(logo, "PNG", right - 20, footerY + 1.5, 8, 8);
    } catch {
      /* ignore */
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(11, 79, 217);
  doc.text(BRAND.name, right - 9, footerY + 7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(copy.generatedBy, right - 9, footerY + 11, { align: "right" });

  return doc;
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

/**
 * Professional multi-page debtors statement.
 * Design system: same glass Sella chrome as invoices (reference mockup was
 * supplied in chat; no separate design file exists in the repo).
 */
export async function buildDebtReportPdf(opts: {
  shopName: string;
  shopPhone?: string;
  shopEmail?: string | null;
  shopAddress?: string | null;
  shopLocation?: string | null;
  /** MoMo / Airtel pay-to — shown separately from customer phones */
  shopPayPhone?: string | null;
  shopLogoDataUrl?: string | null;
  rows: DebtorStatementRow[];
  grandTotal: number;
  reportDate?: string;
  generatedAtIso?: string;
  language?: AppLanguage;
}): Promise<jsPDF> {
  const lang = opts.language || getAppLanguage();
  const copy = getPdfCopy(lang);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const brandLogo = opts.shopLogoDataUrl || (await loadSellaLogoDataUrl());
  const left = 22;
  const right = pageW - 22;
  const contentBottom = pageH - 26;
  const payPhone = opts.shopPayPhone || opts.shopPhone || "—";
  const generatedIso = opts.generatedAtIso || new Date().toISOString();
  const generatedLabel = formatRwDateTime(generatedIso, lang);
  const reportDate =
    opts.reportDate ||
    new Date().toLocaleDateString(lang === "en" ? "en-GB" : "fr-RW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const stampPages = () => {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      const footerY = pageH - 18;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(left, footerY, right, footerY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(copy.generatedBy, left, footerY + 6);
      doc.text(
        `${copy.page} ${i} ${copy.of} ${total}`,
        pageW / 2,
        footerY + 6,
        { align: "center" }
      );
      doc.setFont("helvetica", "bold");
      doc.setTextColor(11, 79, 217);
      doc.text(opts.shopName || BRAND.name, right, footerY + 6, {
        align: "right",
      });
    }
  };

  const ensureSpace = (needed: number, y: number): number => {
    if (y + needed <= contentBottom) return y;
    doc.addPage();
    drawPageChrome(doc, pageW, pageH, {
      logo: brandLogo,
      shopName: opts.shopName || BRAND.name,
      copy,
      pageLabel: "",
    });
    // Mini continuing header
    let hy = 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(11, 79, 217);
    doc.text(opts.shopName || BRAND.name, left, hy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 140, 200);
    doc.text(copy.debtorsStatement, left, hy + 5);
    return hy + 12;
  };

  // ── Cover header page chrome ─────────────────────────────────────────────
  drawPageChrome(doc, pageW, pageH, {
    logo: brandLogo,
    shopName: opts.shopName || BRAND.name,
    copy,
    pageLabel: "",
  });

  let y = 24;
  if (brandLogo) {
    try {
      doc.addImage(brandLogo, "PNG", left, y - 5, 16, 16);
    } catch {
      /* ignore */
    }
  }
  const brandX = brandLogo ? left + 19 : left;
  doc.setTextColor(11, 79, 217);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(opts.shopName || BRAND.name, brandX, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 140, 200);
  doc.text(copy.tagline, brandX, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(copy.debtorsStatement, right, y + 2, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${copy.generatedAt}: ${generatedLabel}`, right, y + 8, {
    align: "right",
  });
  doc.text(`${copy.reportDate}: ${reportDate}`, right, y + 13, {
    align: "right",
  });

  y += 22;
  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(0.4);
  doc.line(left, y, right, y);
  y += 8;

  // Shop identity block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(11, 79, 217);
  doc.text(copy.from, left, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const shopLines = [
    opts.shopName || BRAND.name,
    opts.shopPhone ? `${copy.phone}: ${opts.shopPhone}` : null,
    opts.shopEmail ? `${copy.email}: ${opts.shopEmail}` : null,
    opts.shopAddress || opts.shopLocation
      ? `${copy.address}: ${opts.shopAddress || opts.shopLocation}`
      : null,
  ].filter(Boolean) as string[];
  for (const line of shopLines) {
    doc.text(line, left, y);
    y += 4.5;
  }

  // Pay number — visually distinct from customer phones
  y += 2;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(left, y - 3.5, right - left, 11, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(11, 79, 217);
  doc.text(`${copy.shopPayNumber}: ${payPhone}`, left + 3, y + 3);

  y += 14;
  // Snapshot cards
  const totalPaid = opts.rows.reduce((s, r) => s + toRwf(r.paidAmount), 0);
  const totalOriginal = opts.rows.reduce(
    (s, r) => s + toRwf(r.originalAmount),
    0
  );
  const avg =
    opts.rows.length > 0 ? toRwf(opts.grandTotal) / opts.rows.length : 0;

  const cardW = (right - left - 6) / 3;
  const metrics: Array<{ label: string; value: string; color: [number, number, number] }> = [
    {
      label: copy.debtorCount,
      value: String(opts.rows.length),
      color: [11, 79, 217],
    },
    {
      label: copy.totalDebt,
      value: formatCurrency(opts.grandTotal),
      color: [185, 28, 28],
    },
    {
      label: copy.averageBalance,
      value: formatCurrency(avg),
      color: [15, 23, 42],
    },
  ];
  metrics.forEach((m, i) => {
    const cx = left + i * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, y, cardW, 16, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cx + 3, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...m.color);
    doc.text(m.value, cx + 3, y + 12);
  });
  y += 22;

  if (!opts.rows.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(copy.emptyDebts, left, y + 8);
    stampPages();
    return doc;
  }

  // ── Per-debtor sections (keep each debtor together when possible) ────────
  for (let idx = 0; idx < opts.rows.length; idx++) {
    const row = opts.rows[idx];
    const status = row.status
      ? row.status
      : toRwf(row.remainingAmount) <= 0
        ? "paid"
        : toRwf(row.paidAmount) > 0
          ? "partial"
          : "credit";
    const lines =
      row.lines?.length > 0
        ? row.lines
        : [
            {
              name: "—",
              quantity: 1,
              unitPrice: row.remainingAmount,
              takenAt: row.createdAt,
            },
          ];

    // Estimate block height: header ~22 + table rows ~7 each + totals ~14
    const estimated = 28 + lines.length * 7 + 16;
    y = ensureSpace(Math.min(estimated, 60), y);

    // Debtor header bar
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(left, y, right - left, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${row.name || "—"}`, left + 3, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const meta = [
      row.phone ? `${copy.customerPhone}: ${row.phone}` : null,
      row.createdAt
        ? `${copy.takenAt}: ${formatRwDateTime(row.createdAt, lang)}`
        : null,
      row.dueDate ? `${copy.due}: ${formatRwDate(row.dueDate, lang)}` : null,
    ]
      .filter(Boolean)
      .join("  ·  ");
    if (meta) doc.text(meta, left + 3, y + 11);

    drawStatusPill(doc, right - 2, y + 3, statusLabel(status, copy), statusRgb(status));
    y += 17;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(11, 79, 217);
    doc.text(copy.productsOnCredit, left, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [
        [
          copy.description,
          copy.qty,
          copy.unitPrice,
          copy.amount,
          copy.takenAt,
        ],
      ],
      body: lines.map((l) => [
        l.name,
        String(l.quantity),
        formatCurrency(l.unitPrice),
        formatCurrency(toRwf(l.unitPrice) * Number(l.quantity || 0)),
        l.takenAt ? formatRwDateTime(l.takenAt, lang) : "—",
      ]),
      margin: { left, right: pageW - right, bottom: 28 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [11, 79, 217],
        fontStyle: "bold",
        lineColor: [191, 219, 254],
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 14, halign: "center" },
        2: { cellWidth: 28, halign: "right" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 36 },
      },
      didDrawPage: () => {
        // Re-paint chrome if autoTable spilled onto a new page mid-table
        const pageCount = doc.getNumberOfPages();
        if (pageCount > 1) {
          /* footers stamped at end */
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = ((doc as any).lastAutoTable?.finalY as number) || y + 20;
    y += 3;
    y = ensureSpace(18, y);

    // Debtor financial strip
    const stripItems = [
      [copy.originalAmount, formatCurrency(row.originalAmount)],
      [copy.paymentsMade, formatCurrency(row.paidAmount)],
      [copy.balanceDue, formatCurrency(row.remainingAmount)],
    ];
    stripItems.forEach(([label, value], i) => {
      const sx = left + i * ((right - left) / 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(label, sx, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(i === 2 ? 185 : 15, i === 2 ? 28 : 23, i === 2 ? 28 : 42);
      doc.text(value, sx, y + 5);
    });
    y += 12;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(left, y, right, y);
    y += 6;
  }

  // ── Financial summary ────────────────────────────────────────────────────
  y = ensureSpace(42, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(11, 79, 217);
  doc.text(copy.financialSummary, left, y);
  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(left, y, right - left, 28, 3, 3, "F");
  const summaryRows = [
    [copy.debtorCount, String(opts.rows.length)],
    [copy.originalAmount, formatCurrency(totalOriginal)],
    [copy.paymentsMade, formatCurrency(totalPaid)],
    [copy.totalDebt, formatCurrency(opts.grandTotal)],
  ];
  summaryRows.forEach(([label, value], i) => {
    const rowY = y + 6 + i * 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(label, left + 4, rowY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(i === 3 ? 185 : 15, i === 3 ? 28 : 23, i === 3 ? 28 : 42);
    doc.text(value, right - 4, rowY, { align: "right" });
  });

  y += 34;
  y = ensureSpace(16, y);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(left, y, right - left, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(11, 79, 217);
  doc.text(`${copy.shopPayNumber}: ${payPhone}`, left + 3, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(copy.thankYou(opts.shopName || BRAND.name), left + 3, y + 9.5);

  stampPages();
  return doc;
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
