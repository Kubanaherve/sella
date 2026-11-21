import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { accessLabel } from "@/lib/entitlements";
import { isNativeApp } from "@/lib/platform";
import { Button } from "@/components/ui/button";
import { AccountStatusModal } from "@/components/AccountStatusModal";

interface WriteGateProps {
  children: ReactNode;
  actionLabel?: string;
}

/**
 * Minimalist, store-compliant WriteGate inspired by Linear/Stripe design.
 * Blocks mutation actions when cloud subscription is expired or inactive.
 */
export function WriteGate({
  children,
  actionLabel = "This feature",
}: WriteGateProps) {
  const { canWrite, subscription, mode } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (mode === "local" || canWrite) return <>{children}</>;

  const statusText = accessLabel(subscription);

  return (
    <>
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 p-4 text-xs space-y-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
            <Lock className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {actionLabel} requires active Pro access
              </p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                {statusText}
              </span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              New transactions and stock adjustments require active organization entitlements.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between gap-2">
          {isNativeApp() ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="text-xs min-h-11 px-3 font-medium border-[#E5E7EB]"
            >
              View account status
            </Button>
          ) : (
            <Link
              to="/subscribe"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Manage subscription →
            </Link>
          )}
        </div>
      </div>

      <AccountStatusModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        featureName={actionLabel}
      />
    </>
  );
}
