import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
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
  type BillingChannel,
  type BillingPlan,
  pollUntilActive,
  preferredBillingChannels,
  startCardCharge,
  startPaypackCashin,
  startAppleIap,
  submitManualPayment,
  validateCardAuth,
  verifyFlutterwavePayment,
} from "@/services/billing";
import {
  AirtelLogo,
  MastercardLogo,
  MtnLogo,
  VisaLogo,
} from "@/components/payment/PaymentBrandLogos";
import FlipCardForm, {
  emptyCard,
  type CardPayload,
} from "@/components/payment/FlipCardForm";
import { toast } from "sonner";

function channelLabel(c: BillingChannel): string {
  switch (c) {
    case "paypack_mtn":
      return "MTN MoMo";
    case "paypack_airtel":
      return "Airtel Money";
    case "card_visa_mc":
      return "Visa / Mastercard";
    case "momo_manual":
      return "MTN transfer (manual)";
    case "airtel_manual":
      return "Airtel transfer (manual)";
    case "bank_transfer":
      return "Bank transfer";
    case "apple_iap":
      return "Apple In-App Purchase";
    default:
      return c;
  }
}

const SubscribePage = () => {
  const navigate = useNavigate();
  const { subscription, refreshSubscription, mode, profile, user } = useAuth();
  const channels = useMemo(() => preferredBillingChannels(), []);
  const [plan, setPlan] = useState<BillingPlan>("monthly");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<BillingChannel>(channels[0]);
  const [referenceId, setReferenceId] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [card, setCard] = useState<CardPayload>(emptyCard());
  const [busy, setBusy] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [pendingFlwRef, setPendingFlwRef] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const amount = plan === "annual" ? getAnnualPriceRwf() : getMonthlyPriceRwf();

  const finishSuccess = async (msg?: string) => {
    toast.success(msg || "Kwishyura byagenze neza!");
    await refreshSubscription();
    navigate("/account");
  };

  const pay = async () => {
    if (mode !== "cloud") {
      toast.error("Billing requires cloud mode");
      return;
    }
    setBusy(true);
    setStatusMsg("");
    try {
      if (channel === "apple_iap") {
        await startAppleIap(plan);
        return;
      }

      if (channel === "paypack_mtn" || channel === "paypack_airtel") {
        if (!phone.trim() || phone.replace(/\D/g, "").length < 9) {
          toast.error("Andika numero ya MoMo (07xxxxxxxx)");
          return;
        }
        const data = await startPaypackCashin({
          phone,
          plan,
          network: channel === "paypack_airtel" ? "airtel" : "mtn",
        });
        setStatusMsg(
          data?.message ||
            "Approve the payment prompt on your phone (MTN / Airtel)."
        );
        toast.success("Check your phone — approve the MoMo request");
        await pollUntilActive(refreshSubscription, { attempts: 10, intervalMs: 4000 });
        toast.message("If paid, access unlocks automatically via webhook");
        await refreshSubscription();
        return;
      }

      if (channel === "card_visa_mc") {
        if (card.number.replace(/\D/g, "").length < 13) {
          toast.error("Enter a valid card number");
          return;
        }
        if (!card.name.trim()) {
          toast.error("Enter the name on the card");
          return;
        }
        if (!card.expiryMonth || !card.expiryYear || card.cvv.length < 3) {
          toast.error("Enter expiry and CVC");
          return;
        }

        const data = await startCardCharge({
          plan,
          card_number: card.number,
          cvv: card.cvv,
          expiry_month: card.expiryMonth,
          expiry_year: card.expiryYear,
          fullname: card.name,
          email: profile?.email || user?.email || undefined,
          phone: phone || undefined,
        });

        if (data.status === "successful") {
          setCard(emptyCard());
          await finishSuccess(data.message || "Card payment successful");
          return;
        }

        if (data.status === "redirect_required" && data.redirect_url) {
          setPendingRef(data.reference || null);
          setStatusMsg("Opening your bank’s 3D Secure page…");
          window.location.href = data.redirect_url;
          return;
        }

        if (data.status === "otp_required") {
          setPendingRef(data.reference || null);
          setPendingFlwRef(data.flw_ref || null);
          setOtpOpen(true);
          setStatusMsg("Enter the OTP from your bank SMS");
          return;
        }

        if (data.status === "pin_required") {
          setPendingRef(data.reference || null);
          setPendingFlwRef(data.flw_ref || null);
          setPinOpen(true);
          setStatusMsg("Enter your card PIN");
          return;
        }

        if (data.reference) {
          setPendingRef(data.reference);
          setStatusMsg("Verifying card payment…");
          for (let i = 0; i < 8; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const v = await verifyFlutterwavePayment(data.reference);
            if (v.status === "successful") {
              setCard(emptyCard());
              await finishSuccess("Card payment successful");
              return;
            }
          }
          toast.message("Payment still pending — refresh Account in a minute");
        }
        return;
      }

      if (!referenceId.trim()) {
        toast.error("Enter transaction reference / TxId from SMS");
        return;
      }
      const method =
        channel === "bank_transfer"
          ? "bank_transfer"
          : channel === "airtel_manual"
            ? "airtel_manual"
            : "momo_manual";
      await submitManualPayment({
        plan,
        method,
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

  const submitOtp = async () => {
    if (!pendingRef || !pendingFlwRef) return;
    setBusy(true);
    try {
      const data = await validateCardAuth({
        reference: pendingRef,
        mode: "otp",
        otp,
        flw_ref: pendingFlwRef,
      });
      if (data.status === "successful") {
        setOtpOpen(false);
        setCard(emptyCard());
        await finishSuccess(data.message);
        return;
      }
      if (data.status === "redirect_required" && data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      toast.error("OTP validation failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "OTP failed");
    } finally {
      setBusy(false);
    }
  };

  const submitPin = async () => {
    if (!pendingRef) return;
    setBusy(true);
    try {
      const data = await validateCardAuth({
        reference: pendingRef,
        mode: "pin",
        pin,
        flw_ref: pendingFlwRef || undefined,
        fullname: card.name,
        email: profile?.email || user?.email || undefined,
        card: {
          card_number: card.number,
          cvv: card.cvv,
          expiry_month: card.expiryMonth,
          expiry_year: card.expiryYear,
        },
      });
      if (data.status === "successful") {
        setPinOpen(false);
        setCard(emptyCard());
        await finishSuccess(data.message);
        return;
      }
      if (data.status === "redirect_required" && data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      toast.error("PIN validation failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PIN failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen sella-hero-bg pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
          <h1 className="text-base font-bold truncate">Secure checkout</h1>
          <p className="text-[10px] text-muted-foreground truncate">
            {accessLabel(subscription)}
          </p>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className={`sella-pay-method ${plan === "monthly" ? "is-active" : ""}`}
          >
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-xl font-bold">
              RWF {getMonthlyPriceRwf().toLocaleString()}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setPlan("annual")}
            className={`sella-pay-method ${plan === "annual" ? "is-active" : ""}`}
          >
            <p className="text-xs text-muted-foreground">Annual · save 10k</p>
            <p className="text-xl font-bold">
              RWF {getAnnualPriceRwf().toLocaleString()}
            </p>
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Pay with</p>
          <div className="space-y-2">
            {channels.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`sella-pay-method flex items-center gap-3 ${
                  channel === c ? "is-active" : ""
                }`}
              >
                <div className="w-16 shrink-0 flex justify-center">
                  {c === "paypack_mtn" || c === "momo_manual" ? (
                    <MtnLogo className="h-8 w-[72px]" />
                  ) : null}
                  {c === "paypack_airtel" || c === "airtel_manual" ? (
                    <AirtelLogo className="h-8 w-[72px]" />
                  ) : null}
                  {c === "card_visa_mc" ? (
                    <div className="flex items-center gap-1">
                      <div className="rounded bg-white px-1 py-0.5 shadow-sm">
                        <VisaLogo className="h-3.5" />
                      </div>
                      <MastercardLogo className="h-6" />
                    </div>
                  ) : null}
                  {c === "bank_transfer" ? (
                    <Building2 className="text-primary" size={22} />
                  ) : null}
                  {c === "apple_iap" ? (
                    <CreditCard className="text-primary" size={22} />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-bold">{channelLabel(c)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {c === "paypack_mtn" || c === "paypack_airtel"
                      ? "Instant STK prompt on your phone"
                      : c === "card_visa_mc"
                        ? "Secure Visa & Mastercard · 3D Secure"
                        : c === "apple_iap"
                          ? "App Store subscription"
                          : "Send money, then paste TxId"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {(channel === "paypack_mtn" || channel === "paypack_airtel") && (
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              {channel === "paypack_mtn" ? (
                <MtnLogo className="h-7" />
              ) : (
                <AirtelLogo className="h-7" />
              )}
              <p className="text-sm font-semibold">
                Phone that will approve the charge
              </p>
            </div>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xxxxxxxx"
              inputMode="tel"
              className="input-glow"
            />
            <p className="text-[11px] text-muted-foreground">
              You will get a MoMo / Airtel Money prompt. Enter PIN to confirm
              RWF {amount.toLocaleString()}.
            </p>
          </div>
        )}

        {channel === "card_visa_mc" && (
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CreditCard size={16} /> Card details
              </p>
              <div className="flex items-center gap-1.5">
                <div className="rounded bg-white px-1.5 py-0.5 shadow-sm">
                  <VisaLogo className="h-3.5" />
                </div>
                <MastercardLogo className="h-6" />
              </div>
            </div>
            <FlipCardForm value={card} onChange={setCard} disabled={busy} />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional, for receipt)"
              inputMode="tel"
              className="input-glow"
            />
          </div>
        )}

        {(channel === "momo_manual" ||
          channel === "airtel_manual" ||
          channel === "bank_transfer") && (
          <div className="glass-card p-4 space-y-3 text-sm">
            {channel === "bank_transfer" ? (
              <>
                <p className="font-semibold flex items-center gap-2">
                  <Building2 size={16} /> Bank details
                </p>
                <div className="rounded-xl bg-white/60 p-3 space-y-1 text-[13px]">
                  <p>
                    Bank: <strong>{MERCHANT.bankName}</strong>
                  </p>
                  <p>
                    Account name: <strong>{MERCHANT.accountName}</strong>
                  </p>
                  <p>
                    Account number: <strong>{MERCHANT.accountNumber}</strong>
                  </p>
                  <p>
                    SWIFT: <strong>{MERCHANT.swift}</strong>
                  </p>
                </div>
              </>
            ) : channel === "airtel_manual" ? (
              <>
                <p className="font-semibold flex items-center gap-2">
                  <AirtelLogo className="h-6" /> Airtel Money merchant
                </p>
                <div className="rounded-xl bg-white/60 p-3 space-y-1 text-[13px]">
                  <p>
                    Name: <strong>{MERCHANT.airtelName}</strong>
                  </p>
                  <p>
                    Code / USSD: <strong>{MERCHANT.airtelCode}</strong>
                  </p>
                  <p>
                    Phone: <strong>{MERCHANT.airtelPhone}</strong>
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold flex items-center gap-2">
                  <MtnLogo className="h-6" /> MTN MoMo merchant
                </p>
                <div className="rounded-xl bg-white/60 p-3 space-y-1 text-[13px]">
                  <p>
                    Name: <strong>{MERCHANT.momoName}</strong>
                  </p>
                  <p>
                    Code / USSD: <strong>{MERCHANT.momoCode}</strong>
                  </p>
                  <p>
                    Phone: <strong>{MERCHANT.momoPhone}</strong>
                  </p>
                </div>
              </>
            )}
            <label className="text-xs text-muted-foreground block pt-1">
              Transaction reference (TxId from SMS)
            </label>
            <Input
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="input-glow"
              placeholder="Paste TxId"
            />
            <label className="text-xs text-muted-foreground block">
              Receipt photo (optional)
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setProof(e.target.files?.[0] || null)}
            />
          </div>
        )}

        {statusMsg && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary flex items-start gap-2">
            <Smartphone size={16} className="mt-0.5 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-[#0b3fcc] to-[#1a6fff] text-white p-4 flex items-center justify-between shadow-lg shadow-primary/25">
          <div>
            <p className="text-xs text-white/70">Total due</p>
            <p className="text-2xl font-bold">RWF {amount.toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ShieldCheck />
            <p className="text-[10px] text-white/70">Encrypted checkout</p>
          </div>
        </div>

        <Button
          className="w-full sella-btn-confirm h-12"
          disabled={busy}
          onClick={() => void pay()}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Processing…
            </>
          ) : (
            `Pay RWF ${amount.toLocaleString()}`
          )}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
          Card data is encrypted to Flutterwave. MoMo uses Paypack. Manual
          transfers go to the merchant accounts above — replace placeholders in
          your env when ready.
        </p>
      </main>

      {/* OTP sheet */}
      {otpOpen && (
        <div className="fixed inset-0 z-[140] sella-overlay flex items-end sm:items-center justify-center p-4">
          <div className="sella-popup-glass w-full max-w-sm rounded-3xl p-5 space-y-3">
            <h2 className="font-bold text-lg relative z-10">Bank OTP</h2>
            <p className="text-sm text-muted-foreground relative z-10">
              Enter the one-time code sent by your bank to finish the card
              payment.
            </p>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="OTP"
              className="input-glow relative z-10 font-mono tracking-widest"
              inputMode="numeric"
            />
            <div className="relative z-10 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOtpOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => void submitOtp()}
                disabled={busy || otp.length < 4}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PIN sheet */}
      {pinOpen && (
        <div className="fixed inset-0 z-[140] sella-overlay flex items-end sm:items-center justify-center p-4">
          <div className="sella-popup-glass w-full max-w-sm rounded-3xl p-5 space-y-3">
            <h2 className="font-bold text-lg relative z-10">Card PIN</h2>
            <p className="text-sm text-muted-foreground relative z-10">
              Enter your card PIN to authorize this payment.
            </p>
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              type="password"
              className="input-glow relative z-10 font-mono tracking-[0.4em]"
              inputMode="numeric"
            />
            <div className="relative z-10 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPinOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => void submitPin()}
                disabled={busy || pin.length < 4}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribePage;
