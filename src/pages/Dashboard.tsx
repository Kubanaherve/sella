import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { labels, formatCurrency } from "@/lib/kinyarwanda";
import {
  buildDebtAlerts,
  notifyDebtAlerts,
  notifyIfInactiveForTenHours,
  recordAppActivity,
} from "@/lib/debtAlerts";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats, listActiveDebts } from "@/db/api";
import {
  Plus,
  List,
  TrendingUp,
  Package,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";
import { accessLabel } from "@/lib/entitlements";
import { WriteGate } from "@/components/WriteGate";
import { hapticLight } from "@/lib/haptics";
import { ListPageSkeleton } from "@/components/ListPageSkeleton";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalUnpaid: number;
  totalCustomers: number;
  totalSales: number;
  moneyCollected: number;
  salesVolume: number;
  todaySales: number;
  todayCollected: number;
  todaySalesVolume: number;
  todayDebt: number;
  weekCollected: number;
  weekSalesVolume: number;
  weekDebt: number;
  targetMoney: number;
}

type Period = "today" | "week";

const loadCachedStats = (): DashboardStats | null => {
  const cached = localStorage.getItem("dashboard_stats_cache");
  if (!cached) return null;
  try {
    return JSON.parse(cached) as DashboardStats;
  } catch {
    return null;
  }
};

function greetingForHour(hour: number): string {
  if (hour < 12) return labels.goodMorning;
  if (hour < 17) return labels.goodAfternoon;
  return labels.goodEvening;
}

