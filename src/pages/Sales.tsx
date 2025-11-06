import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/kinyarwanda";
import { getDateKeyFromIso, isDateInFilter } from "@/lib/reporting";
import { getDailyReports, listRecentSales, resetSalesMoney, setAppSetting } from "@/db/api";
import type { SalePaymentStatus } from "@/db/types";
import { useAuth } from "@/contexts/AuthContext";
import { WriteGate } from "@/components/WriteGate";
import { Calendar, Download, TrendingUp, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ListPageSkeleton } from "@/components/ListPageSkeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FilterOption = "today" | "week" | "month" | "all";

interface DailyReport {
  date: string;
  debtsPaid: number;
  salesTotal: number;
  unpaidDebt: number;
  receivedTotal: number;
  expectedTotal: number;
}

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "today", label: "Uyu munsi" },
  { value: "week", label: "Icyumweru" },
  { value: "month", label: "Ukwezi" },
  { value: "all", label: "Byose" },
];

const WEEKDAY_LABELS = [
  "Ku Cyumweru",
  "Kuwa Mbere",
  "Kuwa Kabiri",
  "Kuwa Gatatu",
  "Kuwa Kane",
  "Kuwa Gatanu",
  "Kuwa Gatandatu",
];

const MONTH_LABELS = [
  "Mutarama",
  "Gashyantare",
  "Werurwe",
  "Mata",
  "Gicurasi",
  "Kamena",
  "Nyakanga",
  "Kanama",
  "Nzeri",
  "Ukwakira",
  "Ugushyingo",
  "Ukuboza",
];

