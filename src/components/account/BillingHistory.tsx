import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatRwf } from "@/lib/plans";
import { listMyPayments, type BillingHistoryRow } from "@/services/billing";
import { downloadInvoicePdf } from "@/lib/invoicePdf";
import { Download, FileCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function BillingHistory() {
  const { mode, profile } = useAuth();
  const [rows, setRows] = useState<BillingHistoryRow[] | null>(null);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "cloud") return;
    let cancelled = false;
    listMyPayments()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load payments");
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const handleDownloadReceipt = async (row: BillingHistoryRow) => {
    if (downloadingId) return;
    setDownloadingId(row.id);
    try {
      const shopName =
        (profile && "business_name" in profile && profile.business_name) || "Customer";
      const ownerName =
        (profile && "owner_name" in profile && profile.owner_name) || "";
      const shopPhone =
        (profile && "phone" in profile && profile.phone) || "";

      await downloadInvoicePdf({
        kind: "receipt",
        shopName: "KUBANA FRIEND TECHNOLOGIES (Sella)",
        shopPhone: "+250 788 123 456",
        shopEmail: "hello@sella.app",
        shopLocation: "Kigali, Rwanda",
        invoiceNumber: row.reference_id || `REC-${row.id.slice(0, 8).toUpperCase()}`,
        createdAt: row.created_at,
        customerName: `${shopName} (${ownerName})`,
        customerPhone: shopPhone,
        customerLocation: "Rwanda",
        paymentMethodLabel: row.payment_method.replace(/_/g, " ").toUpperCase(),
        paymentReference: row.reference_id || row.id,
        total: Number(row.amount),
        paid: Number(row.amount),
        remaining: 0,
        items: [
          {
            description: `Sella Cloud SaaS Subscription — ${
              row.plan_tier === "annual" ? "Annual Plan" : "Monthly Plan"
            }`,
            quantity: 1,
            unitPrice: Number(row.amount),
            total: Number(row.amount),
          },
        ],
        note: "Murakoze gukoresha Sella. Official electronic tax receipt issued by KUBANA FRIEND TECHNOLOGIES.",
        language: "rw",
      });
      toast.success("Inyemezabwishyu yakoporowe (Receipt downloaded)");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate receipt PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-border/60 p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Payment history & receipts</p>
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Official Ledger
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Completed payments can be downloaded as official electronic receipts for your business records and tax filings.
      </p>
      {mode !== "cloud" && (
        <p className="text-xs text-muted-foreground">Payment history is stored for cloud accounts.</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {mode === "cloud" && rows === null && !error && (
        <p className="text-xs text-muted-foreground">Loading payments…</p>
      )}
      {rows && rows.length === 0 && (
        <p className="text-xs text-muted-foreground">No payments yet.</p>
      )}
      {rows && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-border/50 p-3 text-xs bg-white/50 dark:bg-white/[0.02] flex flex-col gap-2"
            >
              <div className="flex justify-between items-center gap-2 font-semibold">
                <span>{formatRwf(Number(row.amount))}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    row.status === "completed"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {row.status}
                </span>
              </div>
              <p className="text-muted-foreground">
                {row.plan_tier} · {row.payment_method.replace(/_/g, " ")} ·{" "}
                {new Date(row.created_at).toLocaleDateString("en-RW", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              {row.reference_id ? (
                <p className="text-muted-foreground break-all text-[11px]">
                  Ref: <span className="font-mono">{row.reference_id}</span>
                </p>
              ) : null}

              {row.status === "completed" && (
                <button
                  type="button"
                  disabled={downloadingId === row.id}
                  onClick={() => handleDownloadReceipt(row)}
                  className="mt-1 inline-flex items-center gap-1.5 self-start px-2.5 py-1.5 rounded-lg bg-[#1A6FFF]/10 hover:bg-[#1A6FFF]/20 text-[#1A6FFF] text-[11px] font-semibold transition-colors disabled:opacity-50"
                >
                  {downloadingId === row.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  <span>Download Official Receipt PDF</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
