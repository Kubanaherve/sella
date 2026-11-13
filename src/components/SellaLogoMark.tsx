import { cn } from "@/lib/utils";
import { SellaBrand } from "@/components/SellaBrand";
import { useThemeOptional } from "@/contexts/ThemeContext";
import { sellaGlassFinish } from "@/lib/sellaBrand";

type Props = {
  className?: string;
  size?: "md" | "lg" | "hero";
};

const SIZE = {
  md: "h-16 w-16",
  lg: "h-24 w-24",
  hero: "h-[7.5rem] w-[7.5rem] sm:h-36 sm:w-36",
} as const;

/**
 * Independent glass S-bag mark from the official SVG pack.
 * Adapts with manual app appearance. Splash writing is separate.
 */
export function SellaLogoMark({ className, size = "hero" }: Props) {
  const { isDark } = useThemeOptional();
  const finish = sellaGlassFinish(isDark ? "dark" : "light");

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
      <SellaBrand
        kind="mark"
        finish={finish}
        decorative
        className="relative z-[1] h-full w-full"
        imgClassName="h-full w-full drop-shadow-[0_12px_28px_rgba(26,111,255,0.28)]"
      />
    </div>
  );
}
