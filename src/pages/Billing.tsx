import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signInPath } from "@/lib/checkoutIntent";
import { RefreshCw, Download, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeApp } from "@/lib/platform";
import { formatRwf } from "@/lib/plans";
import { accessLabel, hasProFeatures, hasWriteAccess } from "@/lib/entitlements";
import { listMyPayments, type BillingHistoryRow } from "@/services/billing";
import { downloadInvoicePdf } from "@/lib/invoicePdf";
import { AccountStatusModal } from "@/components/AccountStatusModal";
import { WebMomoCheckout } from "@/components/payments/WebMomoCheckout";
import { toast } from "sonner";

export default function BillingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, profile, subscription, refreshSubscription, mode } = useAuth();
  const returnPath = signInPath({
    product: params.get("product") === "pro" ? "pro" : "normal",
    interval: params.get("interval") === "annual" ? "annual" : "monthly",
  });

  // Mobile wrapper isolation
  const isWrapper = isNativeApp();
  const [modalOpen, setModalOpen] = useState(isWrapper);

  // Subscription history
  const [payments, setPayments] = useState<BillingHistoryRow[] | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isPro = hasProFeatures(subscription);
  const isEntitled = hasWriteAccess(subscription);
  const statusDescription = accessLabel(subscription);

  const loadHistory = useCallback(async () => {
    if (mode !== "cloud") return;
    setLoadingPayments(true);
    try {
      const data = await listMyPayments();
      setPayments(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingPayments(false);
    }
  }, [mode]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleDownloadReceipt = async (row: BillingHistoryRow) => {
    if (downloadingId) return;
    setDownloadingId(row.id);
    try {
      const shopName =
        (profile && "business_name" in profile && profile.business_name) || "Valued Merchant";
      const ownerName =
        (profile && "owner_name" in profile && profile.owner_name) || "";
      const shopPhone =
        (profile && "phone" in profile && profile.phone) || "";

      await downloadInvoicePdf({
        kind: "receipt",
        shopName: "KUBANA FRIEND TECHNOLOGIES (Sella)",
        shopPhone: "",
        shopEmail: "h.kubana@alustudent.com",
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
            description: `Sella Pro SaaS Subscription — ${
              row.plan_tier === "annual" ? "Annual Plan" : "Monthly Plan"
            }`,
            quantity: 1,
            unitPrice: Number(row.amount),
            total: Number(row.amount),
          },
        ],
        note: "Official electronic payment receipt issued by KUBANA FRIEND TECHNOLOGIES. Keep for your tax and bookkeeping records.",
        language: "en",
      });
      toast.success("Electronic receipt downloaded");
    } catch {
      toast.error("Failed to generate receipt PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  // If inside mobile wrapper, strictly show Store-Compliant Isolation modal
  if (isWrapper) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <AccountStatusModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            navigate("/dashboard");
          }}
          featureName="Sella Pro"
        />
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-sm text-[#6B7280]">
            Subscription management for mobile builds is maintained securely in your browser.
          </p>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-[#0F172A] text-white"
          >
            Check Account Status
          </Button>
        </div>
      </div>
    );
  }

  const shopName =
    profile && "business_name" in profile && profile.business_name
      ? String(profile.business_name)
      : "My Shop";
  const shopCode =
    profile && "shop_code" in profile && profile.shop_code
      ? String(profile.shop_code)
      : null;
  const userEmail = user?.email || (profile && "email" in profile && profile.email) || "—";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] font-sans selection:bg-[#0F172A] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-[#E5E7EB]">/</span>
            <span className="text-sm font-bold text-[#0F172A]">Billing & Subscription</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline text-[#6B7280]">Signed in as</span>
            <span className="font-semibold text-[#111827] bg-[#FAFAFA] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
              {userEmail}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {!user && !profile && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-950">
            <div>
              <strong className="font-bold">Existing merchant on mobile?</strong> Sign in with your phone number or email so your upgrade automatically syncs to your shop.
            </div>
            <Link
              to={returnPath}
              className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold rounded-lg shrink-0 shadow-xs"
            >
              Sign In to Your Shop
            </Link>
          </div>
        )}

        {/* Account Status Card */}
        <section className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">{shopName}</h1>
              {shopCode && (
                <span className="text-xs font-mono bg-[#FAFAFA] border border-[#E5E7EB] px-2 py-0.5 rounded text-[#6B7280]">
                  {shopCode}
                </span>
              )}
            </div>
            <p className="text-sm text-[#6B7280]">
              Registered email: <strong className="text-[#111827]">{userEmail}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB] space-y-0.5 text-left">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Current Status
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPro ? "bg-emerald-500" : isEntitled ? "bg-amber-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm font-bold text-[#0F172A]">
                  {isPro ? "Pro Member" : isEntitled ? "Free Plan (Active Trial)" : "Plan Expired"}
                </span>
              </div>
              <div className="text-xs text-[#6B7280]">{statusDescription}</div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await refreshSubscription();
                void loadHistory();
                toast.success("Account status refreshed");
              }}
              className="h-10 text-xs border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] text-[#111827]"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh Status
            </Button>
          </div>
        </section>

        <WebMomoCheckout />

        {/* Subscription & Payment History Table */}
        <section className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Subscription & Payment History</h2>
              <p className="text-xs text-[#6B7280]">
                Official records of all transactions processed for this shop account.
              </p>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Audited Ledger
            </span>
          </div>

          {loadingPayments ? (
            <div className="py-8 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Loading payment history…</span>
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6B7280]">
              No payments recorded yet. Upgrading will log your transaction reference here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Reference</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 text-[#111827]">
                        {new Date(p.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 font-mono text-[#6B7280] text-[11px]">
                        {p.reference_id || p.id.slice(0, 8)}
                      </td>
                      <td className="py-3 text-[#111827] uppercase">
                        {p.payment_method.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 font-semibold text-[#0F172A]">
                        {formatRwf(p.amount)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            p.status === "completed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : p.status === "pending"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {p.status === "completed" ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(p)}
                            disabled={downloadingId === p.id}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F172A] hover:underline"
                          >
                            {downloadingId === p.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                            <span>PDF</span>
                          </button>
                        ) : (
                          <span className="text-[#6B7280]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
