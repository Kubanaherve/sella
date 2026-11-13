import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { hapticLight } from "@/lib/haptics";

type Props = {
  className?: string;
  /** Compact icon-only control */
  compact?: boolean;
};

/**
 * Manual light/dark switch — does not follow the phone system theme.
 */
export function ThemeToggle({ className, compact = false }: Props) {
  const { appearance, toggleAppearance, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={() => {
        void hapticLight();
        toggleAppearance();
      }}
      className={cn(
        "sella-press inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors",
        compact ? "h-10 w-10" : "h-12 w-full px-4 font-semibold text-sm",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {!compact && (
        <span>{isDark ? "Light glass mode" : "Dark glass mode"}</span>
      )}
      {!compact && (
        <span className="ml-auto text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {appearance}
        </span>
      )}
    </button>
  );
}
