import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { commercialPlans } from "@/lib/plans";

export function PricingCards({ includeTrial = true }: { includeTrial?: boolean }) {
  const plans = commercialPlans().filter((plan) => includeTrial || plan.id !== "trial");
  return (
    <div className={`grid gap-6 items-stretch ${plans.length > 2 ? "lg:grid-cols-3" : "md:grid-cols-2 max-w-3xl mx-auto"}`}>
      {plans.map((plan) => (
        <article
          key={plan.id}
          className={`rounded-3xl p-7 flex flex-col gap-5 text-left relative ${
            plan.highlight
              ? "border-2 border-[#1A6FFF] bg-gradient-to-b from-blue-50/80 to-white dark:from-[#1A6FFF]/10 dark:to-transparent shadow-xl shadow-blue-500/10"
              : "border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-lg shadow-slate-200/40 dark:shadow-none"
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
          <Link
            to={plan.href}
            className={`mt-auto h-12 rounded-2xl text-xs font-bold inline-flex items-center justify-center ${
              plan.highlight ? "bg-[#1A6FFF] text-white shadow-lg shadow-blue-500/25" : "bg-slate-100 dark:bg-white/10"
            }`}
          >
            {plan.cta}
          </Link>
        </article>
      ))}
    </div>
  );
}
