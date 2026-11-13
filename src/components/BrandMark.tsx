import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { SellaBrand } from "@/components/SellaBrand";
import { sellaBrandSrc, sellaGlassFinish } from "@/lib/sellaBrand";
import { useThemeOptional } from "@/contexts/ThemeContext";

type Variant = "icon" | "logo" | "full";
type Size = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

interface BrandMarkProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  float?: boolean;
  /** When true, uses glass tile (opaque glass panel). When false, floating glass mark. */
  framed?: boolean;
}

const SIZE_PX: Record<Size, string> = {
  xs: "h-8 w-8",
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-[4.5rem] w-[4.5rem]",
  xl: "h-28 w-28",
  hero: "h-36 w-36 sm:h-[10.5rem] sm:w-[10.5rem]",
};

const WORD_H: Record<Size, string> = {
  xs: "h-5",
  sm: "h-6",
  md: "h-7",
  lg: "h-9",
  xl: "h-11 sm:h-12",
  hero: "h-12 sm:h-14 md:h-16",
};

/**
 * Official Sella mark — glass SVG pack adapts to manual app appearance.
 */
export function BrandMark({
  variant = "icon",
  size = "md",
  className,
  showWordmark = false,
  wordmarkClassName,
  float = false,
  framed = true,
}: BrandMarkProps) {
  const { isDark } = useThemeOptional();
  const finish = sellaGlassFinish(isDark ? "dark" : "light");
  const showLockup = variant === "logo" || variant === "full" || showWordmark;
  const markSrc = framed
    ? sellaBrandSrc("tile", finish)
    : sellaBrandSrc("mark", finish);

  if (variant === "logo" || (variant === "full" && showLockup)) {
    return (
      <div
        className={cn(
          "inline-flex flex-col items-center",
          float && "animate-float",
          className
        )}
      >
        <SellaBrand
          kind="stacked"
          finish={finish}
          className="w-[min(72vw,15.5rem)] sm:w-[17rem]"
          imgClassName="h-auto w-full drop-shadow-[0_12px_28px_rgba(26,111,255,0.22)]"
        />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div
        className={cn(
          "brand-mark-box relative aspect-square shrink-0",
          SIZE_PX[size],
          float && "animate-float",
          framed ? "brand-mark-framed overflow-hidden" : "brand-mark-plain"
        )}
      >
        <img
          src={markSrc}
          alt={BRAND.name}
          width={168}
          height={168}
          className={cn(
            "pointer-events-none block h-full w-full select-none object-contain",
            !framed && "p-[6%]"
          )}
          draggable={false}
        />
      </div>
      {showLockup && (
        <SellaBrand
          kind="wordmark"
          finish={finish}
          className={cn("mt-3", wordmarkClassName)}
          imgClassName={cn("w-auto object-contain", WORD_H[size])}
        />
      )}
    </div>
  );
}
