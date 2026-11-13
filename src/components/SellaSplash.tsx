import { useEffect, useRef, useState } from "react";
import { SellaLogoMark } from "@/components/SellaLogoMark";
import { SellaSignature } from "@/components/SellaSignature";
import { BRAND } from "@/lib/brand";
import { MOTION, prefersReducedMotion, SPLASH_TIMING } from "@/lib/motion";

type Props = {
  onDone: () => void;
  minMs?: number;
};

type Phase = "hold" | "write" | "cross" | "logo" | "tag" | "out";

/**
 * White splash:
 * 1) write liquid-glass “sella”
 * 2) progress bar fills
 * 3) word fades out → coded SVG logo fades in (same glass skin)
 * 4) bar fades → tagline → exit
 */
export function SellaSplash({ onDone, minMs = MOTION.splashMax }: Props) {
  const [phase, setPhase] = useState<Phase>("hold");
  const doneRef = useRef(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    };

    if (reduced) {
      setPhase("logo");
      const t = window.setTimeout(finish, Math.min(520, minMs));
      return () => window.clearTimeout(t);
    }

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    at(SPLASH_TIMING.writeStart, () => setPhase("write"));
    at(SPLASH_TIMING.wordOut, () => setPhase("cross"));
    at(SPLASH_TIMING.logoIn, () => setPhase("logo"));
    at(SPLASH_TIMING.tagline, () => setPhase("tag"));
    at(Math.min(SPLASH_TIMING.exitStart, Math.max(0, minMs - MOTION.splashExit)), () =>
      setPhase("out")
    );
    at(Math.min(SPLASH_TIMING.done, minMs), finish);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [minMs, onDone, reduced]);

  const wordLeaving = phase === "cross";
  const showLogo = phase === "logo" || phase === "tag" || phase === "out" || reduced;
  const showBar = phase === "write" || phase === "cross" || phase === "logo";
  const barFading = phase === "logo" || phase === "tag" || phase === "out";
  const showTag = phase === "tag" || phase === "out";

  return (
    <div
      className={`sella-splash-root sella-splash-root--light fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden ${
        phase === "out" ? "sella-splash-root--out" : ""
      }`}
      aria-hidden={phase === "out"}
    >
      <div className="pointer-events-none absolute inset-0 sella-splash-light-atmosphere" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-8">
        {/* Shared stage so word → logo crossfade stays centered */}
        <div className="relative flex h-[168px] w-full items-center justify-center sm:h-[184px]">
          {(phase === "write" || phase === "cross") && (
            <div
              className={`absolute inset-x-0 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                wordLeaving
                  ? "opacity-0 scale-95 translate-y-1 blur-[2px]"
                  : "opacity-100 scale-100"
              }`}
            >
              <div className="w-[min(86vw,300px)]">
                <SellaSignature className="sella-signature--playing" />
              </div>
            </div>
          )}

          <div
            className={`sella-logo-stage absolute flex flex-col items-center ${
              showLogo ? "sella-logo-stage--in" : ""
            }`}
          >
            <SellaLogoMark size="hero" />
          </div>
        </div>

        <div
          className={`sella-splash-progress mt-2 ${
            showBar ? "sella-splash-progress--run" : "opacity-0"
          } ${barFading ? "sella-splash-progress--fade" : ""}`}
          aria-hidden
        >
          <div className="sella-splash-progress-track">
            <div className="sella-splash-progress-fill" />
          </div>
        </div>

        <p
          className={`mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-[#0B3FCC]/85 ${
            showTag ? "sella-splash-tag" : "opacity-0"
          }`}
        >
          {BRAND.tagline}
        </p>
      </div>
    </div>
  );
}
