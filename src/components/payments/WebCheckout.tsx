import { useEffect, useId, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { t, type CatalogueId } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/integrations/supabase/client";
import { billingPath, readCheckoutIntent, writeCheckoutIntent, type CheckoutIntent } from "@/lib/checkoutIntent";
import { hasProFeatures, hasWriteAccess } from "@/lib/entitlements";
import { formatRwf } from "@/lib/plans";
import { planAmountRwf, type BillingInterval, type ProductPlan } from "@/lib/planCatalog";
import { groupDigits, maskPhone, subscriptionPhoneDigits } from "@/lib/subscriptionPhone";

type Stage = "details" | "review" | "pending" | "confirmed" | "updating" | "failed" | "unknown";

const PENDING_KEY = "sella_payment_pending_v1";

function intentFrom(params: URLSearchParams): CheckoutIntent {
  const stored = readCheckoutIntent();
  const product: ProductPlan = params.get("product") === "pro" || params.get("product") === "normal"
    ? (params.get("product") as ProductPlan)
    : stored?.product || "normal";
  const interval: BillingInterval = params.get("interval") === "annual" || params.get("interval") === "monthly"
    ? (params.get("interval") as BillingInterval)
    : stored?.interval || "monthly";
  return { product, interval };
}

export function WebCheckout({ shopName }: { shopName: string }) {
  const lang = useAppLanguage();
  const { user, subscription, refreshSubscription } = useAuth();
  const [params] = useSearchParams();
  const [intent, setIntent] = useState<CheckoutIntent>(() => intentFrom(params));
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<Stage>("details");
  const [referenceId, setReferenceId] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const titleId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    writeCheckoutIntent(intent);
  }, [intent]);

  const amount = planAmountRwf(intent.product, intent.interval);
  const digits = subscriptionPhoneDigits(phone);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(PENDING_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { referenceId?: string; phone?: string; intent?: CheckoutIntent };
      if (parsed.referenceId && parsed.intent) {
        setReferenceId(parsed.referenceId);
        setIntent(parsed.intent);
        setPhone(parsed.phone || "");
        setStage("pending");
      }
    } catch {
      sessionStorage.removeItem(PENDING_KEY);
    }
  }, []);

  useEffect(() => {
    if (stage !== "review") return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setStage("details");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, busy]);

  useEffect(() => {
    if (stage !== "pending" || !referenceId) return;
    let stop = false;
    const tick = async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const response = await fetch(`/api/payments/status/${encodeURIComponent(referenceId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = (await response.json().catch(() => ({}))) as {
          status?: string;
          current_period_end?: string;
        };
        if (stop || !live.current) return;
        if (!response.ok) {
          setStage("unknown");
          return;
        }
        if (body.status === "SUCCESSFUL") {
          if (body.current_period_end) setPeriodEnd(body.current_period_end);
          sessionStorage.removeItem(PENDING_KEY);
          await refreshSubscription();
          setStage("updating");
        } else if (body.status === "FAILED") {
          sessionStorage.removeItem(PENDING_KEY);
          setStage("failed");
          setNote(t("WEB-043" as CatalogueId));
        }
      } catch {
        if (!stop) setStage("unknown");
      }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 2500);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [stage, referenceId, refreshSubscription]);

  useEffect(() => {
    if (stage !== "updating") return;
    const productOk = subscription?.productPlan === intent.product && (intent.product === "pro" ? hasProFeatures(subscription) : hasWriteAccess(subscription));
    if (productOk) setStage("confirmed");
  }, [stage, subscription, intent.product]);

  useEffect(() => {
    if (stage !== "updating") return;
    const timer = window.setInterval(() => void refreshSubscription(), 2000);
    return () => window.clearInterval(timer);
  }, [stage, refreshSubscription]);

  function setPlan(next: CheckoutIntent) {
    setIntent(next);
    writeCheckoutIntent(next);
  }

  async function requestPayment() {
    if (busy || !digits) return;
    setBusy(true);
    setNote("");
    try {
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setNote(t("WEB-004" as CatalogueId));
        setStage("details");
        return;
      }
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits, product: intent.product, interval: intent.interval }),
      });
      const body = (await response.json().catch(() => ({}))) as { referenceId?: string; error?: string };
      if (!response.ok || !body.referenceId) {
        setStage("failed");
        setNote(body.error || t("WEB-043" as CatalogueId));
        return;
      }
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ referenceId: body.referenceId, phone: digits, intent }));
      setReferenceId(body.referenceId);
      setStage("pending");
    } catch {
      setStage("unknown");
      setNote(t("WEB-044" as CatalogueId));
    } finally {
      setBusy(false);
    }
  }

  const periodLabel = intent.interval === "annual" ? t("WEB-055" as CatalogueId) : t("WEB-054" as CatalogueId);
  const masked = digits ? maskPhone(digits) : "";

  return (
    <section className="rounded-xl border border-[#E6E6E6] bg-white p-5" aria-live="polite">
      <h2 className="text-lg font-semibold">{shopName}</h2>
      <p className="mt-2 text-sm text-[#4B4B4B]">{t("WEB-048" as CatalogueId)}</p>

      {(stage === "details" || stage === "review") && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
          <div>
            <div className="flex flex-wrap gap-2">
              {(["normal", "pro"] as const).map((product) => (
                <button
                  key={product}
                  type="button"
                  className={`h-10 rounded-md border px-3 text-sm ${intent.product === product ? "border-[#0B3FCC] text-[#0B3FCC]" : "border-[#E6E6E6]"}`}
                  onClick={() => setPlan({ ...intent, product })}
                >
                  {t(product === "pro" ? "WEB-024" as CatalogueId : "WEB-023" as CatalogueId)}
                </button>
              ))}
              <button type="button" className="h-10 rounded-md border border-[#E6E6E6] px-3 text-sm" onClick={() => setPlan({ ...intent, interval: intent.interval === "annual" ? "monthly" : "annual" })}>
                {intent.interval === "annual" ? t("WEB-026" as CatalogueId) : t("WEB-025" as CatalogueId)}
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium" htmlFor="pay-phone">{t("WEB-034" as CatalogueId)}</label>
            <div className="mt-1 flex overflow-hidden rounded-md border border-[#E6E6E6]">
              <span className="flex items-center border-r border-[#E6E6E6] bg-[#FAFAFA] px-3 text-sm">+250</span>
              <input
                id="pay-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                className="h-11 w-full px-3 text-sm"
              />
            </div>
            <p className="mt-2 text-[13px] text-[#4B4B4B]">{t("WEB-035" as CatalogueId)}</p>
            <p className="mt-1 text-[13px] tabular-nums text-[#141414]">{digits ? groupDigits(digits) : ""}</p>
            {!user ? (
              <Link to={`/login?next=${encodeURIComponent(billingPath(intent))}`} className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-[#0B3FCC]">
                {t("WEB-004" as CatalogueId)}
              </Link>
            ) : (
              <button
                ref={continueRef}
                type="button"
                disabled={!digits}
                className="mt-4 h-11 rounded-md bg-[#0B3FCC] px-4 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => setStage("review")}
              >
                {t("WEB-036" as CatalogueId)}
              </button>
            )}
          </div>
          <aside className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
            <p className="text-sm">{intent.product === "pro" ? "Pro" : "Normal"}</p>
            <p className="mt-2 text-[24px] font-semibold tabular-nums">{formatRwf(amount)}</p>
            <p className="text-sm text-[#4B4B4B]">{periodLabel}</p>
          </aside>
        </div>
      )}

      {stage === "review" && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="sella-sheet sella-glass-edge w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
          >
            <h3 id={titleId} className="text-lg font-semibold">{t("WEB-057" as CatalogueId)}</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt>{shopName}</dt><dd>{intent.product}</dd></div>
              <div className="flex justify-between gap-4"><dt>{t("WEB-034" as CatalogueId)}</dt><dd className="tabular-nums">{digits ? groupDigits(digits) : ""}</dd></div>
              <div className="flex justify-between gap-4"><dt>{periodLabel}</dt><dd className="font-semibold tabular-nums">{formatRwf(amount)}</dd></div>
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" disabled={busy} className="h-11 rounded-md bg-[#0B3FCC] text-sm font-semibold text-white disabled:opacity-60" onClick={() => void requestPayment()}>
                {t("WEB-038" as CatalogueId, lang, { amount: formatRwf(amount) })}
              </button>
              <button
                ref={closeRef}
                type="button"
                className="h-11 rounded-md border border-[#E6E6E6] text-sm"
                onClick={() => {
                  setStage("details");
                  continueRef.current?.focus();
                }}
              >
                {t("WEB-037" as CatalogueId)}
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === "pending" && (
        <div className="mt-5 rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4">
          <p className="text-sm font-semibold">{formatRwf(amount)}</p>
          <p className="mt-1 text-sm tabular-nums">{masked}</p>
          <p className="mt-2 text-sm text-[#4B4B4B]">{t("WEB-039" as CatalogueId)}</p>
          <p className="mt-2 text-[12px] text-[#6B6B6B]">{referenceId}</p>
        </div>
      )}

      {stage === "updating" && (
        <div className="mt-5 rounded-xl border border-[#E6E6E6] p-4">
          <p className="text-sm">{t("WEB-042" as CatalogueId)}</p>
          <button type="button" className="mt-3 h-10 text-sm font-semibold text-[#0B3FCC]" onClick={() => void refreshSubscription()}>
            {t("WEB-040" as CatalogueId)}
          </button>
        </div>
      )}

      {stage === "confirmed" && (
        <div className="mt-5 rounded-xl border border-[#E6E6E6] bg-white p-4">
          <p className="sella-check is-on text-sm font-semibold" role="status">{t("SALE-024" as CatalogueId)}</p>
          <p className="mt-2 text-sm tabular-nums">{formatRwf(amount)} · {referenceId}</p>
          {periodEnd ? <p className="mt-1 text-sm text-[#4B4B4B]">{new Date(periodEnd).toLocaleDateString()}</p> : null}
          <Link to="/dashboard" className="mt-4 inline-flex h-11 items-center rounded-md bg-[#0B3FCC] px-4 text-sm font-semibold text-white">
            {t("WEB-041" as CatalogueId)}
          </Link>
        </div>
      )}

      {(stage === "failed" || stage === "unknown") && (
        <div className="mt-5 rounded-xl border border-[#E6E6E6] p-4">
          <p className="text-sm">{note || (stage === "unknown" ? t("WEB-044" as CatalogueId) : t("WEB-043" as CatalogueId))}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {stage === "unknown" && referenceId ? (
              <button type="button" className="h-10 text-sm font-semibold text-[#0B3FCC]" onClick={() => setStage("pending")}>{t("WEB-040" as CatalogueId)}</button>
            ) : null}
            <Link to="/support" className="inline-flex h-10 items-center text-sm font-semibold">{t("WEB-049" as CatalogueId)}</Link>
            {stage === "failed" && (
              <button type="button" className="h-10 text-sm font-semibold" onClick={() => { setStage("details"); setReferenceId(""); }}>{t("WEB-058" as CatalogueId)}</button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
