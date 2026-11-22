import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/integrations/supabase/client";
import { normalizePhoneE164 } from "@/lib/phone";
import { normalizeEmail } from "@/lib/shopIdentity";
import { BUSINESS_CATEGORIES } from "@/lib/businessCategories";
import { setAppUnlocked } from "@/lib/appUnlock";
import { toast } from "sonner";
import { Store, User, Phone, Mail, Lock, ArrowRight, Loader2, Check, ShieldCheck } from "lucide-react";
import { useAppLanguage } from "@/i18n/useAppLanguage";

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = useAppLanguage();
  const rw = lang === "rw";

  const preselectedPlan = searchParams.get("plan") === "pro" ? "pro" : "free";

  const { refreshProfile, setSessionFromTokens } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("general_merchandise");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!businessName.trim()) {
      setErrorMessage(rw ? "Andika izina ry'iduka cyangwa business yawe" : "Enter your shop or business name");
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage(rw ? "Andika amazina ya nyir'iduka" : "Enter the shop owner or manager's name");
      return;
    }
    const cleanPhone = normalizePhoneE164(phone) || phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage(rw ? "Andika numero ya telefoni yo mu Rwanda neza (078...)" : "Enter a valid Rwandan phone number (078...)");
      return;
    }
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      setErrorMessage(rw ? "Andika imeyili neza" : "Enter a valid email address");
      return;
    }
    if (!/^\d{4}$/.test(pin.trim())) {
      setErrorMessage(rw ? "Hitamo PIN y'imibare 4" : "Create a 4-digit numeric PIN");
      return;
    }
    if (pin.trim() !== confirmPin.trim()) {
      setErrorMessage(rw ? "PIN zombi wanditse ntizihuye" : "PIN confirmation does not match");
      return;
    }

    setLoading(true);
    try {
      const sb = getSupabase();

      // Cloud registration
      const { data, error } = await sb.functions.invoke("register-shop", {
        body: {
          business_name: businessName.trim(),
          business_category: businessCategory,
          owner_name: ownerName.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          pin: pin.trim(),
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
        throw new Error(detail || (rw ? "Kwiyandikisha ntibyakunze" : "Shop registration failed"));
      }

      if (data?.error) throw new Error(data.error);

      // Log the new user in immediately
      const loginRes = await sb.functions.invoke("pin-login", {
        body: { phone: cleanPhone, pin: pin.trim() },
      });

      if (loginRes.data?.access_token && loginRes.data?.refresh_token) {
        setAppUnlocked(true);
        await setSessionFromTokens(loginRes.data.access_token, loginRes.data.refresh_token);
        await refreshProfile();
        toast.success(rw ? "Iduka ryanditswe neza! Igerageza ry'iminsi 7 riratangiye." : "Shop registered successfully! 7-day trial activated.");
        if (preselectedPlan === "pro") {
          navigate("/billing");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      toast.success(rw ? "Konti yafunguwe! Injira." : "Account created! Please sign in.");
      navigate("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50/70 text-xs font-semibold text-[#0B3FCC] mb-1">
          <ShieldCheck size={13} />
          <span>{rw ? "Igerageza ry'iminsi 7 ku buntu" : "7-Day Free Trial Included"}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {rw ? "Fungura konti y'iduka ryawe" : "Create your shop account"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {rw
            ? "Imashini yo kugurisha ku meza, gucunga sitoki n'igitabo cy'amadeni. Nta karita isabwa."
            : "Counter POS, stock tracking, and customer credit ledger. No credit card required."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="rounded-2xl border border-slate-200 bg-white py-8 px-6 sm:px-8 space-y-6 shadow-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {rw ? "Izina ry'iduka cyangwa business" : "Shop / Business Name"}
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <Input
                    type="text"
                    placeholder="e.g. Kigali Modern Boutique"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="pl-10 h-11 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0B3FCC]"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {rw ? "Icyiciro cy'ubucuruzi" : "Business Category"}
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0B3FCC]"
                  disabled={loading}
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {rw ? "Amazina ya nyir'iduka" : "Owner / Manager Full Name"}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <Input
                  type="text"
                  placeholder="e.g. Jean Claude Mugabo"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="pl-10 h-11 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0B3FCC]"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {rw ? "Numero ya telefoni (MTN / Airtel)" : "Registered Phone (MTN/Airtel)"}
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
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {rw ? "Imeyili" : "Email Address"}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {rw ? "Hitamo PIN y'imibare 4" : "Create 4-Digit Security PIN"}
                </label>
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

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {rw ? "Ongera wandike PIN" : "Confirm 4-Digit PIN"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    className="pl-10 h-11 text-sm tracking-widest bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0B3FCC]"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <Check size={14} className="text-emerald-600" />
                <span>{rw ? "Igerageza ry'iminsi 7 ryose ririmo" : "Instant 7-Day Free Trial included"}</span>
              </div>
              <p>
                {rw
                  ? "Ushobora kongera ifatabuguzi ry'iduka igihe icyo aricyo cyose ukoresheje MTN MoMo kuri web."
                  : "You can upgrade to Normal or Pro anytime via MTN Mobile Money in the Web Billing Hub."}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0B3FCC] hover:bg-[#0932A3] text-white font-semibold rounded-xl text-sm transition-colors shadow-xs"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>{rw ? "Iduka ririmo kwandikwa..." : "Registering shop…"}</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>{rw ? "Fungura konti & Tangira igerageza" : "Create Account & Start Trial"}</span>
                  <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-600">
            {rw ? "Usanzwe ufite konti?" : "Already have an account?"}{" "}
            <Link to="/login" className="font-semibold text-[#0B3FCC] hover:underline">
              {rw ? "Injira hano" : "Sign in"}
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          {rw ? "Ufunguye konti, wemera " : "By creating an account, you agree to Sella's "}
          <Link to="/terms" className="text-slate-700 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-slate-700 underline">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
