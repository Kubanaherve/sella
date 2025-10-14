import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
  proof_image_url: string | null;
  status: string;
  created_at: string;
}

const AdminPaymentsPage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading } = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("subscription_payments")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data as PaymentRow[]) || []);
  }, []);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) navigate("/dashboard");
  }, [isLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    if (isSuperAdmin) void load();
  }, [isSuperAdmin, load]);

  const act = async (paymentId: string, action: "approve" | "reject") => {
    setBusyId(paymentId);
    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("approve-manual-payment", {
        body: { payment_id: paymentId, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(action === "approve" ? "Emeza — approved" : "Hana — rejected");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <header className="sella-app-header">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold truncate flex-1">Admin · Pending payments</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No pending payments</p>}
        {rows.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border p-4 space-y-2 text-sm">
            <p className="font-semibold">
              RWF {Number(p.amount).toLocaleString()} · {p.plan_tier}
            </p>
            <p className="text-xs text-muted-foreground">{p.payment_method}</p>
            <p className="text-xs">Ref: {p.reference_id || "—"}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
            {p.proof_image_url && (
              <a href={p.proof_image_url} target="_blank" rel="noreferrer" className="text-primary text-xs underline">
                View receipt
              </a>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                disabled={busyId === p.id}
                onClick={() => act(p.id, "approve")}
              >
                Emeza (Approve)
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={busyId === p.id}
                onClick={() => act(p.id, "reject")}
              >
                Hana (Reject)
              </Button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default AdminPaymentsPage;
