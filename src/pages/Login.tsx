import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/integrations/supabase/client";
import { normalizePhoneE164 } from "@/lib/phone";
import { normalizeEmail } from "@/lib/shopIdentity";
import { setAppUnlocked } from "@/lib/appUnlock";
import { toast } from "sonner";
import { Lock, Phone, Mail, ArrowRight, Loader2, Store, ShieldCheck } from "lucide-react";
import { safeReturnPath } from "@/lib/checkoutIntent";
import { useAppLanguage } from "@/i18n/useAppLanguage";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = useAppLanguage();
  const rw = lang === "rw";

  const { setSessionFromTokens, refreshProfile } = useAuth();
  const afterSignIn = () => navigate(safeReturnPath(searchParams.get("next")) || "/dashboard");

  const [authMethod, setAuthMethod] = useState<"phone_pin" | "email">("phone_pin");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePhonePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanPhone = normalizePhoneE164(phone) || phone.trim();
    const cleanPin = pin.trim();

    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage(
        rw ? "Andika nimero ya telefoni neza (urugero: 0788123456)" : "Enter a valid phone number (e.g., 0788123456)"
      );
      return;
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      setErrorMessage(rw ? "Andika PIN yawe y'imibare 4" : "Enter your 4-digit PIN");
      return;
    }

    setLoading(true);
    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("pin-login", {
        body: { phone: cleanPhone, pin: cleanPin },
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
        throw new Error(detail || (rw ? "Kwinjira ntibyakunze" : "Sign in failed"));
      }

      if (data?.error) throw new Error(data.error);

      if (!data?.access_token || !data?.refresh_token) {
        throw new Error(rw ? "Seriveri ntiyatanze uburenganzira bwo kwinjira" : "Invalid authentication token received");
      }

      setAppUnlocked(true);
      await setSessionFromTokens(data.access_token, data.refresh_token);
      await refreshProfile();
      toast.success(rw ? "Mwinjiye muri shop neza!" : "Signed in successfully");
      afterSignIn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      setErrorMessage(rw ? "Andika imeyili neza" : "Enter a valid email address");
      return;
    }
    if (!password) {
      setErrorMessage(rw ? "Andika umubare w'ibanga" : "Enter your password");
      return;
    }

    setLoading(true);
    try {
      const sb = getSupabase();
      const { data, error } = await sb.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;
      if (!data.session) throw new Error(rw ? "Ntibyakunze kwinjira" : "No active session created");

      setAppUnlocked(true);
      await refreshProfile();
      toast.success(rw ? "Mwinjiye neza!" : "Signed in successfully");
      afterSignIn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#0B3FCC] selection:text-white font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2 mb-2" aria-label="Sella">
          <BrandMark variant="icon" size="sm" framed={false} />
          <span className="text-2xl font-bold tracking-tight text-slate-900">Sella</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {rw ? "Injira muri shop yawe" : "Sign in to your shop"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {rw
            ? "Koresha nimero ya telefoni na PIN y'imibare 4 ukoresha no kuri telefoni"
            : "Use the same phone and 4-digit PIN you use on mobile"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-2xl border border-slate-200 bg-white py-8 px-6 sm:px-8 space-y-6 shadow-xs">
          {/* Method Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone_pin");
                setErrorMessage("");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === "phone_pin"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {rw ? "Telefoni & PIN (4)" : "Phone & 4-Digit PIN"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email");
                setErrorMessage("");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === "email"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {rw ? "Imeyili & Password" : "Email & Password"}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {authMethod === "phone_pin" ? (
            <form onSubmit={handlePhonePinLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {rw ? "Nimero ya telefoni yanditse kuri shop" : "Registered Phone Number"}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <Input
                    type="tel"
                    placeholder="0788123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-11 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0B3FCC]"
                    disabled={loading}
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  MTN cyangwa Airtel (Rwanda)
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    {rw ? "PIN y'imibare 4" : "4-Digit Security PIN"}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#0B3FCC] hover:underline"
                  >
                    {rw ? "Wibagiwe PIN?" : "Forgot PIN?"}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="pl-10 h-11 text-sm tracking-widest bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0B3FCC]"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0B3FCC] hover:bg-[#0932A3] text-white font-semibold rounded-xl text-sm transition-colors shadow-xs"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>{rw ? "Birimo kwinjira..." : "Signing in…"}</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>{rw ? "Injira muri shop" : "Sign in to shop"}</span>
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {rw ? "Imeyili ya shop" : "Shop Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <Input
                    type="email"
                    placeholder="shop@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0B3FCC]"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    {rw ? "Umubare w'ibanga" : "Password"}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#0B3FCC] hover:underline"
                  >
                    {rw ? "Wibagiwe umubare w'ibanga?" : "Forgot password?"}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0B3FCC]"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0B3FCC] hover:bg-[#0932A3] text-white font-semibold rounded-xl text-sm transition-colors shadow-xs"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>{rw ? "Birimo kwinjira..." : "Signing in…"}</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>{rw ? "Injira muri shop" : "Sign in to shop"}</span>
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-600">
            {rw ? "Nta konti y'iduka uragira?" : "Don't have a shop account?"}{" "}
            <Link to="/signup" className="font-semibold text-[#0B3FCC] hover:underline">
              {rw ? "Fungura iduka (Iminsi 7 ku buntu)" : "Start 7-day free trial"}
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-800 transition-colors">
            ← {rw ? "Subira ku rubuga rwa Sella" : "Back to Sella Homepage"}
          </Link>
        </div>
      </div>
    </div>
  );
}
