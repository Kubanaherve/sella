import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import sellaIcon from "@/assets/brand/sella-icon.png";

type Variant = "icon" | "logo" | "full";
type Size = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

interface BrandMarkProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  float?: boolean;
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

/**
 * Official Sella mark — glossy neon S-bag app icon (full squircle).
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
  void variant;

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div
        className={cn(
          "brand-mark-box relative aspect-square shrink-0 overflow-hidden",
          SIZE_PX[size],
          float && "animate-float",
          framed ? "brand-mark-framed" : "brand-mark-plain"
        )}
      >
        <img
          src={sellaIcon}
          alt={BRAND.name}
          width={168}
          height={168}
          className="pointer-events-none block h-full w-full select-none object-cover"
          draggable={false}
        />
      </div>
      {showWordmark && (
        <span
          className={cn(
            "mt-3 text-2xl font-bold tracking-tight text-white",
            wordmarkClassName
          )}
        >
          {BRAND.name}
        </span>
      )}
    </div>
  );
}
