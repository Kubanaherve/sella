import type { AppLanguage } from "@/lib/appLanguage";

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
  /** Receipt extras when kind === "receipt" */
  paymentMethodLabel?: string;
  paymentReference?: string;
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
