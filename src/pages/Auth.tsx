import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labels } from "@/lib/kinyarwanda";
import { toast } from "sonner";
import { Phone, Lock, Plus, X, Mail, Copy, CheckCircle2, Store } from "lucide-react";
import { PinDialPad } from "@/components/PinDialPad";
import { BrandMark } from "@/components/BrandMark";
import { getSessionProfile, loginLocal, signupLocal, isShopNameAvailableLocal } from "@/db/api";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND } from "@/lib/brand";
import { normalizePhoneE164 } from "@/lib/phone";
import { getSupabase, hasSupabaseConfig, isCloudMode } from "@/integrations/supabase/client";
import { isValidEmail, normalizeEmail } from "@/lib/shopIdentity";
import {
  type RememberedAccount,
  loadRememberedAccounts,
  saveRememberedAccount,
  removeRememberedAccount,
  getPreferredAccount,
  setLastAccountPhone,
} from "@/lib/rememberedAccounts";
import { clearAppUnlock, isAppUnlocked, setAppUnlocked } from "@/lib/appUnlock";
import { getAppLanguage, setAppLanguage } from "@/lib/appLanguage";

const PIN_LENGTH = 4;

type Step = "home" | "register" | "confirm" | "phone_login" | "pin" | "picker";

interface ConfirmData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  shopCode: string;
  emailSent: boolean;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const { refreshProfile, setSessionFromTokens, mode } = useAuth();
  const cloud = mode === "cloud" || (isCloudMode() && hasSupabaseConfig());

  const [step, setStep] = useState<Step>("home");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [confirmData, setConfirmData] = useState<ConfirmData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [lang, setLang] = useState<"rw" | "en">(() => getAppLanguage());
  const [rememberedAccounts, setRememberedAccounts] = useState<RememberedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<RememberedAccount | null>(null);
  const [pinResetToken, setPinResetToken] = useState(0);
  const [pinError, setPinError] = useState<string | null>(null);

  const t = (rw: string, en: string) => (lang === "rw" ? rw : en);
  const e164 = normalizePhoneE164(phoneLocal);

  const goToRememberedPin = useCallback((accounts: RememberedAccount[]) => {
    const preferred = getPreferredAccount(accounts);
    if (preferred) {
      setSelectedAccount(preferred);
      setStep("pin");
      return;
    }
    if (accounts.length > 0) {
      setStep("picker");
      return;
    }
    setStep("home");
  }, []);

  useEffect(() => {
    const accounts = loadRememberedAccounts();
    setRememberedAccounts(accounts);

    (async () => {
      try {
        // Already unlocked in this app session → continue into the app
        if (isAppUnlocked()) {
          if (cloud) {
            const sb = getSupabase();
            const { data } = await sb.auth.getSession();
            if (data.session) {
              await refreshProfile();
              navigate("/dashboard");
              return;
            }
          } else {
            const profile = await getSessionProfile();
            if (profile) {
              await refreshProfile();
              navigate("/dashboard");
              return;
            }
          }
        }

        // Fresh open / locked: drop silent sessions so PIN is always required
        clearAppUnlock();
        if (cloud) {
          try {
            const sb = getSupabase();
            await sb.auth.signOut({ scope: "local" });
          } catch {
            /* ignore */
          }
        } else {
          const { logoutLocal } = await import("@/db/api");
          await logoutLocal();
        }
        await refreshProfile();
        goToRememberedPin(accounts);
      } finally {
        setIsCheckingAuth(false);
      }
    })();
  }, [navigate, refreshProfile, cloud, goToRememberedPin]);

  const persistAccount = (account: RememberedAccount) => {
    const updated = saveRememberedAccount(account);
    setRememberedAccounts(updated);
  };

  const removeAccount = (phoneNum: string) => {
    const updated = removeRememberedAccount(phoneNum);
    setRememberedAccounts(updated);
    if (updated.length === 0) {
      setSelectedAccount(null);
      setStep("home");
    } else if (selectedAccount?.phone === phoneNum) {
      goToRememberedPin(updated);
    }
  };

  const checkShopName = async (name: string): Promise<"ok" | "taken" | "idle"> => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameStatus("idle");
      return "idle";
    }
    setNameStatus("checking");
    try {
      if (!cloud) {
        const available = await isShopNameAvailableLocal(trimmed);
        const status = available ? "ok" : "taken";
        setNameStatus(status);
        return status;
      }
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("check-shop-name", {
        body: { business_name: trimmed },
      });
      if (error) throw error;
      const status = data?.available ? "ok" : "taken";
      setNameStatus(status);
      return status;
    } catch {
      setNameStatus("idle");
      toast.error(
        t("Ntibashoboye kugenzura izina — ongera ugerageze", "Could not check shop name — try again")
      );
      return "idle";
    }
  };

  const registerShop = async () => {
    if (!businessName.trim()) {
      toast.error(t("Andika izina ry'ubucuruzi", "Enter shop name"));
      return;
    }
    const availability = await checkShopName(businessName);
    if (availability === "taken") {
      toast.error(t("Iri zina ryarafashwe — hitamo irindi", "This shop name is taken — choose another"));
      return;
    }
    if (availability !== "ok") {
      toast.error(t("Gerageza izina ry'ubucuruzi nanone", "Please verify the shop name again"));
      return;
    }
    if (!ownerName.trim()) {
      toast.error(t("Andika izina ryawe", "Enter your name"));
      return;
    }
    if (!isValidEmail(email)) {
      toast.error(t("Andika email neza", "Enter a valid email"));
      return;
    }
    if (!e164 || e164.length < 12) {
      toast.error(t("Andika numero neza", "Enter a valid phone"));
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error(t("PIN igomba kuba imibare 4", "PIN must be 4 digits"));
      return;
    }
    if (pin !== confirmPin) {
      toast.error(t("PIN ntihura", "PINs do not match"));
      return;
    }

    setIsLoading(true);
    try {
      if (!cloud) {
        const result = await signupLocal({
          phone: phoneLocal,
          displayName: ownerName.trim(),
          pin,
          businessName: businessName.trim(),
          email: normalizeEmail(email),
        });
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        const shopCode = result.profile.shop_code || "LOCAL";
        persistAccount({
          phone: result.profile.phone_normalized,
          displayName: ownerName.trim(),
          pinLength: PIN_LENGTH,
          shopName: businessName.trim(),
          shopCode,
          email: normalizeEmail(email),
        });
        setConfirmData({
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          email: normalizeEmail(email),
          phone: result.profile.phone_normalized,
          shopCode,
          emailSent: false,
        });
        setAppUnlocked(true);
        setStep("confirm");
        await refreshProfile();
        return;
      }

      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("register-shop", {
        body: {
          business_name: businessName.trim(),
          owner_name: ownerName.trim(),
          email: normalizeEmail(email),
          phone: e164,
          pin,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.access_token || !data?.refresh_token) throw new Error("No session");

      setAppUnlocked(true);
      await setSessionFromTokens(data.access_token, data.refresh_token);
      await refreshProfile();
      const shopCode = String(data.shop_code || data.profile?.shop_code || "");
      persistAccount({
        phone: e164,
        displayName: ownerName.trim(),
        pinLength: PIN_LENGTH,
        shopCode,
        shopName: businessName.trim(),
        email: normalizeEmail(email),
      });
      setConfirmData({
        businessName: data.business_name || businessName.trim(),
        ownerName: data.owner_name || ownerName.trim(),
        email: data.email || normalizeEmail(email),
        phone: data.phone || e164,
        shopCode,
        emailSent: Boolean(data.welcome_email_sent),
      });
      setStep("confirm");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPin = async (enteredPin: string) => {
    const phone = selectedAccount?.phone || e164;
    if (!phone) {
      toast.error(t("Andika numero", "Enter phone number"));
      return;
    }
    setIsLoading(true);
    setPinError(null);
    try {
      if (!cloud) {
        const result = await loginLocal({ phone, pin: enteredPin });
        if ("error" in result) {
          setPinError(result.error || labels.invalidPin);
          setPinResetToken((n) => n + 1);
          setIsLoading(false);
          return;
        }
        setAppUnlocked(true);
        setLastAccountPhone(result.profile.phone_normalized);
        persistAccount({
          phone: result.profile.phone_normalized,
          displayName: result.profile.display_name || selectedAccount?.displayName || phone,
          pinLength: PIN_LENGTH,
          shopName: result.profile.business_name || selectedAccount?.shopName,
          shopCode: result.profile.shop_code || selectedAccount?.shopCode,
          email: result.profile.email || selectedAccount?.email,
        });
        await refreshProfile();
        navigate("/dashboard");
        return;
      }

      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("pin-login", {
        body: { phone: normalizePhoneE164(phone) || phone, pin: enteredPin },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.access_token || !data?.refresh_token) throw new Error("No session");
      setAppUnlocked(true);
      await setSessionFromTokens(data.access_token, data.refresh_token);
      await refreshProfile();
      const prof = data.profile;
      persistAccount({
        phone: normalizePhoneE164(phone) || phone,
        displayName: prof?.owner_name || selectedAccount?.displayName || phone,
        pinLength: PIN_LENGTH,
        shopCode: prof?.shop_code || selectedAccount?.shopCode,
        shopName: prof?.business_name || selectedAccount?.shopName,
        email: prof?.email || selectedAccount?.email,
      });
      toast.success(t("Murakaza neza!", "Welcome back!"));
      navigate("/dashboard");
    } catch (e) {
      const msg = e instanceof Error ? e.message : labels.invalidPin;
      setPinError(msg);
      setPinResetToken((n) => n + 1);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen sella-hero-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6FFF]/25 border-t-[#1A6FFF] rounded-full animate-spin" />
      </div>
    );
  }

  if (step === "confirm" && confirmData) {
    return (
      <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
        <BrandMark variant="icon" size="lg" float />
        <div className="mt-4 w-12 h-12 rounded-full bg-emerald-400/20 flex items-center justify-center">
          <CheckCircle2 className="text-emerald-300" size={28} />
        </div>
        <h1 className="text-[#0B3FCC] text-xl font-bold mt-3 text-center">
          {t("Murakoze gukoresha Sella!", "Thank you for using Sella!")}
        </h1>
        <p className="text-slate-600 text-sm mt-1 text-center">
          {t("Shop yawe iretse — urabona amakuru aha:", "Your shop is ready — here are your details:")}
        </p>

        <div className="w-full max-w-sm glass-card mt-6 space-y-3 text-sm">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Shop</p>
            <p className="font-semibold">{confirmData.businessName}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
            <p className="font-semibold break-all">{confirmData.email}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {t("Telefone", "Phone")}
            </p>
            <p className="font-semibold">{confirmData.phone}</p>
          </div>
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Shop code
            </p>
            <p className="text-2xl font-bold tracking-widest text-primary">{confirmData.shopCode}</p>
            <button
              type="button"
              className="mt-2 text-xs text-primary inline-flex items-center gap-1"
              onClick={async () => {
                await navigator.clipboard.writeText(confirmData.shopCode);
                toast.success(t("Byakopowe", "Copied"));
              }}
            >
              <Copy size={12} /> {t("Kopora code", "Copy code")}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            {confirmData.emailSent
              ? t(
                  "Twakoherereje aya makuru kuri email yawe.",
                  "We sent these details to your email."
                )
              : t(
                  "Bika shop code yawe. Email izoherezwa iyo serivisi yabonetse.",
                  "Save your shop code. Email sends when mail service is configured."
                )}
          </p>
        </div>

        <p className="text-slate-500 text-xs mt-4 text-center max-w-xs">
          {t(
            "Ubundi ubwo uzinjira: PIN ya imibare 4 gusa — nta numero buri munsi.",
            "Next time: just dial your 4-digit PIN — your shop is remembered."
          )}
        </p>

        <Button
          className="btn-gold w-full max-w-sm mt-6 h-12"
          onClick={() => {
            setAppUnlocked(true);
            navigate("/dashboard");
          }}
        >
          {t("Tangira gukoresha", "Start using Sella")}
        </Button>
      </div>
    );
  }

  if (step === "pin" && selectedAccount) {
    return (
      <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
        <BrandMark variant="icon" size="xl" float />
        {selectedAccount.shopName && (
          <p className="text-[#0B3FCC] text-lg font-semibold mt-4 tracking-tight">
            {selectedAccount.shopName}
          </p>
        )}
        {selectedAccount.shopCode && (
          <p className="text-slate-400 text-[11px] tracking-[0.2em] mt-0.5">
            {selectedAccount.shopCode}
          </p>
        )}
        <div className="mt-8 w-full max-w-sm flex justify-center">
          <PinDialPad
            onComplete={loginWithPin}
            isLoading={isLoading}
            displayName={selectedAccount.displayName}
            pinLength={PIN_LENGTH}
            resetToken={pinResetToken}
            errorMessage={pinError}
          />
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          {rememberedAccounts.length > 1 && (
            <button
              type="button"
              className="text-slate-500 text-sm"
              onClick={() => {
                setSelectedAccount(null);
                setPinError(null);
                setStep("picker");
              }}
            >
              {t("Hindura shop", "Switch shop")}
            </button>
          )}
          <button
            type="button"
            className="text-slate-400 text-xs"
            onClick={() => {
              setSelectedAccount(null);
              setPinError(null);
              setStep("home");
            }}
          >
            {t("Konti nshya / andi numero", "New shop / other phone")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "phone_login") {
    return (
      <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom),var(--sella-safe-bottom-floor))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
        <BrandMark variant="icon" size="lg" float />
        <h1 className="text-[#0B3FCC] text-lg font-bold mt-4">
          {t("Injira na telefone + PIN", "Sign in with phone + PIN")}
        </h1>
        <div className="w-full max-w-sm glass-card mt-6 space-y-3">
          <div className="flex gap-2">
            <div className="h-11 px-3 rounded-md bg-muted flex items-center text-sm font-medium">+250</div>
            <Input
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
              placeholder="78xxxxxxx"
              className="input-glow h-11"
              inputMode="tel"
            />
          </div>
          <Button
            className="w-full btn-gold h-11"
            disabled={!phoneLocal || isLoading}
            onClick={() => {
              if (!e164) return toast.error(t("Numero ntiyemewe", "Invalid phone"));
              setSelectedAccount({
                phone: e164,
                displayName: phoneLocal,
                pinLength: PIN_LENGTH,
              });
              setPinError(null);
              setStep("pin");
            }}
          >
            {t("Komeza kuri PIN", "Continue to PIN")}
          </Button>
        </div>
        <button type="button" className="mt-6 text-slate-500 text-sm" onClick={() => setStep("home")}>
          ← {t("Subira", "Back")}
        </button>
      </div>
    );
  }

  if (step === "picker" && rememberedAccounts.length > 0) {
    return (
      <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom),var(--sella-safe-bottom-floor))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
        <BrandMark variant="icon" size="xl" float />
        <p className="text-slate-600 text-sm mt-4 mb-2">
          {t("Hitamo shop yawe — injiza PIN ya 4", "Choose your shop — enter 4-digit PIN")}
        </p>
        <div className="w-full max-w-sm space-y-3 mt-4">
          {rememberedAccounts.map((account) => (
            <div key={account.phone} className="relative group">
              <button
                type="button"
                onClick={() => {
                  setSelectedAccount(account);
                  setLastAccountPhone(account.phone);
                  setPinError(null);
                  setStep("pin");
                }}
                className="w-full glass-card p-4 flex items-center gap-4 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B3FCC] to-[#5AC8FA] flex items-center justify-center text-lg font-bold text-white">
                  {(account.shopName || account.displayName).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{account.shopName || account.displayName}</p>
                  <p className="text-xs text-muted-foreground">{account.phone}</p>
                  {account.shopCode && (
                    <p className="text-[10px] text-primary font-medium tracking-wider">
                      {account.shopCode}
                    </p>
                  )}
                </div>
              </button>
              <button
                type="button"
                className="absolute top-2 right-2 p-2 text-muted-foreground opacity-0 group-hover:opacity-100"
                onClick={() => removeAccount(account.phone)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setStep("register")}
            className="w-full glass-card p-4 flex items-center gap-4 border-dashed"
          >
            <div className="w-12 h-12 rounded-full bg-white/80 border border-[#1A6FFF]/20 flex items-center justify-center">
              <Plus size={22} className="text-[#0B3FCC]/70" />
            </div>
            <p className="font-medium">{t("Andikisha shop nshya", "Register new shop")}</p>
          </button>
          <button
            type="button"
            className="w-full text-sm text-slate-600 underline"
            onClick={() => setStep("phone_login")}
          >
            {t("Injira na numero yindi", "Sign in with another phone")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "register") {
    return (
      <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
        <div className="absolute right-4 flex gap-2 top-[max(1rem,calc(max(var(--sella-safe-top-floor),env(safe-area-inset-top,0px))+0.35rem))]">
          <button
            type="button"
            className={`text-xs px-2 py-1 rounded ${lang === "rw" ? "bg-white text-primary" : "text-slate-600"}`}
            onClick={() => {
              setAppLanguage("rw");
              setLang("rw");
            }}
          >
            RW
          </button>
          <button
            type="button"
            className={`text-xs px-2 py-1 rounded ${lang === "en" ? "bg-white text-primary" : "text-slate-600"}`}
            onClick={() => {
              setAppLanguage("en");
              setLang("en");
            }}
          >
            EN
          </button>
        </div>

        <BrandMark variant="icon" size="lg" float />
        <h1 className="text-[#0B3FCC] text-lg font-bold mt-3">
          {t("Andikisha shop yawe", "Register your shop")}
        </h1>

        <div className="w-full max-w-sm glass-card mt-5 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              <Store size={12} className="inline mr-1" />
              {t("Izina ry'ubucuruzi *", "Shop name *")}
            </label>
            <Input
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                setNameStatus("idle");
              }}
              onBlur={() => checkShopName(businessName)}
              placeholder="e.g. Jeanne Friend Jewelry"
              className="input-glow h-11"
            />
            {nameStatus === "checking" && (
              <p className="text-[10px] text-muted-foreground mt-1">{t("Turareba...", "Checking...")}</p>
            )}
            {nameStatus === "ok" && (
              <p className="text-[10px] text-emerald-600 mt-1">
                {t("Izina rirabona — urashobora kukoresha", "Name available")}
              </p>
            )}
            {nameStatus === "taken" && (
              <p className="text-[10px] text-destructive mt-1">
                {t("Iri zina ryarafashwe — hitamo irindi", "Name already taken — choose another")}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {t("Izina ryawe *", "Your name *")}
            </label>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="input-glow h-11"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              <Mail size={12} className="inline mr-1" />
              Email *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="input-glow h-11"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {t(
                "Tuzakohereza shop code n'amakuru kuri iyi email",
                "We'll email your shop code & details here"
              )}
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              <Phone size={12} className="inline mr-1" />
              {t("Telefone *", "Phone *")}
            </label>
            <div className="flex gap-2">
              <div className="h-11 px-3 rounded-md bg-muted flex items-center text-sm font-medium">+250</div>
              <Input
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                placeholder="78xxxxxxx"
                className="input-glow h-11"
                inputMode="tel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                <Lock size={12} className="inline mr-1" />
                PIN (4)
              </label>
              <Input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="input-glow h-11"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {t("Emeza PIN", "Confirm PIN")}
              </label>
              <Input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="input-glow h-11"
                placeholder="••••"
              />
            </div>
          </div>

          <Button
            className="w-full btn-gold h-12"
            disabled={isLoading || nameStatus === "taken"}
            onClick={registerShop}
          >
            {isLoading ? "..." : t("Kora konti", "Create shop account")}
          </Button>
        </div>

        <button type="button" className="mt-6 text-slate-500 text-sm" onClick={() => setStep("home")}>
          ← {t("Subira", "Back")}
        </button>
        <p className="text-slate-400 text-[11px] mt-4">
          <Link to="/terms" className="underline">
            Terms
          </Link>{" "}
          ·{" "}
          <Link to="/privacy" className="underline">
            Privacy
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
      <div className="absolute right-4 flex gap-2 top-[max(1rem,calc(max(var(--sella-safe-top-floor),env(safe-area-inset-top,0px))+0.35rem))]">
        <button
          type="button"
          className={`text-xs px-2 py-1 rounded ${lang === "rw" ? "bg-white text-primary" : "text-slate-600"}`}
          onClick={() => {
            setAppLanguage("rw");
            setLang("rw");
          }}
        >
          RW
        </button>
        <button
          type="button"
          className={`text-xs px-2 py-1 rounded ${lang === "en" ? "bg-white text-primary" : "text-slate-600"}`}
          onClick={() => {
            setAppLanguage("en");
            setLang("en");
          }}
        >
          EN
        </button>
      </div>

      <BrandMark variant="logo" size="hero" float />
      <p className="text-[#0B3FCC]/80 text-sm mt-3 mb-8 text-center max-w-xs">{BRAND.taglineRw}</p>

      <div className="w-full max-w-sm space-y-3">
        {rememberedAccounts.length > 0 && (
          <Button
            className="w-full btn-gold h-12 text-base"
            onClick={() => goToRememberedPin(rememberedAccounts)}
          >
            {t("Fungura na PIN", "Unlock with PIN")}
          </Button>
        )}
        <Button
          className={`w-full h-12 text-base ${rememberedAccounts.length ? "bg-white/70 border border-[#1A6FFF]/25 text-[#0B3FCC] hover:bg-white/90 backdrop-blur" : "btn-gold"}`}
          variant={rememberedAccounts.length ? "outline" : "default"}
          onClick={() => setStep("register")}
        >
          {t("Andikisha shop nshya", "Register new shop")}
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 bg-white/70 border-[#1A6FFF]/25 text-[#0B3FCC] hover:bg-white/90 backdrop-blur"
          onClick={() => setStep(rememberedAccounts.length ? "picker" : "phone_login")}
        >
          {t("Injira (telefone + PIN 4)", "Sign in (phone + 4-digit PIN)")}
        </Button>
      </div>

      <p className="text-slate-500 text-[11px] mt-8 text-center max-w-sm">
        {t(
          "Ubundi ubwo: PIN ya imibare 4 gusa — shop yawe iribukwa.",
          "Next visits: 4-digit PIN only — your shop is remembered."
        )}
      </p>
    </div>
  );
};

export default AuthPage;
