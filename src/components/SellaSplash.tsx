import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { GlassWordmark } from "@/components/GlassWordmark";
import { BRAND } from "@/lib/brand";
import glassAmbient from "@/assets/brand/sella-glass-ambient.jpg";

type Props = {
  onDone: () => void;
  minMs?: number;
};

type Phase = "write" | "fade" | "logo" | "out";

/**
 * Splash: handwritten Sella writes → fades out → glass logo on soft ambient field.
 */
export function SellaSplash({ onDone, minMs = 4200 }: Props) {
  const [phase, setPhase] = useState<Phase>("write");

  useEffect(() => {
    const tFade = window.setTimeout(() => setPhase("fade"), 1700);
    const tLogo = window.setTimeout(() => setPhase("logo"), 2300);
    const tOut = window.setTimeout(() => setPhase("out"), minMs);
    const tDone = window.setTimeout(onDone, minMs + 520);
    return () => {
      window.clearTimeout(tFade);
      window.clearTimeout(tLogo);
      window.clearTimeout(tOut);
      window.clearTimeout(tDone);
    };
  }, [minMs, onDone]);

  const showScript = phase === "write" || phase === "fade";
  const showLogo = phase === "logo" || phase === "out";

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ease-out ${
        phase === "out" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden={phase === "out"}
    >
      <img
        src={glassAmbient}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-0 sella-glass-ambient-veil" />

      <div className="relative z-10 flex min-h-[220px] w-full flex-col items-center justify-center px-8">
        {/* Handwritten Sella — writes then disappears */}
        <div
          className={`absolute flex flex-col items-center transition-all duration-500 ease-out ${
            showScript && phase === "write"
              ? "opacity-100 scale-100 translate-y-0"
              : showScript && phase === "fade"
                ? "opacity-0 scale-95 translate-y-2 blur-sm"
                : "opacity-0 scale-90 pointer-events-none"
          }`}
        >
          <div className="sella-glass-script-write">
            <GlassWordmark size="hero" glow />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#0B3FCC]/90 sella-splash-tag">
            {BRAND.tagline}
          </p>
        </div>

        {/* Logo reveal on soft glass field */}
        <div
          className={`flex flex-col items-center transition-all duration-700 ease-out ${
            showLogo
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-90 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="sella-splash-mark relative">
            <div className="absolute inset-[-28%] rounded-[36%] bg-[radial-gradient(circle,rgba(90,200,250,0.35)_0%,transparent_70%)] blur-2xl" />
            <BrandMark variant="icon" size="hero" framed={false} />
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#0B3FCC]/85">
            {BRAND.tagline}
          </p>
        </div>
      </div>
    </div>
  );
}
