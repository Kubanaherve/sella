/** Payment brand marks — real assets under /brand/payments + SVG fallbacks. */

type LogoProps = { className?: string; title?: string };

export function MtnLogo({ className = "h-8 w-auto", title = "MTN MoMo" }: LogoProps) {
  return (
    <img
      src="/brand/payments/mtn-momo.png"
      alt={title}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}

export function AirtelLogo({
  className = "h-10 w-auto",
  title = "Airtel Money",
}: LogoProps) {
  return (
    <img
      src="/brand/payments/airtel-money.png"
      alt={title}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}

export function VisaLogo({ className = "h-5 w-auto", title = "Visa" }: LogoProps) {
  return (
    <img
      src="/brand/payments/visa.png"
      alt={title}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}

export function MastercardLogo({
  className = "h-7 w-auto",
  title = "Mastercard",
}: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 48 30" role="img" aria-label={title}>
      <circle cx="18" cy="15" r="10" fill="#EB001B" />
      <circle cx="30" cy="15" r="10" fill="#F79E1B" />
      <path d="M24 7.5a10 10 0 0 1 0 15 10 10 0 0 1 0-15z" fill="#FF5F00" />
    </svg>
  );
}

export function AmexLogo({ className = "h-6 w-auto", title = "American Express" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 60 20" role="img" aria-label={title}>
      <rect width="60" height="20" rx="3" fill="#2E77BC" />
      <text
        x="30"
        y="14"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="800"
        fontSize="9"
        fill="#fff"
        letterSpacing="0.5"
      >
        AMEX
      </text>
    </svg>
  );
}

export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

export function detectCardBrand(number: string): CardBrand {
  const n = number.replace(/\D/g, "");
  if (/^3[47]/.test(n)) return "amex";
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  return "unknown";
}
