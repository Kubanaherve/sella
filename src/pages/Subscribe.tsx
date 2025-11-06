import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Smartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/contexts/AuthContext";
import {
  MERCHANT,
  accessLabel,
  getAnnualPriceRwf,
  getMonthlyPriceRwf,
} from "@/lib/entitlements";
import {
  type BillingPlan,
  preferredBillingChannels,
  startPaypackCashin,
  submitManualPayment,
  startAppleIap,
} from "@/services/billing";
import { toast } from "sonner";

const SubscribePage = () => {
  const navigate = useNavigate();
  const { subscription, refreshSubscription, mode } = useAuth();
  const [plan, setPlan] = useState<BillingPlan>("monthly");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<"mtn" | "airtel">("mtn");
  const [channel, setChannel] = useState(preferredBillingChannels()[0]);
  const [referenceId, setReferenceId] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const amount = plan === "annual" ? getAnnualPriceRwf() : getMonthlyPriceRwf();

  const pay = async () => {
    if (mode !== "cloud") {
      toast.error("Billing requires cloud mode");
      return;
    }
    setBusy(true);
    try {
      if (channel === "apple_iap") {
        await startAppleIap(plan);
        return;
      }
      if (channel === "paypack_mtn" || channel === "paypack_airtel") {
        const data = await startPaypackCashin({
          phone,
          plan,
          network: channel === "paypack_airtel" ? "airtel" : "mtn",
        });
        toast.success(data?.message || "Approve MoMo on your phone");
        // poll refresh a few times
        for (let i = 0; i < 8; i++) {
          await new Promise((r) => setTimeout(r, 4000));
          await refreshSubscription();
        }
        toast.message("If paid, access unlocks automatically via webhook");
        return;
      }
      if (!referenceId.trim()) {
        toast.error("Enter transaction reference / TxId from SMS");
        return;
      }
      await submitManualPayment({
        plan,
        method: channel === "bank_transfer" ? "bank_transfer" : "momo_manual",
        referenceId,
        proofFile: proof,
      });
      toast.success("Kwishyura kwawe kugejejweho! Turabyemeza mu minota 15");
      navigate("/account");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="sella-app-header">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <BrandMark size="xs" />
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold truncate">Subscribe / Kwishyura</h1>
          <p className="text-[10px] text-muted-foreground truncate">{accessLabel(subscription)}</p>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPlan("monthly")}
            className={`rounded-2xl border p-4 text-left ${plan === "monthly" ? "border-primary ring-2 ring-primary/30" : ""}`}
          >
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-xl font-bold">RWF {getMonthlyPriceRwf().toLocaleString()}</p>
          </button>
          <button
            onClick={() => setPlan("annual")}
            className={`rounded-2xl border p-4 text-left ${plan === "annual" ? "border-primary ring-2 ring-primary/30" : ""}`}
          >
            <p className="text-xs text-muted-foreground">Annual · save 10k</p>
            <p className="text-xl font-bold">RWF {getAnnualPriceRwf().toLocaleString()}</p>
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Payment method</p>
          {preferredBillingChannels().map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${channel === c ? "border-primary bg-primary/5" : ""}`}
            >
              {c === "paypack_mtn" && "MTN MoMo (Paypack STK)"}
              {c === "paypack_airtel" && "Airtel Money (Paypack STK)"}
              {c === "momo_manual" && "Manual MoMo transfer"}
              {c === "bank_transfer" && "Bank transfer (BK / I&M / Equity)"}
              {c === "apple_iap" && "Apple In-App Purchase"}
            </button>
          ))}
        </div>

        {(channel === "paypack_mtn" || channel === "paypack_airtel") && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">MoMo phone to approve charge</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xxxxxxxx" />
            <div className="flex gap-2">
              <Button variant={network === "mtn" ? "default" : "outline"} size="sm" onClick={() => setNetwork("mtn")}>
                MTN
              </Button>
              <Button variant={network === "airtel" ? "default" : "outline"} size="sm" onClick={() => setNetwork("airtel")}>
                Airtel
              </Button>
            </div>
          </div>
        )}

        {(channel === "momo_manual" || channel === "bank_transfer") && (
          <div className="rounded-2xl border p-4 space-y-2 text-sm bg-white">
            {channel === "bank_transfer" ? (
              <>
                <p className="font-semibold flex items-center gap-2">
                  <Building2 size={16} /> Bank details
                </p>
                <p>Bank: {MERCHANT.bankName}</p>
                <p>Account name: {MERCHANT.accountName}</p>
                <p>Account number: {MERCHANT.accountNumber}</p>
                <p>SWIFT: {MERCHANT.swift}</p>
              </>
            ) : (
              <>
                <p className="font-semibold flex items-center gap-2">
                  <Smartphone size={16} /> MoMo merchant
                </p>
                <p>Code / USSD: {MERCHANT.momoCode}</p>
                <p>Phone: {MERCHANT.momoPhone}</p>
              </>
            )}
            <label className="text-xs text-muted-foreground block pt-2">Transaction reference (TxId)</label>
            <Input value={referenceId} onChange={(e) => setReferenceId(e.target.value)} />
            <label className="text-xs text-muted-foreground block">Receipt photo (optional)</label>
            <Input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] || null)} />
          </div>
        )}

        <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">Total</p>
            <p className="text-2xl font-bold">RWF {amount.toLocaleString()}</p>
          </div>
          <ShieldCheck />
        </div>

        <Button className="w-full btn-gold h-12" disabled={busy} onClick={pay}>
          {busy ? "Processing…" : "Continue / Komeza"}
        </Button>
      </main>
    </div>
  );
};

export default SubscribePage;
