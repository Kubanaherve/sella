import { calendarDateKeyInKigali, isWithinLastDaysKigali } from "@/lib/dates";
import { lineTotal, sumRwf, toRwf } from "@/lib/money";

export const DAILY_CUSTOMER_PAYMENTS_PREFIX = "daily_customer_payments_";
export const DAILY_NEW_DEBT_PREFIX = "daily_new_debt_";

/** Calendar day in Kigali. Date-only strings are kept as written. */
export const getDateKeyFromIso = (isoString: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) return isoString;
  return calendarDateKeyInKigali(isoString);
};

export const isDateInFilter = (
  dateKey: string,
  filter: "today" | "week" | "month" | "all",
  now = new Date()
) => {
  if (filter === "all") return true;
  if (!dateKey) return false;
  if (filter === "today") return dateKey === calendarDateKeyInKigali(now);
  if (filter === "week") {
    return isWithinLastDaysKigali(`${dateKey}T12:00:00+02:00`, 7, now);
  }
  if (filter === "month") {
    return dateKey.slice(0, 7) === calendarDateKeyInKigali(now).slice(0, 7);
  }
  return true;
};

export type VolumeSale = {
  sale_price: number;
  quantity: number;
  created_at: string;
};

export type VolumeDebt = {
  discount_amount?: number | null;
  total_amount?: number | null;
  remaining_balance?: number | null;
  status?: string | null;
  created_at: string;
};

/** Sale-line gross minus basket discounts recorded on debts for the same window. */
export function netSalesVolume(
  sales: VolumeSale[],
  debts: VolumeDebt[],
  include: (iso: string) => boolean = () => true
): number {
  const gross = sumRwf(
    sales.filter((s) => include(s.created_at)).map((s) => lineTotal(s.sale_price, s.quantity))
  );
  const discounts = sumRwf(
    debts
      .filter((d) => include(d.created_at))
      .map((d) => Math.max(0, toRwf(d.discount_amount || 0)))
  );
  return Math.max(0, gross - discounts);
}

export type LedgerDailyReport = {
  date: string;
  cashSales: number;
  debtsCollected: number;
  newDebtIssued: number;
  unpaidOutstanding: number;
  receivedTotal: number;
  accrualNewBusiness: number;
};

/**
 * Daily ledger in Africa/Kigali.
 * cashSales / accrualNewBusiness are the amount customers were charged (after discount).
 * receivedTotal is money actually collected.
 */
export function buildLedgerDailyReports(input: {
  sales: VolumeSale[];
  payments: Array<{ amount: number; created_at: string }>;
  debts: VolumeDebt[];
}): LedgerDailyReport[] {
  const map: Record<string, LedgerDailyReport> = {};
  const ensure = (date: string) => {
    if (!map[date]) {
      map[date] = {
        date,
        cashSales: 0,
        debtsCollected: 0,
        newDebtIssued: 0,
        unpaidOutstanding: 0,
        receivedTotal: 0,
        accrualNewBusiness: 0,
      };
    }
    return map[date];
  };

  for (const sale of input.sales) {
    const key = calendarDateKeyInKigali(sale.created_at);
    if (!key) continue;
    const amount = lineTotal(sale.sale_price, sale.quantity);
    const row = ensure(key);
    row.cashSales += amount;
    row.accrualNewBusiness += amount;
  }

  for (const debt of input.debts) {
    const key = calendarDateKeyInKigali(debt.created_at);
    if (!key) continue;
    const row = ensure(key);
    const discount = Math.max(0, toRwf(debt.discount_amount || 0));
    row.cashSales = Math.max(0, row.cashSales - discount);
    row.accrualNewBusiness = Math.max(0, row.accrualNewBusiness - discount);
    row.newDebtIssued += toRwf(debt.total_amount || 0);
    if (debt.status === "active") {
      row.unpaidOutstanding += toRwf(debt.remaining_balance || 0);
    }
  }

  for (const payment of input.payments) {
    const key = calendarDateKeyInKigali(payment.created_at);
    if (!key) continue;
    const row = ensure(key);
    const amt = toRwf(payment.amount);
    row.debtsCollected += amt;
    row.receivedTotal += amt;
  }

  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
}
