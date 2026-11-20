import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import iconUrl from "@/assets/brand/sella-pdf-icon.png";
import wordmarkUrl from "@/assets/brand/sella-pdf-wordmark.png";
import { BRAND } from "@/lib/brand";
import { toRwf } from "@/lib/money";

export type ListReportColumn = {
  header: string;
  width: number;
  align?: "left" | "right" | "center";
};

export type ListReportInput = {
  title: string;
  generatedAt?: Date;
  shopName: string;
  paymentNumber?: string | null;
  columns: ListReportColumn[];
  rows: string[][];
  /** Bold closing row, same column count as `columns`. */
  totals?: string[];
  /** Amount-paid column, drawn bold green. */
  paidColumn?: number;
  /** Unpaid balance column, drawn bold red. */
  unpaidColumn?: number;
  /** Item names, drawn in black. */
  itemColumn?: number;
  /** Portrait page for a phone, landscape page for a computer. */
  format?: "phone" | "desktop";
};

const INK: [number, number, number] = [23, 32, 51];
const BLUE: [number, number, number] = [15, 61, 158];
const MUTED: [number, number, number] = [92, 106, 130];
const HAIR: [number, number, number] = [220, 227, 238];
const RULE: [number, number, number] = [148, 162, 186];
const FRAME: [number, number, number] = [126, 142, 170];
const ITEM: [number, number, number] = [17, 19, 24];
const PAID: [number, number, number] = [14, 122, 67];
const UNPAID: [number, number, number] = [185, 32, 55];
const PAPER: [number, number, number] = [246, 248, 252];
const WORDMARK_RATIO = 996 / 388;

let brandMarks: Promise<{ icon: string; wordmark: string } | null> | null = null;

