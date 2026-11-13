import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { sellaBrandSrc, sellaGlassFinish } from "@/lib/sellaBrand";
import { useThemeOptional } from "@/contexts/ThemeContext";

type Size = "sm" | "md" | "lg" | "xl" | "hero";

const SIZE: Record<Size, string> = {
  sm: "h-7 w-auto",
  md: "h-10 w-auto",
  lg: "h-14 w-auto",
  xl: "h-20 w-auto sm:h-24",
  hero: "h-24 w-auto sm:h-28 md:h-32",
};

type Props = {
  size?: Size;
  className?: string;
  glow?: boolean;
};

/**
 * Official glass wordmark — follows manual app appearance (not phone system).
 */
export function GlassWordmark({ size = "md", className, glow = false }: Props) {
  const { isDark } = useThemeOptional();
  const finish = sellaGlassFinish(isDark ? "dark" : "light");

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(90,200,250,0.35)_0%,transparent_70%)] blur-xl"
        />
      )}
      <img
        src={sellaBrandSrc("wordmark", finish)}
        alt={BRAND.name}
        className={cn(
          "relative z-[1] select-none object-contain drop-shadow-[0_8px_24px_rgba(11,63,204,0.35)]",
          SIZE[size]
        )}
        draggable={false}
      />
    </div>
  );
}
