import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  plan_tier: string;
  payment_method: string;
  reference_id: string | null;
  external_transaction_id: string | null;
  proof_image_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  verified_at: string | null;
}

interface SubRow {
  user_id: string;
  status: string;
  current_period_end: string | null;
  plan_tier: string | null;
}

type Filter = "all" | "pending" | "completed" | "rejected" | "cancelled" | "expired_pending";

function providerLabel(method: string): string {
  if (method.includes("momo") || method === "momo_paypack") return "MTN MoMo";
  if (method.includes("airtel")) return "Airtel Money";
  if (method.includes("card")) return "Card (Visa/MC)";
  if (method.includes("bank")) return "Bank";
  if (method.includes("apple")) return "Apple";
  return method;
}

function statusTone(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "pending":
      return "bg-amber-100 text-amber-900";
    case "expired_pending":
      return "bg-orange-100 text-orange-900";
    case "cancelled":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-red-100 text-red-800";
  }
}

const AdminPaymentsPage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading } = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [subs, setSubs] = useState<Record<string, SubRow>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = getSupabase();
    let q = sb
      .from("subscription_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      return;
    }
    const payments = (data as PaymentRow[]) || [];
    setRows(payments);

    const userIds = [...new Set(payments.map((p) => p.user_id))];
    if (userIds.length) {
      const { data: subData } = await sb
        .from("user_subscriptions")
        .select("user_id, status, current_period_end, plan_tier")
        .in("user_id", userIds);
      const map: Record<string, SubRow> = {};
      for (const s of (subData as SubRow[]) || []) map[s.user_id] = s;
      setSubs(map);
    } else {
      setSubs({});
    }
  }, [filter]);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) navigate("/dashboard");
  }, [isLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    if (isSuperAdmin) void load();
  }, [isSuperAdmin, load]);

  const stalePending = useMemo(
    () =>
      rows.filter(
        (p) =>
          p.status === "pending" &&
          Date.now() - new Date(p.created_at).getTime() > 60 * 60 * 1000
      ).length,
    [rows]
  );

  const act = async (paymentId: string, action: "approve" | "reject") => {
    setBusyId(paymentId);
    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("approve-manual-payment", {
        body: { payment_id: paymentId, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(action === "approve" ? "Approved — 30 days activated" : "Rejected");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const filters: Filter[] = [
    "all",
    "pending",
    "completed",
    "rejected",
    "cancelled",
    "expired_pending",
  ];

  return (
    <div className="min-h-screen sella-hero-bg pb-8">
      <header className="sella-app-header">
        <button
          onClick={() => navigate("/more")}
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold truncate flex-1">Admin · Payments</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"
          aria-label="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-3">
        {stalePending > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
            {stalePending} payment(s) pending over 1 hour — investigate MoMo/Airtel
            confirmation.
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold border ${
                filter === f
                  ? "bg-primary text-white border-primary"
                  : "bg-white/60 border-white/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No payments in this filter</p>
        )}

        {rows.map((p) => {
          const sub = subs[p.user_id];
          const ageMin = Math.round(
            (Date.now() - new Date(p.created_at).getTime()) / 60000
          );
          const canManual =
            p.status === "pending" || p.status === "expired_pending";
          return (
            <div key={p.id} className="glass-card p-4 space-y-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">
                  RWF {Number(p.amount).toLocaleString()} · {p.plan_tier}
                </p>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusTone(
                    p.status
                  )}`}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-xs font-medium">{providerLabel(p.payment_method)}</p>
              <p className="text-[11px] text-muted-foreground break-all">
                Ref: {p.reference_id || "—"}
              </p>
              {p.external_transaction_id && (
                <p className="text-[11px] text-muted-foreground break-all">
                  Provider tx: {p.external_transaction_id}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                {new Date(p.created_at).toLocaleString()} · {ageMin}m ago
                {p.verified_at
                  ? ` · verified ${new Date(p.verified_at).toLocaleString()}`
                  : ""}
              </p>
              <p className="text-[11px] text-muted-foreground break-all">
                User: {p.user_id.slice(0, 8)}…
              </p>
              {sub && (
                <p className="text-[11px]">
                  Sub: <strong>{sub.status}</strong>
                  {sub.current_period_end
                    ? ` · expires ${new Date(sub.current_period_end).toLocaleDateString("en-RW")}`
                    : ""}
                </p>
              )}
              {p.admin_notes && (
                <p className="text-[11px] text-muted-foreground">{p.admin_notes}</p>
              )}
              {p.proof_image_url && (
                <a
                  href={p.proof_image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-xs underline"
                >
                  View receipt
                </a>
              )}
              {canManual && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    disabled={busyId === p.id}
                    onClick={() => act(p.id, "approve")}
                  >
                    Approve (30d)
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={busyId === p.id}
                    onClick={() => act(p.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default AdminPaymentsPage;
