import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="sella-list-card flex flex-col items-center text-center py-12 px-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
        <Icon className="text-primary dark:text-[#5AC8FA]" size={26} strokeWidth={2} />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button className="h-11 px-6 rounded-xl font-bold sella-btn-glass-solid" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
