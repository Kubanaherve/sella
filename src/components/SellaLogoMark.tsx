import { cn } from "@/lib/utils";
import bagMark from "@/assets/brand/sella-bag-independent.png";

type Props = {
  className?: string;
  size?: "md" | "lg" | "hero";
  /** Prefer pure SVG silhouette (no bitmap). Default uses official-derived independent bag. */
  coded?: boolean;
};

const SIZE = {
  md: "h-16 w-16",
  lg: "h-24 w-24",
  hero: "h-[7.5rem] w-[7.5rem] sm:h-36 sm:w-36",
} as const;

/** Coded SVG silhouette — same S-bag geometry, no app-icon frame. */
function SellaBagSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="sellaBagGlass" x1="36" y1="24" x2="168" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="18%" stopColor="#EAF8FF" />
          <stop offset="48%" stopColor="#8FD9FF" />
          <stop offset="78%" stopColor="#3B82FF" />
          <stop offset="100%" stopColor="#7B5CFF" />
        </linearGradient>
        <linearGradient id="sellaBagRim" x1="40" y1="30" x2="160" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#9AE6FF" />
          <stop offset="100%" stopColor="#5AC8FA" />
        </linearGradient>
        <filter id="sellaBagGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#sellaBagGlow)">
        <path
          d="M70 74 C70 44 130 44 130 74"
          stroke="url(#sellaBagRim)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <path
          fill="url(#sellaBagGlass)"
          fillRule="evenodd"
          d="
            M 50 80
            C 50 73 56 70 64 70
            H 136
            C 144 70 150 73 150 80
            L 160 168
            C 162 184 150 194 134 194
            H 66
            C 50 194 38 184 40 168
            Z

            M 76 94
            C 98 86 128 88 136 106
            C 142 120 128 130 108 136
            C 88 142 74 152 78 166
            C 82 178 108 182 130 172
            L 124 182
            C 96 194 64 186 58 166
            C 52 144 74 130 100 124
            C 120 118 132 112 128 102
            C 124 92 100 92 82 98
            Z
          "
        />
      </g>
    </svg>
  );
}

/**
 * Independent Sella S-bag mark (no squircle / no framed PNG tile).
 * Default: official glass bag on transparent ground.
 * `coded`: vector-only silhouette.
 */
export function SellaLogoMark({ className, size = "hero", coded = false }: Props) {
  return (
    <div
      className={cn(
        "sella-logo-mark relative inline-flex items-center justify-center",
        SIZE[size],
        className
      )}
      role="img"
      aria-label="Sella"
    >
      <div className="sella-logo-aura" aria-hidden />
      {coded ? (
        <SellaBagSvg className="relative z-[1] h-full w-full" />
      ) : (
        <img
          src={bagMark}
          alt=""
          draggable={false}
          className="relative z-[1] h-full w-full object-contain select-none drop-shadow-[0_12px_28px_rgba(26,111,255,0.28)]"
        />
      )}
    </div>
  );
}
