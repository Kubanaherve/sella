import type { BillingInterval, ProductPlan } from "@/lib/planCatalog";

const KEY = "sella_checkout_v1";

export type CheckoutIntent = {
  product: ProductPlan;
  interval: BillingInterval;
};

export function readCheckoutIntent(): CheckoutIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutIntent>;
    if (parsed.product !== "normal" && parsed.product !== "pro") return null;
    if (parsed.interval !== "monthly" && parsed.interval !== "annual") return null;
    return { product: parsed.product, interval: parsed.interval };
  } catch {
    return null;
  }
}

export function writeCheckoutIntent(intent: CheckoutIntent) {
  sessionStorage.setItem(KEY, JSON.stringify(intent));
}

export function billingPath(intent: CheckoutIntent): string {
  return `/billing?product=${intent.product}&interval=${intent.interval}`;
}

/** Only same-site paths. Blocks protocol-relative and external URLs. */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://") || raw.includes("\\")) return null;
  return raw;
}

export function signInPath(intent: CheckoutIntent): string {
  const next = billingPath(intent);
  return `/login?next=${encodeURIComponent(next)}`;
}
