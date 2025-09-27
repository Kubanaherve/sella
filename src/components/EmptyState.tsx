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
    <div className="rounded-3xl border border-border/80 bg-white shadow-sm flex flex-col items-center text-center py-12 px-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="text-primary" size={26} strokeWidth={2} />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button className="h-11 px-6 rounded-xl font-bold" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
