import { useEffect, useRef, useState } from "react";
import { SellaLogoMark } from "@/components/SellaLogoMark";
import { SellaSignature } from "@/components/SellaSignature";
import { BRAND } from "@/lib/brand";
import { MOTION, prefersReducedMotion, SPLASH_TIMING } from "@/lib/motion";
import { useThemeOptional } from "@/contexts/ThemeContext";
import { ArrowRight, Sparkles } from "lucide-react";

type Props = {
  onDone: () => void;
  minMs?: number;
};

type Phase = "hold" | "write" | "cross" | "logo" | "tag" | "out";

const SPLASH_KINYARWANDA_WORDS = [
  "Recordinga igurisha ku meza...",
  "Menya umuntu ugifite ideni...",
  "Ikora udafite internet...",
  "Printinga resi za Bluetooth...",
  "Savinga sitoki n'imiburo...",
  "Downloadinga app kuri telefone...",
];

export function SellaSplash({ onDone, minMs = MOTION.splashMax }: Props) {
  const [phase, setPhase] = useState<Phase>("hold");
  const [wordIndex, setWordIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);
  const doneRef = useRef(false);
  const reduced = prefersReducedMotion();
  const { isDark } = useThemeOptional();

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

    // Cycle through Kinyarwanda words smoothly
    const wordInterval = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % SPLASH_KINYARWANDA_WORDS.length);
    }, 420);

    // Progress counter animation
    const progressInterval = window.setInterval(() => {
      setProgressPercent((prev) => Math.min(prev + 5, 100));
    }, 110);

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
      window.clearInterval(wordInterval);
      window.clearInterval(progressInterval);
    };
  }, [minMs, onDone, reduced]);

  const handleSkip = () => {
    if (doneRef.current) return;
    setPhase("out");
    setTimeout(() => {
      doneRef.current = true;
      onDone();
    }, 250);
  };

  const wordLeaving = phase === "cross";
  const showLogo = phase === "logo" || phase === "tag" || phase === "out" || reduced;
  const showBar = phase === "write" || phase === "cross" || phase === "logo";
  const barFading = phase === "logo" || phase === "tag" || phase === "out";
  const showTag = phase === "tag" || phase === "out";

  return (
    <div
      className={`sella-splash-root fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
        isDark ? "sella-splash-root--dark bg-[#071225]" : "sella-splash-root--light bg-[#08152e]"
      } ${phase === "out" ? "sella-splash-root--out opacity-0 pointer-events-none" : "opacity-100"}`}
      aria-hidden={phase === "out"}
    >
      {/* Background Liquid Glass Atmospheres & Radial Orbs */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(26,111,255,0.32),transparent_65%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full bg-blue-600/20 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-cyan-500/15 blur-[90px]"
        aria-hidden="true"
      />

      {/* Skip button in top corner */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-6 right-6 z-50 text-[11px] font-semibold tracking-wider uppercase text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 transition-all flex items-center gap-1.5"
      >
        <span>Simbuka</span>
        <ArrowRight size={12} />
      </button>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-8">
        {/* Shared stage: Wordmark writes itself -> Coded Logo Mark Fades In */}
        <div className="relative flex h-[168px] w-full items-center justify-center sm:h-[184px]">
          {(phase === "write" || phase === "cross") && (
            <div
              className={`absolute inset-x-0 flex justify-center transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
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
            className={`sella-logo-stage absolute flex flex-col items-center transition-all duration-700 ${
              showLogo ? "sella-logo-stage--in !opacity-100 !scale-100" : "opacity-0 scale-90"
            }`}
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-[#1A6FFF]/30 blur-xl animate-pulse" />
              <SellaLogoMark size="hero" />
            </div>
          </div>
        </div>

        {/* Dynamic cycling conversational Kinyarwanda tech words */}
        <div className="h-9 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center mt-4 overflow-hidden text-center shadow-lg">
          <p
            key={wordIndex}
            className="text-xs sm:text-sm font-semibold text-cyan-300 tracking-wide animate-in fade-in duration-300 font-sans"
          >
            {SPLASH_KINYARWANDA_WORDS[wordIndex]}
          </p>
        </div>

        {/* Progress Bar & Percentage Ticker */}
        <div className="sella-splash-progress mt-4 flex flex-col items-center" aria-hidden>
          <div className="sella-splash-progress-track relative w-56 h-1.5 bg-white/20 rounded-full overflow-hidden shadow-inner">
            <div
              className="sella-splash-progress-fill h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] font-mono text-cyan-200/70 text-center mt-2 tabular-nums">
            {progressPercent}%
          </p>
        </div>

        {/* Final Official Brand Tagline */}
        <p
          className={`mt-4 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-[#9EC4FF]/80 transition-opacity duration-500 ${
            showTag ? "opacity-100" : "opacity-0"
          }`}
        >
          {BRAND.tagline}
        </p>
      </div>
    </div>
  );
}
