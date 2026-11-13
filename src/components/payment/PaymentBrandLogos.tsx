/** Official-style brand marks for checkout (inline SVG — no external CDN). */

type LogoProps = { className?: string; title?: string };

export function MtnLogo({ className = "h-7 w-auto", title = "MTN" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 120 40" role="img" aria-label={title}>
      <rect width="120" height="40" rx="8" fill="#FFCC00" />
      <text
        x="60"
        y="26"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="18"
        fill="#000"
        letterSpacing="1"
      >
        MTN
      </text>
    </svg>
  );
}

export function AirtelLogo({ className = "h-7 w-auto", title = "Airtel" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 120 40" role="img" aria-label={title}>
      <rect width="120" height="40" rx="8" fill="#ED1C24" />
      <path
        d="M28 28c6-14 12-18 18-18 4 0 7 2 9 6l3-6h8l-12 28h-9l2.2-5.2C45 29 42 28 38 28H28z"
        fill="#fff"
      />
      <text
        x="78"
        y="26"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="13"
        fill="#fff"
      >
        airtel
      </text>
    </svg>
  );
}

export function VisaLogo({ className = "h-5 w-auto", title = "Visa" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 60 20" role="img" aria-label={title}>
      <text
        x="2"
        y="15"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="16"
        fontStyle="italic"
        fill="#1A1F71"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardLogo({ className = "h-7 w-auto", title = "Mastercard" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 48 30" role="img" aria-label={title}>
      <circle cx="18" cy="15" r="10" fill="#EB001B" />
      <circle cx="30" cy="15" r="10" fill="#F79E1B" />
      <path
        d="M24 7.5a10 10 0 0 1 0 15 10 10 0 0 1 0-15z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function detectCardBrand(number: string): "visa" | "mastercard" | "unknown" {
  const n = number.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  return "unknown";
}
