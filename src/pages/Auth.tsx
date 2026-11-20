import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labels } from "@/lib/kinyarwanda";
import { toast } from "sonner";
import { Phone, Lock, Plus, X, Mail, Copy, CheckCircle2, Store, List, Package, TrendingUp } from "lucide-react";
import { PinDialPad } from "@/components/PinDialPad";
import { BrandMark } from "@/components/BrandMark";
import { getSessionProfile, loginLocal, signupLocal, isShopNameAvailableLocal } from "@/db/api";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND } from "@/lib/brand";
import { normalizePhoneE164 } from "@/lib/phone";
import { getSupabase, hasSupabaseConfig, isCloudMode } from "@/integrations/supabase/client";
import { isValidEmail, normalizeEmail } from "@/lib/shopIdentity";
import { BUSINESS_CATEGORIES } from "@/lib/businessCategories";
import {
  type RememberedAccount,
  loadRememberedAccounts,
  saveRememberedAccount,
  removeRememberedAccount,
  getPreferredAccount,
  setLastAccountPhone,
  accountForPhoneLogin,
  personName,
} from "@/lib/rememberedAccounts";
import { clearAppUnlock, isAppUnlocked, setAppUnlocked } from "@/lib/appUnlock";
import { getAppLanguage, setAppLanguage } from "@/lib/appLanguage";
import {
  findShopByCode,
  staffRegisterOrSetPin,
  staffLoginWithPin,
  normalizeShopCode,
  type ShopInfo,
} from "@/lib/staff";
import { setCashierModeActive } from "@/lib/cashierMode";
import { planCashierSession } from "@/lib/cashierSession";
import { UserCheck, Users } from "lucide-react";

const PIN_LENGTH = 4;

type Step =
  | "home"
  | "register"
  | "email_otp"
  | "confirm"
  | "phone_login"
  | "pin"
  | "picker"
  | "cashier_shop_code"
  | "cashier_set_pin"
  | "cashier_confirm_pin";

