import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ListPageSkeleton({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 sella-stagger", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card sella-card-enter p-4 flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
