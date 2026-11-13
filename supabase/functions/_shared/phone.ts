/** Normalize Rwanda / E.164 phones to +250XXXXXXXXX */
export function normalizePhoneE164(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return null;

  let n = digits;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("250") && n.length === 12) return `+${n}`;
  if (n.startsWith("0") && n.length === 10) return `+250${n.slice(1)}`;
  if (n.length === 9 && /^[7]/.test(n)) return `+250${n}`;
  if (n.startsWith("250") && n.length > 12) return `+${n.slice(0, 12)}`;
  if (input.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export function phoneDigitsOnly(e164: string): string {
  return e164.replace(/\D/g, "");
}

export const REVIEWER_PHONE = "+250780000000";
export const REVIEWER_OTP = "123456";

/**
 * Store reviewer OTP bypass.
 * Disabled by default. Even if ENABLE_REVIEWER_BYPASS=true, it stays OFF when
 * APP_ENV/NODE_ENV is production unless REVIEWER_ALLOW_IN_PRODUCTION=true.
 * Never use as a general production login.
 */
export function reviewerBypassEnabled(): boolean {
  const flag = (Deno.env.get("ENABLE_REVIEWER_BYPASS") || "").toLowerCase() === "true";
  if (!flag) return false;
  const appEnv = (
    Deno.env.get("APP_ENV") ||
    Deno.env.get("NODE_ENV") ||
    Deno.env.get("DENO_ENV") ||
    ""
  ).toLowerCase();
  const isProd = appEnv === "production" || appEnv === "prod";
  if (isProd) {
    return (Deno.env.get("REVIEWER_ALLOW_IN_PRODUCTION") || "").toLowerCase() === "true";
  }
  return true;
}

export function isReviewerPhone(phone: string): boolean {
  return reviewerBypassEnabled() && normalizePhoneE164(phone) === REVIEWER_PHONE;
}
