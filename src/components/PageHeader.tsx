import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string | number;
  right?: ReactNode;
  /** Hide back when shown inside a primary tab */
  hideBack?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  backTo = -1,
  right,
  hideBack = false,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sella-app-header">
      <div className="flex items-center gap-3 min-w-0">
        {!hideBack && (
          <button
            type="button"
            aria-label="Back"
            onClick={() => {
              if (typeof backTo === "number") navigate(backTo);
              else navigate(backTo);
            }}
            className="w-9 h-9 rounded-2xl bg-primary/10 dark:bg-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-transform border border-primary/10 dark:border-white/10"
          >
            <ArrowLeft size={18} className="text-primary" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {right && (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-[55%]">
          {right}
        </div>
      )}
    </header>
  );
}
