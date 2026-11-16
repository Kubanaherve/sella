import { getAnnualPriceRwf, getMonthlyPriceRwf, hasWriteAccess, type SubscriptionSnapshot } from "@/lib/entitlements";

export type CommercialPlanId = "trial" | "pro_monthly" | "pro_annual";

export type CommercialPlan = {
  id: CommercialPlanId;
  name: string;
  priceRwf: number;
  priceLabel: string;
  cadence: string;
  highlight: boolean;
  cta: string;
  href: string;
  features: string[];
};

const PRO_FEATURES = [
  "Unlimited sales and credit orders",
  "Customer ledger and WhatsApp reminders",
  "Inventory tracking",
  "Receipts and PDF invoices",
  "Offline selling, with cloud sync when you are connected",
  "One account on the web app and on released phone and desktop apps",
] as const;

export function formatRwf(amount: number): string {
  return `${new Intl.NumberFormat("en-RW").format(Math.round(amount))} RWF`;
}

export function annualSavingsRwf(): number {
  return Math.max(0, getMonthlyPriceRwf() * 12 - getAnnualPriceRwf());
}

export function trialLengthDays(): number {
  const n = Number(import.meta.env.VITE_TRIAL_DAYS || 7);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 7;
}

/**
 * Commercial catalog. Trial is the free start. Pro is the paid shop plan.
 * Prices come from the same helpers the checkout uses.
 */
export function commercialPlans(): CommercialPlan[] {
  const days = trialLengthDays();
  const monthly = getMonthlyPriceRwf();
  const annual = getAnnualPriceRwf();
  const savings = annualSavingsRwf();
  return [
    {
      id: "trial",
      name: "Free trial",
      priceRwf: 0,
      priceLabel: "Free",
      cadence: `${days} days, then Pro`,
      highlight: false,
      cta: "Create an account",
      href: "/login",
      features: [
        `Full shop tools for ${days} days`,
        "No payment to start",
        "PIN unlock for the counter",
        "Upgrade only if you want to keep writing sales",
      ],
    },
    {
      id: "pro_monthly",
      name: "Pro",
      priceRwf: monthly,
      priceLabel: formatRwf(monthly),
      cadence: "Prepaid each month",
      highlight: false,
      cta: `Subscribe monthly (${formatRwf(monthly)})`,
      href: "/subscribe",
      features: [...PRO_FEATURES],
    },
    {
      id: "pro_annual",
      name: "Pro Annual",
      priceRwf: annual,
      priceLabel: formatRwf(annual),
      cadence: savings > 0 ? `Prepaid each year · save ${formatRwf(savings)}` : "Prepaid each year",
      highlight: true,
      cta: `Subscribe annual (${formatRwf(annual)})`,
      href: "/subscribe",
      features: [
        "Everything in Pro",
        savings > 0 ? `Save ${formatRwf(savings)} versus twelve monthly payments` : "One payment for the year",
        "Same account on every released Sella app",
      ],
    },
  ];
}

export function proFeatureList(): readonly string[] {
  return PRO_FEATURES;
}

/** What this subscription can use. The backend remains the source of write access. */
export function entitledFeatures(sub: SubscriptionSnapshot | null, now = new Date()): string[] {
  if (hasWriteAccess(sub, now)) return [...PRO_FEATURES];
  return ["Read existing records while the plan is inactive", "Renew Pro to record new sales"];
}
