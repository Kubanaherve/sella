import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Soft glass-style route enter: fade + slight rise + light blur settle.
 */
export function PageTransition({ children, className }: Props) {
  const location = useLocation();
  const [tick, setTick] = useState(0);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;
    setTick((n) => n + 1);
  }, [location.pathname]);

  return (
    <div
      key={tick}
      className={cn("sella-page-enter h-full min-h-0", className)}
    >
      {children}
    </div>
  );
}