function bytesToDataUrl(bytes: Uint8Array): string {
  let binary = "";
  const step = 0x8000;
  for (let index = 0; index < bytes.length; index += step) {
    binary += String.fromCharCode(...bytes.subarray(index, index + step));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

async function readBrandFile(specifier: string, fileName: string): Promise<string> {
  const onNode = typeof process !== "undefined" && Boolean(process.versions?.node);
  if (onNode) {
    const fs = await import(/* @vite-ignore */ "node:fs");
    const path = await import(/* @vite-ignore */ "node:path");
    const fromSpecifier = path.resolve(process.cwd(), specifier.replace(/^\//, ""));
    const named = path.resolve(process.cwd(), "src/assets/brand", fileName);
    const file = fs.existsSync(fromSpecifier) ? fromSpecifier : named;
    return bytesToDataUrl(fs.readFileSync(file));
  }
  const response = await fetch(specifier);
  if (!response.ok) throw new Error(`Missing brand asset ${fileName}`);
  return bytesToDataUrl(new Uint8Array(await response.arrayBuffer()));
}

function loadBrandMarks(): Promise<{ icon: string; wordmark: string } | null> {
  if (!brandMarks) {
    brandMarks = Promise.all([
      readBrandFile(iconUrl, "sella-pdf-icon.png"),
      readBrandFile(wordmarkUrl, "sella-pdf-wordmark.png"),
    ])
      .then(([icon, wordmark]) => ({ icon, wordmark }))
      .catch(() => null);
  }
  return brandMarks;
}

function formatGenerated(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatReportMoney(value: number): string {
  return new Intl.NumberFormat("en-US").format(toRwf(value));
}

function fitLine(doc: jsPDF, value: string, maxWidth: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || doc.getTextWidth(text) <= maxWidth) return text;
  let kept = text;
  while (kept.length > 1 && doc.getTextWidth(`${kept}…`) > maxWidth) kept = kept.slice(0, -1);
  return `${kept.trimEnd()}…`;
}

/**
 * Landscape ledger in the Sella blue-glass system.
 * The logo lockup and title are drawn only on page 1.
 * Later pages repeat the column headings and keep the same small footer.
 */
export async function buildListReportPdf(input: ListReportInput): Promise<jsPDF> {
  const phone = input.format === "phone";
  const doc = new jsPDF({
    orientation: phone ? "portrait" : "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = phone ? 11 : 14;
  const right = phone ? 11 : 14;
  const iconSize = phone ? 11 : 12;
  const tableTop = phone ? 35 : 37;
  const bodySize = phone ? 8.6 : 8.2;
  const headSize = phone ? 7.1 : 7.3;
  const corner = 1.8;
  const shop = (input.shopName || "").trim();
  const pay = (input.paymentNumber || "").trim();
  const generated = formatGenerated(input.generatedAt || new Date());
  const marks = await loadBrandMarks();
  const contentWidth = pageWidth - left - right;

  const paintPage = (pageNumber: number) => {
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    if (pageNumber !== 1) return;

    if (marks?.icon) doc.addImage(marks.icon, "PNG", left, 6.4, iconSize, iconSize);
    if (marks?.wordmark) {
      const markHeight = phone ? 9.2 : 11.4;
      doc.addImage(
        marks.wordmark,
        "PNG",
        left + iconSize + 2.4,
        6.8,
        markHeight * WORDMARK_RATIO,
        markHeight
      );
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...BLUE);
      doc.text(BRAND.name, left + 16, 15);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(BRAND.tagline, left + iconSize + 2.6, phone ? 18.4 : 19.6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(phone ? 15 : 17);
    doc.setTextColor(...INK);
    doc.text(input.title, pageWidth - right, 12.2, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(generated, pageWidth - right, 17.4, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    const payLabel = pay ? `Pay  ${pay}` : "";
    const payWidth = payLabel ? doc.getTextWidth(payLabel) + 6 : 0;
    doc.text(fitLine(doc, shop, contentWidth - payWidth - 4), left, phone ? 26.2 : 27.2);
    if (payLabel) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(payLabel, pageWidth - right, phone ? 26.2 : 27.2, { align: "right" });
    }

    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.35);
    doc.setLineCap("round");
    doc.line(left, phone ? 29.6 : 30.6, pageWidth - right, phone ? 29.6 : 30.6);
  };

  const strokeFrame = (top: number, bottom: number) => {
    doc.setDrawColor(...FRAME);
    doc.setLineWidth(0.4);
    doc.setLineCap("round");
    doc.setLineJoin("round");
    doc.roundedRect(left, top, contentWidth, Math.max(corner * 2, bottom - top), corner, corner, "S");
  };

  const paintFooter = () => {
    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.25);
    doc.line(left, pageHeight - 12.4, pageWidth - right, pageHeight - 12.4);
    if (marks?.icon) doc.addImage(marks.icon, "PNG", left, pageHeight - 10.6, 5.2, 5.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("Generated by Sella", left + 6.4, pageHeight - 8.6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    const business = [shop, pay].filter(Boolean).join("   ·   ");
    if (business) {
      doc.text(fitLine(doc, business, contentWidth - 28), left + 6.4, pageHeight - 4.8);
    }
  };

  const marginTop = phone ? 10 : 12;
  const tableOptions = {
    head: [input.columns.map((column) => column.header)],
    body: input.rows,
    foot: input.totals ? [input.totals] : undefined,
    startY: tableTop,
    margin: { top: marginTop, right, bottom: 16, left },
    showHead: "everyPage" as const,
    showFoot: "lastPage" as const,
    rowPageBreak: "avoid" as const,
    theme: "plain" as const,
    styles: {
      font: "helvetica",
      fontSize: bodySize,
      cellPadding: { top: 1.7, right: 2, bottom: 1.7, left: 2 },
      textColor: [...INK] as [number, number, number],
      lineColor: [...HAIR] as [number, number, number],
      lineWidth: 0,
      overflow: "linebreak" as const,
      valign: "top" as const,
    },
    headStyles: {
      fillColor: [...BLUE] as [number, number, number],
      textColor: 255 as const,
      fontStyle: "bold" as const,
      fontSize: headSize,
      cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
    },
    footStyles: {
      fillColor: [238, 243, 251] as [number, number, number],
      textColor: [...INK] as [number, number, number],
      fontStyle: "normal" as const,
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [255, 255, 255] as [number, number, number] },
    columnStyles: Object.fromEntries(
      input.columns.map((column, index) => [
        index,
        {
          ...(column.width > 0 ? { cellWidth: column.width } : {}),
          halign: column.align || "left",
        },
      ])
    ),
  };
  const probe = new jsPDF({
    orientation: phone ? "portrait" : "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageBottoms = new Map<number, number>();
  autoTable(probe, {
    ...tableOptions,
    didDrawPage: (data) => {
      pageBottoms.set(data.pageNumber, data.cursor?.y ?? tableTop);
    },
  });

  const columnRules: number[] = [];

  autoTable(doc, {
    ...tableOptions,
    didParseCell: (data) => {
      if (data.section === "body") {
        data.cell.styles.fillColor = data.row.index % 2 === 0 ? [255, 255, 255] : [246, 248, 252];
      }
      if (data.section !== "body" && data.section !== "foot") return;
      if (input.paidColumn != null && data.column.index === input.paidColumn) {
        data.cell.styles.textColor = [...PAID];
        data.cell.styles.fontStyle = "bold";
      }
      if (input.unpaidColumn != null && data.column.index === input.unpaidColumn) {
        data.cell.styles.textColor = [...UNPAID];
        data.cell.styles.fontStyle = "bold";
      }
      if (
        input.itemColumn != null &&
        data.column.index === input.itemColumn &&
        data.section === "body"
      ) {
        data.cell.styles.textColor = [...ITEM];
        data.cell.styles.fontStyle = "normal";
      }
    },
    didDrawCell: (data) => {
      if (data.section === "head" && data.column.index > 0) columnRules.push(data.cell.x);
      if (data.section === "head") return;
      const bottom = data.cell.y + data.cell.height;
      doc.setDrawColor(...HAIR);
      doc.setLineWidth(0.22);
      doc.setLineCap("butt");
      doc.line(data.cell.x, bottom, data.cell.x + data.cell.width, bottom);
    },
    willDrawPage: (data) => {
      columnRules.length = 0;
      paintPage(data.pageNumber);
      const top = data.pageNumber === 1 ? tableTop : marginTop;
      const bottom = pageBottoms.get(data.pageNumber) ?? top + corner * 2;
      doc.saveGraphicsState();
      doc.roundedRect(left, top, contentWidth, Math.max(corner * 2, bottom - top), corner, corner, null);
      doc.clip();
      doc.discardPath();
    },
    didDrawPage: (data) => {
      doc.restoreGraphicsState();
      const top = data.pageNumber === 1 ? tableTop : marginTop;
      const bottom = pageBottoms.get(data.pageNumber) ?? top;
      strokeFrame(top, bottom);
      doc.setDrawColor(...FRAME);
      doc.setLineWidth(0.35);
      doc.setLineCap("butt");
      for (const x of columnRules) doc.line(x, top, x, bottom);
      paintFooter();
    },
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${page} of ${pages}`, pageWidth - right, pageHeight - 8.6, { align: "right" });
  }

  return doc;
}