const ReportsPage = () => {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    receivedTotal: 0,
    unpaidDebt: 0,
    expectedTotal: 0,
  });
  const [filter, setFilter] = useState<FilterOption>("all");
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [recentSales, setRecentSales] = useState<
    Array<{
      id: string;
      item_name: string;
      quantity: number;
      sale_price: number;
      payment_status: SalePaymentStatus;
      payment_method: string | null;
      client_name: string | null;
      created_at: string;
    }>
  >([]);

  const fetchReports = useCallback(async () => {
    setLoading(true);

    try {
      const [daily, recent] = await Promise.all([
        getDailyReports(),
        listRecentSales(30),
      ]);
      const now = new Date();

      const result = daily
        .filter((entry) => isDateInFilter(entry.date, filter, now))
        .map<DailyReport>((entry) => ({
          date: entry.date,
          debtsPaid: entry.debtsCollected,
          salesTotal: entry.cashSales,
          unpaidDebt: entry.unpaidOutstanding,
          receivedTotal: entry.receivedTotal,
          expectedTotal: entry.accrualNewBusiness,
        }));

      setReports(result);
      setRecentSales(recent);
      setSummary({
        receivedTotal: result.reduce(
          (sum, report) => sum + report.receivedTotal,
          0
        ),
        unpaidDebt: result.reduce(
          (sum, report) => sum + report.unpaidDebt,
          0
        ),
        expectedTotal: result.reduce(
          (sum, report) => sum + report.expectedTotal,
          0
        ),
      });
    } catch (error) {
      console.error("Fetch reports error:", error);
      toast.error("Habaye ikosa mu gufata raporo");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const statusBadge = (status: SalePaymentStatus) => {
    if (status === "paid") return "bg-emerald-100 text-emerald-800";
    if (status === "partial") return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-800";
  };

  const statusLabel = (status: SalePaymentStatus) => {
    if (status === "paid") return "Byishyuwe";
    if (status === "partial") return "Igice";
    return "Ideni";
  };

  const methodLabel = (method: string | null | undefined) => {
    if (!method) return "";
    const map: Record<string, string> = {
      momo: "MoMo",
      cash: "Cash",
      airtel: "Airtel",
      bank: "Banki",
    };
    return map[method] || method;
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const refreshReports = () => {
      fetchReports();
    };

    window.addEventListener("paymentMade", refreshReports);
    window.addEventListener("newDebtAdded", refreshReports);
    window.addEventListener("focus", refreshReports);
    document.addEventListener("visibilitychange", refreshReports);

    return () => {
      window.removeEventListener("paymentMade", refreshReports);
      window.removeEventListener("newDebtAdded", refreshReports);
      window.removeEventListener("focus", refreshReports);
      document.removeEventListener("visibilitychange", refreshReports);
    };
  }, [fetchReports]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return `${WEEKDAY_LABELS[date.getDay()]}, ${date.getDate()} ${
      MONTH_LABELS[date.getMonth()]
    } ${date.getFullYear()}`;
  };

  const downloadCSV = () => {
    const header =
      "Itariki,Amafaranga y'Ubucuruzi,Amafaranga y'Ideni Ryishyuwe,Ideni Ritarishyurwa,Igiteranyo Cyinjiye,Igiteranyo Gitegerejwe\n";
    const rows = reports
      .map(
        (report) =>
          `${report.date},${report.salesTotal},${report.debtsPaid},${report.unpaidDebt},${report.receivedTotal},${report.expectedTotal}`
      )
      .join("\n");

    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `raporo-${getDateKeyFromIso(new Date().toISOString())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Raporo yamanitswe ✨");
  };

  const isToday = (dateStr: string) =>
    dateStr === getDateKeyFromIso(new Date().toISOString());

  const handleClearSalesReportHistory = async () => {
    if (!canWrite) {
      toast.error("Subscription yarangiye — jya kuri Billing wishyure to clear history");
      return;
    }
    setIsClearingHistory(true);
    try {
      await resetSalesMoney();
      await setAppSetting("total_paid", "0");

      setShowClearHistoryModal(false);
      toast.success("Sales report history yasibwe, watangiye bushya ✨");
      fetchReports();
      window.dispatchEvent(new CustomEvent("paymentMade"));
    } catch (error) {
      console.error("Clear report history error:", error);
      toast.error("Habaye ikosa mu gusiba report history");
    } finally {
      setIsClearingHistory(false);
    }
  };

  const filterTitle = {
    today: "Raporo y'uyu munsi",
    week: "Raporo y'iki cyumweru",
    month: "Raporo y'uku kwezi",
    all: "Raporo rusange",
  }[filter];

  return (
    <div className="sella-page">
      <PageHeader
        title="Raporo y'Amafaranga"
        hideBack
        right={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowClearHistoryModal(true)}
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              <Trash2 size={13} />
            </Button>
            <Button
              onClick={downloadCSV}
              size="sm"
              className="h-8 px-3 text-xs gap-1 btn-navy"
            >
              <Download size={14} />
              CSV
            </Button>
          </div>
        }
      />

      <main className="sella-page-body space-y-4">
        {!canWrite && <WriteGate actionLabel="Gusiba amateka y'amafaranga" />}
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{filterTitle}</h2>
          <p className="text-xs text-muted-foreground">
            Reba amafaranga y'ubucuruzi, ideni ryishyuwe, n'ayo ugitegereje kwakira.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filter === option.value ? "default" : "outline"}
              onClick={() => setFilter(option.value)}
              className="text-xs whitespace-nowrap"
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-[#0b4fd9] to-[#1a6fff] p-4 shadow-md text-white">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-white/80" />
            <span className="text-xs text-white/75 font-semibold">
              Igiteranyo Gitegerejwe
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight">
            {formatCurrency(summary.expectedTotal)}
          </p>
          <p className="text-[10px] text-white/60 mt-1">
            {reports.length} iminsi yanditswe
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="sella-stat p-3">
            <p className="sella-stat-label">Yinjiye</p>
            <p className="text-sm font-extrabold text-emerald-700 tabular-nums mt-1">
              {formatCurrency(summary.receivedTotal)}
            </p>
          </div>

          <div className="sella-stat p-3">
            <p className="sella-stat-label">Asigaye</p>
            <p className="text-sm font-extrabold text-rose-700 tabular-nums mt-1">
              {formatCurrency(summary.unpaidDebt)}
            </p>
          </div>

          <div className="sella-stat p-3">
            <p className="sella-stat-label">Byose</p>
            <p className="text-sm font-extrabold text-primary tabular-nums mt-1">
              {formatCurrency(summary.expectedTotal)}
            </p>
          </div>
        </div>

        {loading ? (
          <ListPageSkeleton rows={4} />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="Nta makuru ahari"
            description="Igurisha cyangwa kwishyura ideni bizagaragara hano."
            actionLabel="New sale"
            onAction={() => navigate("/new-sale")}
          />
        ) : (
          <div className="space-y-3">
            {recentSales.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-600">Igurisha rya vuba</h3>
                {recentSales.slice(0, 12).map((sale) => (
                  <div
                    key={sale.id}
                    className="sella-list-card p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sale.item_name} ×{sale.quantity}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {sale.client_name || "Walk-in"} ·{" "}
                        {new Date(sale.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {formatCurrency(sale.sale_price * sale.quantity)}
                      </p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusBadge(
                          sale.payment_status || "paid"
                        )}`}
                      >
                        {statusLabel(sale.payment_status || "paid")}
                        {sale.payment_method
                          ? ` · ${methodLabel(sale.payment_method)}`
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {reports.map((report) => (
              <div
                key={report.date}
                className={`bg-white rounded-2xl border p-4 space-y-3 shadow-sm ${
                  isToday(report.date) ? "border-green-400/60" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span className="text-xs font-semibold">
                      {formatDateLabel(report.date)}
                      {isToday(report.date) && (
                        <span className="ml-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                          Uyu munsi
                        </span>
                      )}
                    </span>
                  </div>

                  <span className="text-sm font-bold text-blue-700">
                    {formatCurrency(report.expectedTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-[10px] text-green-500">Amafaranga yinjijwe</p>
                    <p className="text-sm font-bold text-green-700">
                      {formatCurrency(report.receivedTotal)}
                    </p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-[10px] text-red-500">Ideni ritarishyurwa</p>
                    <p className="text-sm font-bold text-red-700">
                      {formatCurrency(report.unpaidDebt)}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-[10px] text-blue-500">Igiteranyo cyose</p>
                    <p className="text-sm font-bold text-blue-700">
                      {formatCurrency(report.expectedTotal)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                  <div>Ubucuruzi: {formatCurrency(report.salesTotal)}</div>
                  <div>Ideni ryishyuwe: {formatCurrency(report.debtsPaid)}</div>
                  <div>Ideni ryo kuri uwo munsi: {formatCurrency(report.unpaidDebt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showClearHistoryModal} onOpenChange={setShowClearHistoryModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base">Siba sales report history</DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-muted-foreground">
            Ibi bizasiba amateka ya sales/report (sales + daily report keys) kugirango utangire bushya.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleClearSalesReportHistory}
              disabled={isClearingHistory}
              variant="destructive"
              className="flex-1"
            >
              {isClearingHistory ? "Processing..." : "Yes, clear history"}
            </Button>
            <Button
              onClick={() => setShowClearHistoryModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;
