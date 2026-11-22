import {
  getAnnualPriceRwf,
  getMonthlyPriceRwf,
  hasProFeatures,
  hasWriteAccess,
  type SubscriptionSnapshot,
} from "@/lib/entitlements";
import { TRIAL_DAYS, type ProductPlan } from "@/lib/planCatalog";

export type CommercialPlanId = "trial" | "normal" | "pro";

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

const NORMAL_FEATURES = [
  "1 shop",
  "1 owner and 1 cashier",
  "Offline sales, then sync when the internet returns",
  "Cash, MTN MoMo, and Airtel Money, including split payment",
  "Duplicate MoMo reference check",
  "Customer credit (Ideni) and WhatsApp reminders",
  "Stock and low-stock alerts",
  "Thermal and PDF receipts",
] as const;

const PRO_FEATURES = [
  "Everything in Normal",
  "Up to 5 cashiers",
  "Up to 3 shops on one owner account",
  "Desktop app, keyboard shortcuts, and command search",
  "Excel and CSV import for products and customers",
  "PDF debt reports with the shop pay number",
  "Ask the Shop assistant",
  "Priority support",
] as const;

export function formatRwf(amount: number): string {
  return `${new Intl.NumberFormat("en-RW").format(Math.round(amount))} RWF`;
}

export function annualSavingsRwf(product: ProductPlan = "normal"): number {
  return Math.max(0, getMonthlyPriceRwf(product) * 12 - getAnnualPriceRwf(product));
}

export function trialLengthDays(): number {
  return TRIAL_DAYS;
}

export function commercialPlans(): CommercialPlan[] {
  const days = trialLengthDays();
  return [
    {
      id: "trial",
      name: "Free trial",
      priceRwf: 0,
      priceLabel: "Free",
      cadence: `${days} days of full access`,
      highlight: false,
      cta: "Create a shop",
      href: "/login",
      features: [
        `Full access for ${days} days`,
        "No payment to start",
        "PIN unlock at the counter",
        "Choose Normal or Pro before the trial ends",
      ],
    },
    {
      id: "normal",
      name: "Normal",
      priceRwf: getMonthlyPriceRwf("normal"),
      priceLabel: formatRwf(getMonthlyPriceRwf("normal")),
      cadence: `${formatRwf(getMonthlyPriceRwf("normal"))} / month · ${formatRwf(getAnnualPriceRwf("normal"))} / year (2 months free)`,
      highlight: false,
      cta: "Choose Normal",
      href: "/subscribe?product=normal",
      features: [...NORMAL_FEATURES],
    },
    {
      id: "pro",
      name: "Pro",
      priceRwf: getMonthlyPriceRwf("pro"),
      priceLabel: formatRwf(getMonthlyPriceRwf("pro")),
      cadence: `${formatRwf(getMonthlyPriceRwf("pro"))} / month · ${formatRwf(getAnnualPriceRwf("pro"))} / year (2 months free)`,
      highlight: true,
      cta: "Choose Pro",
      href: "/subscribe?product=pro",
      features: [...PRO_FEATURES],
    },
  ];
}

export function proFeatureList(): readonly string[] {
  return PRO_FEATURES;
}

export function entitledFeatures(sub: SubscriptionSnapshot | null, now = new Date()): string[] {
  if (!hasWriteAccess(sub, now)) {
    return ["Read existing records while the plan is inactive", "Pay to record new sales"];
  }
  if (hasProFeatures(sub, now)) return [...NORMAL_FEATURES, ...PRO_FEATURES];
  return [...NORMAL_FEATURES];
}
