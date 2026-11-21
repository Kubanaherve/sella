import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { commercialPlans } from "@/lib/plans";
import { isNativeApp } from "@/lib/platform";
import { accountHost } from "@/lib/site";

export function PricingCards({ includeTrial = true }: { includeTrial?: boolean }) {
  const plans = commercialPlans().filter((plan) => includeTrial || plan.id !== "trial");
  return (
    <div className={`grid gap-6 items-stretch ${plans.length > 2 ? "lg:grid-cols-3" : "md:grid-cols-2 max-w-3xl mx-auto"}`}>
      {plans.map((plan) => (
        <article
          key={plan.id}
          className={`rounded-2xl p-7 flex flex-col gap-5 text-left relative border bg-white ${
            plan.highlight ? "border-[#1D4ED8]" : "border-[#E5E7EB]"
          }`}
        >
          {plan.highlight && (
            <span className="absolute top-0 right-0 bg-[#1A6FFF] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl">
              Best value
            </span>
          )}
          <div className="space-y-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full inline-flex ${plan.highlight ? "bg-[#1A6FFF] text-white" : "bg-blue-500/10 text-[#1A6FFF]"}`}>
              {plan.name}
            </span>
            <div>
              <p className="text-4xl font-black">{plan.priceLabel}</p>
              <p className="text-xs text-slate-500 dark:text-white/60 mt-1">{plan.cadence}</p>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-white/80">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          {isNativeApp() ? (
            <p className="mt-auto text-sm leading-relaxed text-[#6B7280]">
              Membership is not managed in the mobile app. You can manage your account at {accountHost()}
            </p>
          ) : (
            <Link
              to={plan.href}
              className={`mt-auto min-h-11 rounded-xl text-sm font-semibold inline-flex items-center justify-center ${
                plan.highlight ? "bg-[#1D4ED8] text-white" : "bg-[#F3F4F6] text-[#111827]"
              }`}
            >
              {plan.cta}
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
