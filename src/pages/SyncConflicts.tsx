import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useCashierMode } from "@/hooks/useCashierMode";
import { useOwnerPin } from "@/hooks/useOwnerPin";
import { getSupabase, isCloudMode } from "@/integrations/supabase/client";
import { listConflictOutbox, type OutboxItem } from "@/db/outbox";
import { describeConflict } from "@/lib/conflictReview";
import { resolveConflictAsOwner } from "@/services/conflictResolve";
import { formatCurrency } from "@/lib/kinyarwanda";
import { toast } from "sonner";

export default function SyncConflictsPage() {
  const { profile } = useAuth();
  const { isCashier } = useCashierMode();
  const { askOwnerPin, ownerPinDialog } = useOwnerPin();
  const [ownerKey, setOwnerKey] = useState("");
  const [rows, setRows] = useState<OutboxItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (key: string) => {
    if (!key) {
      setRows([]);
      return;
    }
    setRows(await listConflictOutbox(key));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let key = "";
      if (isCloudMode()) {
        try {
          const { data } = await getSupabase().auth.getSession();
          key = data.session?.user?.id ?? "";
        } catch {
          key = "";
        }
      }
      if (!key && profile && "user_id" in profile && profile.user_id) {
        key = profile.user_id;
      }
      if (!cancelled) {
        setOwnerKey(key);
        await load(key);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, load]);

  const resolve = async (row: OutboxItem, action: "retry" | "void") => {
    if (!ownerKey) return;
    const pin = await askOwnerPin(
      action === "retry"
        ? "PIN y'umuyobozi kugira ngo wongere wohereze iyi sale"
        : "PIN y'umuyobozi kugira ngo ufungire iyi sale"
    );
    if (!pin) return;
    setBusyId(row.id);
    try {
      await resolveConflictAsOwner({
        ownerKey,
        id: row.id,
        action,
        note: action === "retry" ? "Owner retried the same receipt" : "Owner voided the receipt",
        pin,
      });
      toast.success(action === "retry" ? "Sale yongeye gushyirwa mu murongo" : "Sale yafunzwe, ntiyasibwe");
      await load(ownerKey);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Habaye ikosa");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="sella-page">
      <PageHeader
        title="Sales zitegereje"
        subtitle="Ibyabaye conflict ntibisibwa. Owner ashobora kongera kubohereza cyangwa gufunga."
      />
      {isCashier && (
        <p className="mx-4 mt-3 text-sm text-rose-700">
          Cashier Mode ntishobora gukemura izi sales.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="mx-4 mt-6 text-sm text-slate-500">Nta sale itegeye isuzuma.</p>
      ) : (
        <ul className="mx-4 mt-3 space-y-3 pb-8">
          {rows.map((row) => {
            const view = describeConflict(row);
            return (
              <li key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                <p className="font-semibold">{view.clientName || "Walk-in"}</p>
                <p className="text-slate-500">{view.phone || "—"}</p>
                <p className="mt-1 font-bold">{formatCurrency(view.amount)}</p>
                <p className="text-xs text-slate-500">
                  {view.soldAt} · saved {view.createdAt}
                </p>
                <p className="mt-2 text-rose-700">{view.reason}</p>
                <ul className="mt-2 space-y-1">
                  {view.items.map((item, index) => (
                    <li key={`${row.id}-item-${index}`}>
                      {item.name} × {item.quantity} · {formatCurrency(item.unitPrice)}
                    </li>
                  ))}
                </ul>
                <ul className="mt-2 space-y-1">
                  {view.payments.map((payment, index) => (
                    <li key={`${row.id}-pay-${index}`}>
                      {payment.method} {formatCurrency(payment.amount)}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 break-all text-[11px] text-slate-400">
                  Idempotency {view.idempotencyKey}
                </p>
                {!isCashier && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void resolve(row, "retry")}
                      className="flex-1 min-h-[44px] rounded-xl bg-[#0B4FD9] text-white font-semibold"
                    >
                      Ongera wohereze
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void resolve(row, "void")}
                      className="flex-1 min-h-[44px] rounded-xl border border-slate-300 font-semibold"
                    >
                      Funga
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {ownerPinDialog}
    </div>
  );
}
