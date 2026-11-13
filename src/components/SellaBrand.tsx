import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import {
  sellaBrandSrc,
  sellaGlassFinish,
  type SellaBrandFinish,
  type SellaBrandKind,
} from "@/lib/sellaBrand";
import { useThemeOptional } from "@/contexts/ThemeContext";

type Props = {
  kind?: SellaBrandKind;
  /** Explicit finish. If omitted, follows manual app appearance (glass). */
  finish?: SellaBrandFinish;
  /** Override surface when finish is omitted. */
  surface?: "light" | "dark";
  className?: string;
  imgClassName?: string;
  alt?: string;
  decorative?: boolean;
};

/**
 * Official Sella SVG pack — glass finishes adapt with the in-app theme button.
 */
export function SellaBrand({
  kind = "mark",
  finish,
  surface,
  className,
  imgClassName,
  alt = BRAND.name,
  decorative = false,
}: Props) {
  const { isDark } = useThemeOptional();
  const autoSurface = surface ?? (isDark ? "dark" : "light");
  const resolved: SellaBrandFinish =
    finish ??
    (kind === "micro"
      ? isDark
        ? "white"
        : "black"
      : sellaGlassFinish(autoSurface));

  const src = sellaBrandSrc(kind, resolved);

  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <img
        src={src}
        alt={decorative ? "" : alt}
        aria-hidden={decorative || undefined}
        draggable={false}
        className={cn(
          "pointer-events-none select-none object-contain",
          imgClassName
        )}
      />
    </span>
  );
}
