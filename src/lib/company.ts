/** KUBANA FRIEND TECHNOLOGIES — merchant / product identity for Sella. */

export const COMPANY = {
  legalName: "KUBANA FRIEND TECHNOLOGIES",
  productName: "SELLA",
  merchantBrand: "SELLA",
  founderName: "Hervé Friend Kubana",
  businessEmail: import.meta.env.VITE_BUSINESS_EMAIL || "hello@sella.app",
  country: "Rwanda",
  countryCode: "RW",
  supportNote:
    "Merchant registration and KYC must match MTN MoMo / Airtel Money onboarding.",
} as const;
