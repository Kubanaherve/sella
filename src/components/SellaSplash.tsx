import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { BRAND } from "@/lib/brand";

type Props = {
  onDone: () => void;
  minMs?: number;
};

/**
 * Launch splash: neon glass logo bloom + signature wordmark.
 */
export function SellaSplash({ onDone, minMs = 3800 }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const tHold = window.setTimeout(() => setPhase("hold"), 380);
    const tOut = window.setTimeout(() => setPhase("out"), minMs);
    const tDone = window.setTimeout(onDone, minMs + 560);
    return () => {
      window.clearTimeout(tHold);
      window.clearTimeout(tOut);
      window.clearTimeout(tDone);
    };
  }, [minMs, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center transition-all duration-500 ease-out ${
        phase === "out"
          ? "opacity-0 scale-[1.03] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse 90% 70% at 55% 28%, #2B6CFF 0%, #0B3FCC 38%, #08153F 72%, #040816 100%)",
      }}
      aria-hidden={phase === "out"}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-[-10%] w-[28rem] h-[28rem] rounded-full bg-cyan-400/20 blur-3xl animate-float" />
        <div
          className="absolute bottom-[-12%] left-[-15%] w-[30rem] h-[30rem] rounded-full bg-fuchsia-500/25 blur-3xl animate-float"
          style={{ animationDelay: "0.55s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(4,8,22,0.45)_70%)]" />
      </div>

      <div
        className={`relative z-10 flex flex-col items-center px-8 transition-all duration-700 ease-out ${
          phase === "in"
            ? "opacity-0 translate-y-6 scale-90"
            : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        <div className="sella-splash-mark mb-8 relative">
          <div className="absolute inset-[-18%] rounded-[32%] bg-gradient-to-br from-cyan-300/30 via-transparent to-fuchsia-400/30 blur-2xl animate-pulse" />
          <BrandMark variant="icon" size="hero" framed={false} />
        </div>

        <div className="relative">
          <svg
            viewBox="0 0 320 90"
            className="w-[270px] h-[76px] overflow-visible"
            aria-label={BRAND.name}
          >
            <defs>
              <linearGradient id="sigFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="55%" stopColor="#E0F2FE" />
                <stop offset="100%" stopColor="#F5D0FE" />
              </linearGradient>
            </defs>
            <text
              x="160"
              y="58"
              textAnchor="middle"
              className="sella-signature-stroke"
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {BRAND.name}
            </text>
            <text
              x="160"
              y="58"
              textAnchor="middle"
              className="sella-signature-fill"
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {BRAND.name}
            </text>
            <path
              className="sella-signature-underline"
              d="M48 72 C110 82 210 82 272 68"
              fill="none"
              stroke="url(#sigFill)"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        </div>

        <p className="mt-5 text-white/75 text-[11px] font-semibold tracking-[0.32em] uppercase sella-splash-tag">
          {BRAND.taglineRw.split("—")[0].trim()}
        </p>
      </div>
    </div>
  );
}