function formatMoneyParts(amount: number): { main: string; suffix: string } {
  const main = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
  return { main, suffix: "FRW" };
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    profile,
    isAuthenticated,
    isLoading: authLoading,
    subscription,
    canWrite,
    mode,
  } = useAuth();

  const displayName =
    (profile && "display_name" in profile && profile.display_name) ||
    (profile && "owner_name" in profile && profile.owner_name) ||
    "User";
  const shopCode =
    profile && "shop_code" in profile && profile.shop_code
      ? String(profile.shop_code)
      : null;
  const shopName =
    profile && "business_name" in profile && profile.business_name
      ? String(profile.business_name)
      : null;

  const cached = loadCachedStats();
  const [stats, setStats] = useState<DashboardStats>(
    cached || {
      totalUnpaid: 0,
      totalCustomers: 0,
      totalSales: 0,
      moneyCollected: 0,
      salesVolume: 0,
      todaySales: 0,
      todayCollected: 0,
      todaySalesVolume: 0,
      todayDebt: 0,
      weekCollected: 0,
      weekSalesVolume: 0,
      weekDebt: 0,
      targetMoney: 0,
    }
  );
  const [loading, setLoading] = useState(!cached);
  const [period, setPeriod] = useState<Period>("today");

  const fetchStats = useCallback(async () => {
    try {
      const newStats = await getDashboardStats();
      const next: DashboardStats = {
        totalUnpaid: newStats.totalUnpaid,
        totalCustomers: newStats.totalCustomers,
        totalSales: newStats.totalSales,
        moneyCollected: newStats.moneyCollected ?? newStats.totalSales,
        salesVolume: newStats.salesVolume ?? 0,
        todaySales: newStats.todaySales,
        todayCollected: newStats.todayCollected ?? newStats.todaySales,
        todaySalesVolume: newStats.todaySalesVolume ?? 0,
        todayDebt: newStats.todayDebt,
        weekCollected: newStats.weekCollected ?? newStats.todayCollected ?? 0,
        weekSalesVolume: newStats.weekSalesVolume ?? newStats.todaySalesVolume ?? 0,
        weekDebt: newStats.weekDebt ?? newStats.todayDebt ?? 0,
        targetMoney: newStats.targetMoney,
      };
      setStats(next);
      localStorage.setItem("dashboard_stats_cache", JSON.stringify(next));

      const debts = await listActiveDebts();
      await notifyDebtAlerts(
        buildDebtAlerts(
          debts.map((d) => ({
            id: d.id,
            name: d.client_name,
            phone: d.client_phone,
            amount: d.remaining_balance,
            created_at: d.created_at,
            due_date: d.due_date,
            is_paid: false,
          }))
        )
      );
    } catch (error) {
      console.error("Fetch stats error:", error);
      toast.error(labels.couldNotLoadStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
      return;
    }
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated, authLoading, navigate, fetchStats, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;
    notifyIfInactiveForTenHours();
    recordAppActivity();
    const refresh = () => {
      recordAppActivity();
      fetchStats();
    };
    window.addEventListener("paymentMade", refresh);
    window.addEventListener("newDebtAdded", refresh);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    return () => {
      window.removeEventListener("paymentMade", refresh);
      window.removeEventListener("newDebtAdded", refresh);
    };
  }, [isAuthenticated, fetchStats]);

  const periodMoney =
    period === "today" ? stats.todayCollected : stats.weekCollected;
  const periodSales =
    period === "today" ? stats.todaySalesVolume : stats.weekSalesVolume;
  const periodDebt = period === "today" ? stats.todayDebt : stats.weekDebt;
  const moneyParts = formatMoneyParts(periodMoney);

  const dateLabel = useMemo(() => {
    const now = new Date();
    if (period === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return `${fmt(start)} – ${fmt(now)}`;
    }
    return now.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }, [period]);

  const greeting = greetingForHour(new Date().getHours());

  const shortcuts = [
    {
      icon: Plus,
      label: labels.newSale,
      path: "/new-sale",
      tone: "bg-blue-50 text-blue-900",
      iconTone: "bg-blue-100 text-blue-700",
    },
    {
      icon: List,
      label: labels.debtList,
      path: "/debts",
      tone: "bg-sky-50 text-sky-900",
      iconTone: "bg-sky-100 text-sky-700",
    },
    {
      icon: TrendingUp,
      label: labels.salesTab,
      path: "/sales",
      tone: "bg-indigo-50 text-indigo-900",
      iconTone: "bg-indigo-100 text-indigo-700",
    },
    {
      icon: Package,
      label: labels.inventoryTitle,
      path: "/inventory",
      tone: "bg-slate-50 text-slate-800",
      iconTone: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="sella-page">
      <header className="sella-app-header">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0b4fd9] to-[#1a6fff] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {String(displayName).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">
              {greeting}, {displayName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {shopName || BRAND.name}
              {shopCode ? ` · ${shopCode}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void hapticLight();
            navigate("/inbox");
          }}
          className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"
          aria-label="Inbox"
        >
          <Bell size={18} className="text-primary" />
        </button>
      </header>

      <main className="sella-page-body space-y-4">
        {mode === "cloud" && (
          <button
            type="button"
            onClick={() => navigate("/subscribe")}
            className={`w-full rounded-xl border p-3 text-left text-xs ${
              canWrite
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <p className="font-semibold">{accessLabel(subscription)}</p>
            {!canWrite && <p className="mt-0.5 underline">{labels.renewWithMomo}</p>}
          </button>
        )}

        {!canWrite && mode === "cloud" && (
          <WriteGate actionLabel="Gukora cyangwa guhindura" />
        )}

        {loading && !cached ? (
          <ListPageSkeleton rows={4} />
        ) : (
          <>
            {/* Hero money card — bold centered take */}
            <section className="glass-card relative rounded-3xl px-4 pt-4 pb-5 sella-card-enter">
              <div className="relative z-10 flex items-center justify-between gap-2 mb-5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1A6FFF]/12 border border-white/60 px-2.5 py-1 max-w-[55%] backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-[11px] font-semibold text-primary truncate">
                    {shopName || BRAND.name}
                  </span>
                </div>

                <div
                  className="inline-flex rounded-full bg-muted p-0.5"
                  role="group"
                  aria-label="Period"
                >
                  <button
                    type="button"
                    onClick={() => {
                      void hapticLight();
                      setPeriod("today");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
                      period === "today"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground"
                    )}
                  >
                    {labels.today}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void hapticLight();
                      setPeriod("week");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
                      period === "week"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground"
                    )}
                  >
                    {labels.week}
                  </button>
                </div>
              </div>

              <div className="text-center px-1">
                <p className="text-[13px] text-muted-foreground font-medium">
                  {period === "today" ? labels.moneyInToday : labels.moneyInWeek}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                  {dateLabel}
                </p>
                <p className="mt-3 leading-none tracking-tight">
                  <span className="text-[2.65rem] sm:text-[2.85rem] font-extrabold text-foreground tabular-nums">
                    {moneyParts.main}
                  </span>
                  <span className="ml-1.5 text-base font-bold text-muted-foreground align-top">
                    {moneyParts.suffix}
                  </span>
                </p>
                <div className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1">
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {labels.salesValue}: {formatCurrency(periodSales)}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div className="text-center px-1">
                  <div className="inline-flex items-center justify-center gap-1 text-emerald-600 mb-1">
                    <ArrowUpRight size={14} strokeWidth={2.5} />
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {formatCurrency(periodSales)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{labels.salesValue}</p>
                </div>
                <div className="text-center px-1 border-l border-border">
                  <div className="inline-flex items-center justify-center gap-1 text-rose-600 mb-1">
                    <ArrowDownRight size={14} strokeWidth={2.5} />
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {formatCurrency(periodDebt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {period === "today" ? labels.creditToday : labels.creditWeek}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 sella-stagger">
              <div className="sella-stat sella-card-enter">
                <p className="text-[10px] text-muted-foreground mb-1">
                  {labels.totalUnpaid}
                </p>
                <p className="text-base font-bold text-rose-600 tabular-nums">
                  {formatCurrency(stats.totalUnpaid)}
                </p>
              </div>
              <div className="sella-stat sella-card-enter">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users size={12} className="text-primary" />
                  <p className="text-[10px] text-muted-foreground">{labels.customers}</p>
                </div>
                <p className="text-base font-bold text-primary tabular-nums">
                  {stats.totalCustomers}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                void hapticLight();
                navigate("/assistant");
              }}
              className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3 text-left sella-press"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <MessageCircle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{labels.assistantRow}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {labels.assistantHint}
                </p>
              </div>
              <ChevronRight size={16} className="text-primary shrink-0" />
            </button>

            <div>
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <p className="text-sm font-bold text-foreground">{labels.quickActions}</p>
                <button
                  type="button"
                  className="text-[11px] text-primary font-medium inline-flex items-center gap-0.5"
                  onClick={() => navigate("/more")}
                >
                  {labels.more} <ChevronRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {shortcuts.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      void hapticLight();
                      navigate(item.path);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl p-3 active:scale-[0.97] transition-transform",
                      item.tone
                    )}
                  >
                    <div
                      className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center",
                        item.iconTone
                      )}
                    >
                      <item.icon size={20} strokeWidth={2.25} />
                    </div>
                    <span className="text-[10px] font-semibold text-center leading-tight">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
