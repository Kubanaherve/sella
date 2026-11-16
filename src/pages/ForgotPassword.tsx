import { useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase, hasSupabaseConfig, isCloudMode } from "@/integrations/supabase/client";
import { normalizePhoneE164 } from "@/lib/phone";
import { isValidEmail, normalizeEmail } from "@/lib/shopIdentity";
import { toast } from "sonner";

/**
 * Self-serve PIN reset: email OTP → reset-pin Edge function.
 * Local mode: PIN lives in Dexie — user must re-register or use Change PIN while logged in.
 */
const ForgotPasswordPage = () => {
  const cloud = isCloudMode() && hasSupabaseConfig();
  const [phoneLocal, setPhoneLocal] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [busy, setBusy] = useState(false);

  const e164 = normalizePhoneE164(phoneLocal);

  const sendOtp = async () => {
    if (!cloud) {
      toast.error("PIN reset needs cloud mode. Use Account → Change PIN when signed in.");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email");
      return;
    }
    if (!e164) {
      toast.error("Enter a valid Rwanda phone");
      return;
    }
    setBusy(true);
    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("send-email-otp", {
        body: { email: normalizeEmail(email) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStep("otp");
      toast.success("Check your email for the 6-digit code");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const resetPin = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error("Enter the 6-digit email code");
      return;
    }
    if (!/^\d{4}$/.test(newPin) || newPin !== confirmPin) {
      toast.error("Enter matching 4-digit PINs");
      return;
    }
    setBusy(true);
    try {
      const sb = getSupabase();
      const emailNorm = normalizeEmail(email);
      const { data: verifyData, error: verifyErr } = await sb.functions.invoke(
        "verify-email-otp",
        { body: { email: emailNorm, otp_code: otp.trim() } }
      );
      if (verifyErr) throw verifyErr;
      if (verifyData?.error) throw new Error(verifyData.error);

      const { data, error } = await sb.functions.invoke("reset-pin", {
        body: {
          email: emailNorm,
          phone: e164,
          new_pin: newPin,
        },
      });
      if (error) {
        let detail = error.message;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const body = (await ctx.json()) as { error?: string };
            if (body?.error) detail = body.error;
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      setStep("done");
      toast.success("PIN updated — sign in with your new PIN");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen sella-hero-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm glass-card p-6 space-y-4 text-center">
        <BrandMark variant="icon" size="md" />
        <h1 className="text-lg font-bold">Forgot PIN?</h1>

        {step === "done" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Your PIN was reset. Unlock with phone + new 4-digit PIN.
            </p>
            <Link to="/" className="text-sm text-primary inline-block pt-2">
              ← Back to sign in
            </Link>
          </>
        ) : step === "otp" ? (
          <div className="space-y-3 text-left">
            <p className="text-sm text-muted-foreground text-center">
              Enter the code sent to <strong>{normalizeEmail(email)}</strong>, then choose a new
              PIN.
            </p>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Email code"
              className="input-glow h-11 text-center tracking-widest font-mono"
              inputMode="numeric"
            />
            <Input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="New PIN (4 digits)"
              className="input-glow h-11"
              inputMode="numeric"
            />
            <Input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Confirm new PIN"
              className="input-glow h-11"
              inputMode="numeric"
            />
            <Button className="w-full btn-gold h-11" disabled={busy} onClick={() => void resetPin()}>
              {busy ? "…" : "Reset PIN"}
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground w-full"
              onClick={() => void sendOtp()}
              disabled={busy}
            >
              Resend code
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-left">
            <p className="text-sm text-muted-foreground">
              We send a code to the shop email, then you set a new 4-digit PIN.
            </p>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Shop email"
              className="input-glow h-11"
            />
            <div className="flex gap-2">
              <div className="h-11 px-3 rounded-md bg-muted flex items-center text-sm font-medium">
                +250
              </div>
              <Input
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                placeholder="78xxxxxxx"
                className="input-glow h-11"
                inputMode="tel"
              />
            </div>
            <Button className="w-full btn-gold h-11" disabled={busy} onClick={() => void sendOtp()}>
              {busy ? "…" : "Send email code"}
            </Button>
          </div>
        )}

        {step !== "done" && (
          <Link to="/" className="text-sm text-primary inline-block pt-2">
            ← Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
