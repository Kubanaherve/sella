import { sumRwf, toRwf } from "@/lib/money";
import type { InvoiceLine } from "@/lib/pdfTypes";
import { formatReportMoney } from "@/lib/listReportPdf";

export type DebtReportSource = {
  name: string;
  createdAt?: string | null;
  originalAmount: number;
  /** Used only when payment rows were not loaded. */
  paidAmount?: number;
  /** Amounts of payment records linked to this debt. */
  paymentAmounts?: number[] | null;
  lines?: InvoiceLine[];
};

export function debtReportFigures(row: DebtReportSource): {
  total: number;
  paid: number;
  remaining: number;
} {
  const total = Math.max(0, toRwf(row.originalAmount));
  const recorded =
    row.paymentAmounts == null ? null : sumRwf(row.paymentAmounts.map((amount) => toRwf(amount)));
  const derived = Math.max(0, toRwf(row.paidAmount ?? 0));
  const fromPayments =
    recorded == null || (recorded === 0 && derived > 0) ? null : Math.min(total, recorded);
  const paid =
    fromPayments == null
      ? Math.min(total, Math.max(0, toRwf(row.paidAmount ?? 0)))
      : fromPayments;
  return { total, paid, remaining: Math.max(0, total - paid) };
}

export function formatDebtItems(lines: InvoiceLine[] | undefined): string {
  const parts = (lines || [])
    .map((line) => {
      const name = (line.name || "").trim();
      if (!name) return "";
      const qty = Number(line.quantity);
      return Number.isFinite(qty) && qty > 0 ? `${name} × ${qty}` : name;
    })
    .filter(Boolean);
  return parts.join("\n") || "—";
}

export function formatDebtDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso).slice(0, 10);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function debtReportTableRows(rows: DebtReportSource[]): string[][] {
  return rows.map((row, index) => {
    const figures = debtReportFigures(row);
    return [
      String(index + 1),
      row.name || "—",
      formatDebtItems(row.lines),
      formatReportMoney(figures.total),
      formatDebtDate(row.createdAt),
      formatReportMoney(figures.paid),
      formatReportMoney(figures.remaining),
    ];
  });
}

export const DEBT_REPORT_COLUMNS = [
  { header: "No.", width: 14, align: "right" as const },
  { header: "Client Name", width: 48 },
  { header: "Items Taken", width: 0 },
  { header: "Total Amount", width: 30, align: "right" as const },
  { header: "Date Taken", width: 28 },
  { header: "Amount Paid", width: 28, align: "right" as const },
  { header: "Remaining Balance", width: 36, align: "right" as const },
];

export function debtReportColumns(format: "phone" | "desktop") {
  if (format === "desktop") return DEBT_REPORT_COLUMNS;
  return [
    { header: "No.", width: 11, align: "right" as const },
    { header: "Client Name", width: 38 },
    { header: "Items Taken", width: 0 },
    { header: "Total Amount", width: 24, align: "right" as const },
    { header: "Date Taken", width: 24 },
    { header: "Amount Paid", width: 22, align: "right" as const },
    { header: "Remaining Balance", width: 30, align: "right" as const },
  ];
}
