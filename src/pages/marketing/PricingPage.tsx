import { PublicShell } from "@/components/marketing/PublicShell";
import { PricingCards } from "@/components/marketing/PricingCards";
import { Seo } from "@/components/marketing/Seo";
import { t, type CatalogueId } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import { formatRwf } from "@/lib/plans";
import { getMonthlyPriceRwf, SUBSCRIPTION_GRACE_DAYS } from "@/lib/entitlements";
import { ShieldCheck, HelpCircle } from "lucide-react";

export default function PricingPage() {
  const lang = useAppLanguage();
  const rw = lang === "rw";

  return (
    <PublicShell>
      <Seo
        title={rw ? "Ibiciro bya Sella — Isanzwe na Pro" : "Sella Pricing — Normal & Pro"}
        description={`Normal is ${formatRwf(getMonthlyPriceRwf("normal"))} per month. Pro is ${formatRwf(getMonthlyPriceRwf("pro"))} per month. Start with a 7-day free trial.`}
        path="/pricing"
      />

      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16 space-y-12">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50/70 text-xs font-semibold text-[#0B3FCC]">
            <ShieldCheck size={14} />
            <span>{rw ? "Ifatabuguzi ryizewe rya shop" : "Transparent Merchant Pricing"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {t("WEB-002" as CatalogueId)}
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            {rw
              ? "Tangira ku buntu n'iminsi 7. Hitamo Isanzwe (Normal) ku iduka rimwe cyangwa Sella Pro ku bucuruzi bufite amashami n'abakozi benshi."
              : "Start with a real 7-day free trial. Choose Normal for a single counter register, or Pro for multi-shop branches and cashier staff."}
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards />

        {/* Billing Details & Grace Period Explanation */}
        <div className="border-t border-slate-200 pt-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle size={16} className="text-[#0B3FCC]" />
              <span>{rw ? "Uko ifatabuguzi rikora mu Rwanda" : "How subscription billing works"}</span>
            </h3>
            <p>
              {rw
                ? "Kwishyura ifatabuguzi rya Sella bikorerwa kuri web ukoresheje MTN Mobile Money cyangwa ikarita ya banki. Konti yawe ihita ifunguka ako kanya kuri telefone, tablet, no kuri mudasobwa."
                : "Subscription billing stays on the website and uses MTN MoMo. A confirmed payment is what unlocks the shop."}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>{rw ? `Iminsi ${SUBSCRIPTION_GRACE_DAYS} y'inyongera (Grace Period)` : `${SUBSCRIPTION_GRACE_DAYS}-Day Grace Period`}</span>
            </h3>
            <p>
              {rw
                ? `Iyo igihe wishyuriye kirangiye, uhabwa iminsi ${SUBSCRIPTION_GRACE_DAYS} y'inyongera yo gukomeza gukora mbere y'uko konti ihinduka gusoma gusa. Nta kigoza cyihishe.`
                : `When a paid period ends, your account receives a ${SUBSCRIPTION_GRACE_DAYS}-day grace period before write access is restricted. Your shop records and customer debts are always preserved.`}
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
