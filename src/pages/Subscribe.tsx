import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Loader2,
  Pencil,
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
  preferredBillingChannels,
  startCardCharge,
  startPaypackCashin,
  startAppleIap,
  submitManualPayment,
  validateCardAuth,
  verifyFlutterwavePayment,
  waitForPaymentConfirmation,
  confirmTestPayment,
} from "@/services/billing";
import {
  AirtelLogo,
  MastercardLogo,
  MtnLogo,
  VisaLogo,
} from "@/components/payment/PaymentBrandLogos";
import CardCheckoutModal, {
  type CardPayload,
} from "@/components/payment/CardCheckoutModal";
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
  const [card, setCard] = useState<CardPayload | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [pendingFlwRef, setPendingFlwRef] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [testModeHint, setTestModeHint] = useState(false);

  const amount = plan === "annual" ? getAnnualPriceRwf() : getMonthlyPriceRwf();

  const finishSuccess = async (msg?: string) => {
    await refreshSubscription();
    toast.success(msg || "Payment confirmed — subscription active for 30 days");
    navigate("/account");
  };

  const selectChannel = (c: BillingChannel) => {
    setChannel(c);
    if (c === "card_visa_mc") {
      setCardModalOpen(true);
    }
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
          toast.error("Andika numero (07xxxxxxxx)");
          return;
        }
        const data = await startPaypackCashin({
          phone,
          plan,
          network: channel === "paypack_airtel" ? "airtel" : "mtn",
        });
        // Request sent — NOT paid yet
        setPendingPaymentId(data.payment_id);
        setTestModeHint(!!data.test_mode);
        setStatusMsg(
          data.message ||
            "Approve on your phone. Waiting for provider confirmation…"
        );
        toast.message(
          data.test_mode
            ? "TEST MODE — no real money. Use Confirm test payment below."
            : "Payment request sent — approve on your phone"
        );

        if (data.test_mode) {
          // Do not pretend success — wait for explicit test confirm or admin
          return;
        }

        const result = await waitForPaymentConfirmation(data.payment_id, {
          attempts: 24,
          intervalMs: 5000,
          onTick: (s) => {
            setStatusMsg(
              s.confirmed
                ? "Payment confirmed!"
                : s.failed
                  ? `Payment ${s.status}`
                  : "Waiting for provider webhook confirmation…"
            );
          },
        });

        if (result.confirmed) {
          await finishSuccess(
            result.subscription?.current_period_end
              ? `Active until ${new Date(result.subscription.current_period_end).toLocaleDateString("en-RW")}`
              : "Subscription activated"
          );
          return;
        }
        if (result.failed) {
          toast.error(`Payment ${result.status}. Try again or use manual transfer.`);
          return;
        }
        toast.message(
          "Still pending. If you approved MoMo, access will unlock automatically when Paypack confirms — check Account in a minute."
        );
        await refreshSubscription();
        return;
      }

      if (channel === "card_visa_mc") {
        if (!card) {
          setCardModalOpen(true);
          toast.message("Add your card first");
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
          setCard(null);
          await finishSuccess(data.message || "Card payment confirmed");
          return;
        }

        if (data.status === "redirect_required" && data.redirect_url) {
          setPendingRef(data.reference || null);
          setStatusMsg("Complete 3D Secure with your bank…");
          window.location.href = data.redirect_url;
          return;
        }

        if (data.status === "otp_required") {
          setPendingRef(data.reference || null);
          setPendingFlwRef(data.flw_ref || null);
          setOtpOpen(true);
          setStatusMsg("Enter the OTP from your bank");
          return;
        }

        if (data.status === "pin_required") {
          setPendingRef(data.reference || null);
          setPendingFlwRef(data.flw_ref || null);
          setPinOpen(true);
          setStatusMsg("Enter your card PIN");
          return;
        }

        if (data.payment_id) {
          setStatusMsg("Verifying card with Flutterwave…");
          const result = await waitForPaymentConfirmation(data.payment_id, {
            attempts: 12,
            intervalMs: 4000,
          });
          if (result.confirmed) {
            setCard(null);
            await finishSuccess("Card payment confirmed");
            return;
          }
        } else if (data.reference) {
          for (let i = 0; i < 8; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const v = await verifyFlutterwavePayment(data.reference);
            if (v.status === "successful") {
              setCard(null);
              await finishSuccess("Card payment confirmed");
              return;
            }
          }
        }
        toast.message("Card still pending bank confirmation");
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
      toast.message(
        "Transfer submitted for review — subscription activates only after admin verifies the TxId"
      );
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
        setCard(null);
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
    if (!pendingRef || !card) return;
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
        setCard(null);
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

  const cardSummary = card
    ? `${card.brand === "mastercard" ? "Mastercard" : card.brand === "amex" ? "Amex" : "Visa"} ·••• ${card.number.replace(/\D/g, "").slice(-4)}`
    : null;

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
            <p className="text-xs text-muted-foreground">Monthly · 30 days</p>
            <p className="text-xl font-bold">
              RWF {getMonthlyPriceRwf().toLocaleString()}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setPlan("annual")}
            className={`sella-pay-method ${plan === "annual" ? "is-active" : ""}`}
          >
            <p className="text-xs text-muted-foreground">Annual · 365 days</p>
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
                onClick={() => selectChannel(c)}
                className={`sella-pay-method flex items-center gap-3 ${
                  channel === c ? "is-active" : ""
                }`}
              >
                <div className="w-[72px] h-10 shrink-0 flex items-center justify-center">
                  {(c === "paypack_mtn" || c === "momo_manual") && (
                    <MtnLogo className="h-9 max-w-[72px]" />
                  )}
                  {(c === "paypack_airtel" || c === "airtel_manual") && (
                    <AirtelLogo className="h-10 max-w-[56px]" />
                  )}
                  {c === "card_visa_mc" && (
                    <div className="flex items-center gap-1">
                      <VisaLogo className="h-4" />
                      <MastercardLogo className="h-6" />
                    </div>
                  )}
                  {c === "bank_transfer" && (
                    <Building2 className="text-primary" size={22} />
                  )}
                  {c === "apple_iap" && (
                    <CreditCard className="text-primary" size={22} />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-bold">{channelLabel(c)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {c === "paypack_mtn" || c === "paypack_airtel"
                      ? "STK prompt → webhook unlocks 30 days"
                      : c === "card_visa_mc"
                        ? "Opens secure card popup"
                        : c === "apple_iap"
                          ? "App Store subscription"
                          : "Send money, paste TxId for review"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {(channel === "paypack_mtn" || channel === "paypack_airtel") && (
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              {channel === "paypack_mtn" ? (
                <MtnLogo className="h-10" />
              ) : (
                <AirtelLogo className="h-12" />
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
              You get a prompt on this phone. Subscription activates only after
              Paypack confirms — not when you tap Pay.
            </p>
          </div>
        )}

        {channel === "card_visa_mc" && (
          <div className="glass-card p-4 space-y-3">
            {cardSummary ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {card?.brand === "mastercard" ? (
                    <MastercardLogo className="h-8" />
                  ) : (
                    <VisaLogo className="h-5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{cardSummary}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {card?.name}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => setCardModalOpen(true)}
                >
                  <Pencil size={14} /> Edit
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 gap-2"
                onClick={() => setCardModalOpen(true)}
              >
                <CreditCard size={18} /> Add Visa / Mastercard
              </Button>
            )}
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
                <div className="rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 space-y-1 text-[13px] backdrop-blur-sm">
                  <p>
                    Bank: <strong>{MERCHANT.bankName}</strong>
                  </p>
                  <p>
                    Account name: <strong>{MERCHANT.accountName}</strong>
                  </p>
                  <p>
                    Account number: <strong>{MERCHANT.accountNumber}</strong>
                  </p>
                  {MERCHANT.swift ? (
                    <p>
                      SWIFT: <strong>{MERCHANT.swift}</strong>
                    </p>
                  ) : null}
                </div>
              </>
            ) : channel === "airtel_manual" ? (
              <>
                <div className="flex items-center gap-2">
                  <AirtelLogo className="h-10" />
                  <p className="font-semibold">Airtel Money merchant</p>
                </div>
                <div className="rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 space-y-1 text-[13px] backdrop-blur-sm">
                  <p>
                    Name: <strong>{MERCHANT.airtelName}</strong>
                  </p>
                  <p>
                    Code: <strong>{MERCHANT.airtelCode}</strong>
                  </p>
                  <p>
                    Phone: <strong>{MERCHANT.airtelPhone}</strong>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <MtnLogo className="h-9" />
                  <p className="font-semibold">MTN MoMo merchant</p>
                </div>
                <div className="rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 space-y-1 text-[13px] backdrop-blur-sm">
                  <p>
                    Name: <strong>{MERCHANT.momoName}</strong>
                  </p>
                  <p>
                    Code: <strong>{MERCHANT.momoCode}</strong>
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
            {busy ? (
              <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin" />
            ) : (
              <Smartphone size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{statusMsg}</span>
          </div>
        )}

        {testModeHint && pendingPaymentId && (
          <div className="glass-card p-4 space-y-2 border border-amber-300/60">
            <p className="text-sm font-semibold text-amber-900">
              Test mode — no real money
            </p>
            <p className="text-[11px] text-muted-foreground">
              Simulates a provider webhook so we can verify 30-day activation
              while waiting for MTN/Airtel credentials.
            </p>
            <Button
              className="w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await confirmTestPayment(pendingPaymentId, "success");
                  if (r.confirmed) {
                    toast.message(r.warning || "Test activation only");
                    await finishSuccess(
                      r.current_period_end
                        ? `TEST active until ${new Date(r.current_period_end).toLocaleDateString("en-RW")}`
                        : "TEST subscription activated"
                    );
                  }
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Test confirm failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Confirm test payment (activate 30 days)
            </Button>
          </div>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-[#0b3fcc] to-[#1a6fff] text-white p-4 flex items-center justify-between shadow-lg shadow-primary/25">
          <div>
            <p className="text-xs text-white/70">
              Total · {plan === "annual" ? "365" : "30"} days access
            </p>
            <p className="text-2xl font-bold">RWF {amount.toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ShieldCheck />
            <p className="text-[10px] text-white/70">Webhook-verified</p>
          </div>
        </div>

        <Button
          className="w-full sella-btn-confirm h-12"
          disabled={busy}
          onClick={() => void pay()}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Waiting…
            </>
          ) : (
            `Pay RWF ${amount.toLocaleString()}`
          )}
        </Button>
      </main>

      <CardCheckoutModal
        open={cardModalOpen}
        initial={card}
        onClose={() => setCardModalOpen(false)}
        onConfirm={(c) => {
          setCard(c);
          setChannel("card_visa_mc");
          setCardModalOpen(false);
          toast.message("Card saved — tap Pay to charge");
        }}
      />

      {otpOpen && (
        <div className="fixed inset-0 z-[140] sella-overlay flex items-end sm:items-center justify-center p-4">
          <div className="sella-popup-glass w-full max-w-sm rounded-3xl p-5 space-y-3">
            <h2 className="font-bold text-lg relative z-10">Bank OTP</h2>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="OTP"
              className="input-glow relative z-10 font-mono tracking-widest"
              inputMode="numeric"
            />
            <div className="relative z-10 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setOtpOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void submitOtp()} disabled={busy || otp.length < 4}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {pinOpen && (
        <div className="fixed inset-0 z-[140] sella-overlay flex items-end sm:items-center justify-center p-4">
          <div className="sella-popup-glass w-full max-w-sm rounded-3xl p-5 space-y-3">
            <h2 className="font-bold text-lg relative z-10">Card PIN</h2>
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              type="password"
              className="input-glow relative z-10 font-mono tracking-[0.4em]"
              inputMode="numeric"
            />
            <div className="relative z-10 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPinOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void submitPin()} disabled={busy || pin.length < 4}>
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
