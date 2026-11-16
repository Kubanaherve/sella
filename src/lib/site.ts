import { COMPANY } from "@/lib/company";

/** Public marketing routes. Must stay reachable without a PIN session. */
export const MARKETING_PATHS = [
  "/features",
  "/benefits",
  "/how-it-works",
  "/pricing",
  "/download",
  "/about",
  "/contact",
  "/support",
  "/faq",
] as const;

export function isMarketingPath(path: string): boolean {
  return (MARKETING_PATHS as readonly string[]).includes(path);
}

/** Canonical origin. Env wins; otherwise the host already used in product PDFs and payment return URLs. */
export function publicSiteUrl(): string {
  const fromEnv = String(import.meta.env.VITE_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "https://sella.app";
}

export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `${publicSiteUrl()}/`;
  return `${publicSiteUrl()}${normalized}`;
}

export const SITE = {
  name: "Sella",
  company: COMPANY.legalName,
  email: COMPANY.businessEmail,
  description:
    "Sella is shop software for sales, customer credit, inventory, and WhatsApp reminders. A product of KUBANA Friend TECHNOLOGIES.",
} as const;
