import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CreditCard, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/company";
import { toast } from "sonner";

type Stats = {
  totalCollected: number;
  successful: number;
  pending: number;
  failed: number;
  mtn: number;
  airtel: number;
  card: number;
  activeSubs: number;
  expiredSubs: number;
  expiring7d: number;
  notifs: number;
  notifsUnread: number;
};

const empty: Stats = {
  totalCollected: 0,
  successful: 0,
  pending: 0,
  failed: 0,
  mtn: 0,
  airtel: 0,
  card: 0,
  activeSubs: 0,
  expiredSubs: 0,
  expiring7d: 0,
  notifs: 0,
  notifsUnread: 0,
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading } = useAuth();
  const [stats, setStats] = useState<Stats>(empty);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const sb = getSupabase();
      const { data: pays, error } = await sb
        .from("subscription_payments")
        .select("amount, status, payment_method")
        .limit(2000);
      if (error) throw error;

      const s: Stats = { ...empty };
      for (const p of pays || []) {
        const method = String(p.payment_method || "");
        if (p.status === "completed") {
          s.successful += 1;
          s.totalCollected += Number(p.amount) || 0;
        } else if (p.status === "pending" || p.status === "expired_pending") {
          s.pending += 1;
        } else {
          s.failed += 1;
        }
        if (method.includes("momo") || method.includes("mtn")) s.mtn += 1;
        if (method.includes("airtel")) s.airtel += 1;
        if (method.includes("card")) s.card += 1;
      }

      const now = new Date();
      const in7 = new Date(now.getTime() + 7 * 86400000);
      const { data: subs } = await sb
        .from("user_subscriptions")
        .select("status, current_period_end")
        .limit(2000);
      for (const sub of subs || []) {
        if (sub.status === "active") {
          s.activeSubs += 1;
          if (
            sub.current_period_end &&
            new Date(sub.current_period_end) <= in7 &&
            new Date(sub.current_period_end) > now
          ) {
            s.expiring7d += 1;
          }
        }
        if (sub.status === "expired") s.expiredSubs += 1;
      }

      const { count: nCount } = await sb
        .from("billing_notifications")
        .select("id", { count: "exact", head: true });
      const { count: nUnread } = await sb
        .from("billing_notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      s.notifs = nCount || 0;
      s.notifsUnread = nUnread || 0;

      setStats(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) navigate("/dashboard");
  }, [isLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    if (isSuperAdmin) void load();
  }, [isSuperAdmin, load]);

  const Tile = ({
    label,
    value,
    hint,
  }: {
    label: string;
    value: string | number;
    hint?: string;
  }) => (
    <div className="glass-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
      {hint ? <p className="text-[10px] text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );

  return (
    <div className="min-h-screen sella-hero-bg pb-10">
      <header className="sella-app-header">
        <button
          onClick={() => navigate("/more")}
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold truncate">Admin · {COMPANY.productName}</h1>
          <p className="text-[10px] text-muted-foreground truncate">
            {COMPANY.legalName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-5">
        <section className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <CreditCard size={16} /> Payments
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Tile
              label="Total collected"
              value={`RWF ${stats.totalCollected.toLocaleString()}`}
            />
            <Tile label="Successful" value={stats.successful} />
            <Tile label="Pending" value={stats.pending} />
            <Tile label="Failed / cancelled" value={stats.failed} />
            <Tile label="MTN-related" value={stats.mtn} />
            <Tile label="Airtel-related" value={stats.airtel} />
            <Tile label="Card" value={stats.card} />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/admin/payments")}
          >
            Open transaction ledger
          </Button>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Users size={16} /> Subscriptions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Active" value={stats.activeSubs} />
            <Tile label="Expired" value={stats.expiredSubs} />
            <Tile
              label="Expiring ≤ 7 days"
              value={stats.expiring7d}
              hint="Reminders fire at 7/3/2/1/0 days"
            />
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Bell size={16} /> Notifications
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Total logged" value={stats.notifs} />
            <Tile label="Unread (all users)" value={stats.notifsUnread} />
          </div>
        </section>

        <div className="glass-card p-4 text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Merchant:</strong> {COMPANY.merchantBrand}
          </p>
          <p>
            <strong>Founder:</strong> {COMPANY.founderName}
          </p>
          <p>
            <strong>Email:</strong> {COMPANY.businessEmail}
          </p>
          <p>{COMPANY.supportNote}</p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