interface ConfirmData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  shopCode: string;
  emailSent: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const AuthPage = () => {
  const navigate = useNavigate();
  const { refreshProfile, setSessionFromTokens, mode } = useAuth();
  const cloud = mode === "cloud" || (isCloudMode() && hasSupabaseConfig());

  const [step, setStep] = useState<Step>("home");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("general_merchandise");
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
  const [pinRetryAfter, setPinRetryAfter] = useState(0);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [cashierShopCode, setCashierShopCode] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [cashierPhone, setCashierPhone] = useState("");
  const [verifiedShop, setVerifiedShop] = useState<ShopInfo | null>(null);
  const [cashierFirstPin, setCashierFirstPin] = useState("");

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
    if (pinRetryAfter <= 0) return;
    const t = window.setTimeout(() => setPinRetryAfter((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [pinRetryAfter]);

  useEffect(() => {
    const accounts = loadRememberedAccounts();
    setRememberedAccounts(accounts);

    (async () => {
      try {
        // Already unlocked in this app session → continue into the app
        if (isAppUnlocked()) {
          if (cloud) {
            const sb = getSupabase();
            const { data } = await withTimeout(sb.auth.getSession(), 4000);
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
            await withTimeout(sb.auth.signOut({ scope: "local" }), 4000);
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
          businessCategory,
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

      // Cloud: send email OTP first — register-shop refuses unverified email
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("send-email-otp", {
        body: { email: normalizeEmail(email) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEmailOtp("");
      setEmailOtpSent(true);
      setStep("email_otp");
      toast.success(
        t("Twakoherereje code kuri email yawe", "We sent a 6-digit code to your email")
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const completeCloudRegister = async () => {
    if (!/^\d{6}$/.test(emailOtp.trim())) {
      toast.error(t("Andika code y'imibare 6", "Enter the 6-digit email code"));
      return;
    }
    setIsLoading(true);
    try {
      const sb = getSupabase();
      const emailNorm = normalizeEmail(email);
      const { data: verifyData, error: verifyErr } = await sb.functions.invoke(
        "verify-email-otp",
        { body: { email: emailNorm, otp_code: emailOtp.trim() } }
      );
      if (verifyErr) throw verifyErr;
      if (verifyData?.error) throw new Error(verifyData.error);

      const { data, error } = await sb.functions.invoke("register-shop", {
        body: {
          business_name: businessName.trim(),
          business_category: businessCategory,
          owner_name: ownerName.trim(),
          email: emailNorm,
          phone: e164,
          pin,
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
      if (!data?.access_token || !data?.refresh_token) throw new Error("No session");

      setAppUnlocked(true);
      await setSessionFromTokens(data.access_token, data.refresh_token);
      await refreshProfile();
      const shopCode = String(data.shop_code || data.profile?.shop_code || "");
      persistAccount({
        phone: e164!,
        displayName: ownerName.trim(),
        pinLength: PIN_LENGTH,
        shopCode,
        shopName: businessName.trim(),
        email: emailNorm,
      });
      setConfirmData({
        businessName: data.business_name || businessName.trim(),
        ownerName: data.owner_name || ownerName.trim(),
        email: data.email || emailNorm,
        phone: data.phone || e164!,
        shopCode,
        emailSent: Boolean(data.welcome_email_sent),
      });
      setStep("confirm");
      toast.success(t("Shop yaremwe!", "Shop created!"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPin = async (enteredPin: string) => {
    if (isLoading) return;
    const phone = selectedAccount?.phone || e164;
    if (!phone) {
      toast.error(t("Andika numero", "Enter phone number"));
      return;
    }
    setIsLoading(true);
    setPinError(null);
    try {
      // Returning cashier account
      if (selectedAccount?.isStaff || selectedAccount?.role === "cashier") {
        if (!selectedAccount.shopCode) {
          throw new Error("Shop Code ntibonetse kuri iyi konti");
        }
        const { access_token, refresh_token } = await withTimeout(
          staffLoginWithPin({
            shopCode: selectedAccount.shopCode,
            phone,
            pin: enteredPin,
          }),
          12000
        );
        const sessionPlan = planCashierSession({ access_token, refresh_token });
        if (sessionPlan === "apply-staff-session") {
          await setSessionFromTokens(access_token, refresh_token);
        } else if (cloud) {
          const sb = getSupabase();
          await withTimeout(sb.auth.signOut({ scope: "local" }), 4000);
        }
        setCashierModeActive(true);
        setAppUnlocked(true);
        toast.success(
          t(
            `Murakaza neza, ${selectedAccount.displayName}!`,
            `Welcome back, ${selectedAccount.displayName}!`
          )
        );
        navigate("/new-sale");
        return;
      }
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
          displayName: personName(
            result.profile.display_name,
            selectedAccount?.displayName,
            result.profile.business_name
          ),
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
      const { data, error } = await withTimeout(
        sb.functions.invoke("pin-login", {
          body: { phone: normalizePhoneE164(phone) || phone, pin: enteredPin },
        }),
        12000
      );
      if (error) {
        // Prefer server JSON error over opaque "non-2xx" FunctionsHttpError
        let detail = error.message;
        let retryAfter = 0;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const body = (await ctx.json()) as {
              error?: string;
              retry_after_seconds?: number;
            };
            if (body?.error) detail = body.error;
            if (body?.retry_after_seconds) retryAfter = Number(body.retry_after_seconds) || 0;
          }
        } catch {
          /* ignore parse failures */
        }
        if (retryAfter > 0) setPinRetryAfter(retryAfter);
        const err = new Error(detail) as Error & { retryAfter?: number };
        err.retryAfter = retryAfter;
        throw err;
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.access_token || !data?.refresh_token) throw new Error("No session");
      setPinRetryAfter(0);
      setAppUnlocked(true);
      await setSessionFromTokens(data.access_token, data.refresh_token);
      await refreshProfile();
      const prof = data.profile;
      persistAccount({
        phone: normalizePhoneE164(phone) || phone,
        displayName: personName(
          prof?.owner_name,
          selectedAccount?.displayName,
          prof?.business_name
        ),
        pinLength: PIN_LENGTH,
        shopCode: prof?.shop_code || selectedAccount?.shopCode,
        shopName: prof?.business_name || selectedAccount?.shopName,
        email: prof?.email || selectedAccount?.email,
      });
      toast.success(t("Murakaza neza!", "Welcome back!"));
      navigate("/dashboard");
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const retryFromErr =
        e && typeof e === "object" && "retryAfter" in e
          ? Number((e as { retryAfter?: number }).retryAfter) || 0
          : 0;
      let msg = labels.invalidPin;
      if (/too many|retry later|lock/i.test(raw)) {
        const secs = retryFromErr || pinRetryAfter || 900;
        if (secs > 0) setPinRetryAfter(secs);
        const mins = Math.ceil(secs / 60);
        msg = t(
          `Wagerageje PIN inshuro nyinshi. Tegereza ~${mins} min.`,
          `Too many PIN attempts. Wait ~${mins} min.`
        );
      } else if (/temporarily unavailable|try again shortly/i.test(raw)) {
        msg = t(
          "Seriveri ntiboneka cyaguye. Gerageza nanone vuba.",
          "Login temporarily unavailable. Try again shortly."
        );
      } else if (/invalid|wrong|incorrect|pin/i.test(raw)) {
        msg = labels.invalidPin;
      } else if (/network|fetch|Failed to fetch|timeout/i.test(raw)) {
        msg = t(
          "Nta interineti / seriveri ntiboneka. Gerageza nanone.",
          "Network or server unavailable. Try again."
        );
      } else if (/non-2xx|Edge Function|FunctionsHttpError/i.test(raw)) {
        msg = t(
          "Kwinjira byanze. Reba PIN cyangwa gerageza nanone.",
          "Sign-in failed. Check your PIN or try again."
        );
      } else if (raw && raw.length < 160 && !/[{}]/.test(raw)) {
        msg = raw;
      }
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

  const submitCashierShopCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierShopCode.trim()) {
      toast.error(t("Andika Shop Code y'iduka", "Enter the store Shop Code"));
      return;
    }
    if (!cashierPhone.trim()) {
      toast.error(t("Andika numero ya telefone yawe", "Enter your phone number"));
      return;
    }
    if (!cashierName.trim()) {
      toast.error(t("Andika izina ryawe", "Enter your name"));
      return;
    }
    const cleanPhone = normalizePhoneE164(cashierPhone);
    if (!cleanPhone) {
      toast.error(t("Numero ya telefone ntiyemewe", "Invalid phone number"));
      return;
    }
    setIsLoading(true);
    try {
      const shop = await findShopByCode(cashierShopCode);
      setVerifiedShop(shop);
      setCashierFirstPin("");
      setPinError(null);
      setStep("cashier_set_pin");
      toast.success(
        t(`Iduka ribonetse: ${shop.businessName}`, `Shop found: ${shop.businessName}`)
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Shop Code ntibonetse");
    } finally {
      setIsLoading(false);
    }
  };

  const onCashierSetPin = (enteredPin: string) => {
    setCashierFirstPin(enteredPin);
    setPinResetToken((n) => n + 1);
    setPinError(null);
    setStep("cashier_confirm_pin");
  };

  const onCashierConfirmPin = async (enteredPin: string) => {
    if (enteredPin !== cashierFirstPin) {
      setPinError(
        t(
          "PIN ntizihura! Ongera ushyireho PIN.",
          "PINs do not match! Please set PIN again."
        )
      );
      setPinResetToken((n) => n + 1);
      setCashierFirstPin("");
      setStep("cashier_set_pin");
      return;
    }
    if (!verifiedShop) {
      toast.error("Shop details missing");
      setStep("cashier_shop_code");
      return;
    }
    setIsLoading(true);
    try {
      const { staff, shop, access_token, refresh_token } = await staffRegisterOrSetPin({
        shopCode: verifiedShop.shopCode,
        phone: cashierPhone,
        name: cashierName,
        pin: enteredPin,
        role: "cashier",
      });

      if (access_token && refresh_token) {
        try {
          await setSessionFromTokens(access_token, refresh_token);
        } catch (sessionErr) {
          console.warn("Could not set live staff auth session:", sessionErr);
        }
      }

      setCashierModeActive(true);
      setAppUnlocked(true);

      persistAccount({
        phone: staff.phone_normalized,
        displayName: staff.name,
        pinLength: PIN_LENGTH,
        shopCode: shop.shopCode,
        shopName: shop.businessName,
        role: "cashier",
        isStaff: true,
      });

      toast.success(
        t(
          `Murakaza neza mu iduka, ${staff.name}!`,
          `Welcome to the shop, ${staff.name}!`
        )
      );
      navigate("/new-sale");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ntibyashobotse gushyiraho PIN"
      );
      setPinResetToken((n) => n + 1);
      setStep("cashier_set_pin");
    } finally {
      setIsLoading(false);
    }
  };

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

  if (step === "cashier_shop_code") {
    return (
      <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
        <BrandMark variant="icon" size="lg" float />
        <h1 className="text-[#0B3FCC] text-xl font-bold mt-3 text-center">
          {t("Injira nk'Umukozi mu Iduka", "Join Store as Cashier")}
        </h1>
        <p className="text-slate-600 text-xs mt-1 text-center max-w-xs">
          {t(
            "Andika Shop Code nyiri iduka yaguhaye hamwe na nimero yawe",
            "Enter the Shop Code provided by your store owner and your phone"
          )}
        </p>

        <form onSubmit={submitCashierShopCode} className="w-full max-w-sm glass-card mt-6 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              <Store size={12} className="inline mr-1" />
              {t("Shop Code y'iduka *", "Store Shop Code *")}
            </label>
            <Input
              required
              value={cashierShopCode}
              onChange={(e) => setCashierShopCode(e.target.value.toUpperCase())}
              placeholder="urugero: SEL-8421"
              className="input-glow h-11 text-center font-mono font-bold tracking-widest text-base uppercase"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5 text-center">
              {t("Iyi code uyihabwa na nyir'ubucuruzi", "Get this code from your store owner")}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              <Phone size={12} className="inline mr-1" />
              {t("Telefone yawe *", "Your Phone Number *")}
            </label>
            <Input
              required
              type="tel"
              value={cashierPhone}
              onChange={(e) => setCashierPhone(e.target.value)}
              placeholder="0788..."
              className="input-glow h-11"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              <Users size={12} className="inline mr-1" />
              {t("Izina ryawe (Umukozi) *", "Your Name (Cashier) *")}
            </label>
            <Input
              required
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              placeholder="urugero: Aline"
              className="input-glow h-11"
            />
          </div>

          <Button
            type="submit"
            className="w-full btn-gold h-12 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Tegereza…" : t("Komeza (Submit Shop Code)", "Continue (Submit Shop Code)")}
          </Button>
        </form>

        <button
          type="button"
          className="mt-6 text-slate-500 text-sm"
          onClick={() => setStep("home")}
        >
          ← {t("Subira", "Back")}
        </button>
      </div>
    );
  }

  if (step === "cashier_set_pin" && verifiedShop) {
    return (
      <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
        <BrandMark variant="icon" size="xl" float />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-bold mt-3">
          <Store size={13} />
          <span>{verifiedShop.businessName} ({verifiedShop.shopCode})</span>
        </div>
        <p className="text-[#0B3FCC] text-base font-semibold mt-2">
          {t(`Murakaza neza, ${cashierName}`, `Welcome, ${cashierName}`)}
        </p>
        <p className="text-slate-500 text-xs mt-1 text-center max-w-xs">
          {t("Shyiraho PIN yawe nshya y'akazi (imibare 4)", "Set your personal 4-digit work PIN")}
        </p>
        <div className="mt-6 w-full max-w-sm flex justify-center">
          <PinDialPad
            onComplete={onCashierSetPin}
            isLoading={isLoading}
            displayName={cashierName}
            pinLength={PIN_LENGTH}
            resetToken={pinResetToken}
            errorMessage={pinError}
          />
        </div>
        <button
          type="button"
          className="mt-6 text-slate-500 text-sm"
          onClick={() => setStep("cashier_shop_code")}
        >
          ← {t("Hindura amakuru", "Change details")}
        </button>
      </div>
    );
  }

  if (step === "cashier_confirm_pin" && verifiedShop) {
    return (
      <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
        <BrandMark variant="icon" size="xl" float />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-bold mt-3">
          <Store size={13} />
          <span>{verifiedShop.businessName}</span>
        </div>
        <p className="text-[#0B3FCC] text-base font-bold mt-2">
          {t("Emeza PIN yawe y'akazi", "Confirm your work PIN")}
        </p>
        <p className="text-slate-500 text-xs mt-1 text-center max-w-xs">
          {t("Ongera wandike ya PIN yawe (imibare 4) kugira ngo wemeze", "Re-enter your 4-digit PIN to confirm")}
        </p>
        <div className="mt-6 w-full max-w-sm flex justify-center">
          <PinDialPad
            onComplete={onCashierConfirmPin}
            isLoading={isLoading}
            displayName={cashierName}
            pinLength={PIN_LENGTH}
            resetToken={pinResetToken}
            errorMessage={pinError}
          />
        </div>
        <button
          type="button"
          className="mt-6 text-slate-500 text-sm"
          onClick={() => {
            setPinError(null);
            setStep("cashier_set_pin");
          }}
        >
          ← {t("Ongera ushyireho PIN", "Back to set PIN")}
        </button>
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
        {selectedAccount.isStaff && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold mt-1.5">
            <Users size={12} />
            Umukozi (Cashier)
          </span>
        )}
        <div className="mt-8 w-full max-w-sm flex justify-center">
          <PinDialPad
            onComplete={loginWithPin}
            isLoading={isLoading || pinRetryAfter > 0}
            displayName={selectedAccount.displayName}
            pinLength={PIN_LENGTH}
            resetToken={pinResetToken}
            errorMessage={
              pinRetryAfter > 0
                ? t(
                    `Tegereza ${Math.ceil(pinRetryAfter / 60)} min (${pinRetryAfter}s)`,
                    `Wait ${Math.ceil(pinRetryAfter / 60)} min (${pinRetryAfter}s)`
                  )
                : pinError
            }
          />
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <Link to="/forgot-password" className="text-slate-400 text-xs underline">
            {t("Wibagiwe PIN?", "Forgot PIN?")}
          </Link>
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
              setSelectedAccount(accountForPhoneLogin(e164));
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
                  <p className="font-semibold flex items-center gap-1.5">
                    <span>{account.shopName || account.displayName}</span>
                    {account.isStaff && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                        Cashier
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {account.isStaff ? `${account.displayName} · ${account.phone}` : account.phone}
                  </p>
                  {account.shopCode && (
                    <p className="text-[10px] text-primary font-medium tracking-wider">
                      {account.shopCode}
                    </p>
                  )}
                </div>
              </button>
              <button
                type="button"
                className="absolute top-2 right-2 p-2 text-muted-foreground"
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

  if (step === "email_otp") {
    return (
      <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6">
        <BrandMark variant="icon" size="lg" float />
        <h1 className="text-[#0B3FCC] text-lg font-bold mt-3">
          {t("Emeza email yawe", "Confirm your email")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
          {emailOtpSent
            ? t(
                `Twakoherereje code kuri ${normalizeEmail(email)}`,
                `We sent a code to ${normalizeEmail(email)}`
              )
            : t("Andika code y'imibare 6", "Enter the 6-digit code")}
        </p>
        <div className="w-full max-w-sm glass-card mt-5 space-y-3">
          <Input
            value={emailOtp}
            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            className="input-glow h-12 text-center text-xl tracking-widest font-mono"
            inputMode="numeric"
          />
          <Button
            className="w-full btn-gold h-12"
            disabled={isLoading || emailOtp.length < 6}
            onClick={() => void completeCloudRegister()}
          >
            {isLoading ? "..." : t("Emeza & kora konti", "Confirm & create shop")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={() => void registerShop()}
          >
            {t("Ongera wohereze code", "Resend code")}
          </Button>
        </div>
        <button
          type="button"
          className="mt-6 text-slate-500 text-sm"
          onClick={() => setStep("register")}
        >
          ← {t("Subira", "Back")}
        </button>
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
              placeholder="e.g. Kigali Mini Market"
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
              {t("Ubwoko bw'ubucuruzi", "Business type")}
            </label>
            <select
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className="input-glow h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {lang === "rw" ? category.rw : category.en}
                </option>
              ))}
            </select>
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
    <div className="sella-auth-home min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
      <aside className="sella-auth-brand">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-500">Sella</p>
          <h2 className="mt-4">{BRAND.taglineRw}</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
            Igurisha, ideni, ububiko n'amafaranga — ku mudasobwa, uko umucuruzi akora.
          </p>
        </div>
        <ul className="mt-10 space-y-3 text-sm font-semibold">
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1A6FFF] shadow-sm">
              <TrendingUp size={16} />
            </span>
            Raporo y'amafaranga yinjiye
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1A6FFF] shadow-sm">
              <List size={16} />
            </span>
            Ideni n'abakiriya mu isura imwe
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1A6FFF] shadow-sm">
              <Package size={16} />
            </span>
            Ububiko n'ibicuruzwa byose
          </li>
        </ul>
        <p className="text-xs text-slate-500">{labels.madeForRwanda}</p>
      </aside>
      <div className="sella-auth-home-main relative flex w-full flex-1 flex-col items-center justify-center p-6">
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
          className={`w-full h-12 text-base ${rememberedAccounts.length ? "bg-white/70 dark:bg-white/10 border border-[#1A6FFF]/25 dark:border-white/15 text-[#0B3FCC] dark:text-[#E8F2FF] hover:bg-white/90 dark:hover:bg-white/20 backdrop-blur" : "btn-gold"}`}
          variant={rememberedAccounts.length ? "outline" : "default"}
          onClick={() => setStep("register")}
        >
          {t("Andikisha shop nshya", "Register new shop")}
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 bg-white/70 dark:bg-white/10 border border-[#1A6FFF]/25 dark:border-white/15 text-[#0B3FCC] dark:text-[#E8F2FF] hover:bg-white/90 dark:hover:bg-white/20 backdrop-blur"
          onClick={() => setStep(rememberedAccounts.length ? "picker" : "phone_login")}
        >
          {t("Injira (telefone + PIN 4)", "Sign in (phone + 4-digit PIN)")}
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 bg-primary/5 border border-primary/30 text-primary dark:text-primary-foreground hover:bg-primary/10 backdrop-blur font-semibold gap-2"
          onClick={() => {
            setCashierShopCode("");
            setCashierName("");
            setCashierPhone("");
            setVerifiedShop(null);
            setPinError(null);
            setStep("cashier_shop_code");
          }}
        >
          <Users size={16} />
          {t("Injira nk'Umukozi (Shop Code + PIN)", "Join as Cashier (Shop Code + PIN)")}
        </Button>
      </div>

      <p className="text-slate-500 text-[11px] mt-8 text-center max-w-sm">
        {t(
          "Ubundi ubwo: PIN ya imibare 4 gusa — shop yawe iribukwa.",
          "Next visits: 4-digit PIN only — your shop is remembered."
        )}
      </p>
      </div>
    </div>
  );
};

export default AuthPage;
