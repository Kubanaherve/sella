import { useState, useCallback } from "react";
import { Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { accountHost } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { accessLabel, hasWriteAccess } from "@/lib/entitlements";
import { toast } from "sonner";
import { hapticLight } from "@/lib/haptics";

type NoticeProps = {
  status?: string | null;
  onDismiss?: () => void;
};

/**
 * Store-Safe Account Status Card (Apple App Store Guideline 3.1.3(b) & Google Play compliant).
 * The website is presented as plain text, never as a clickable anchor or payment button.
 */
export function ProMembershipNotice({ status, onDismiss }: NoticeProps) {
  const { subscription, refreshSubscription, canWrite } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const host = accountHost();
  const currentStatus = status || accessLabel(subscription);
  const isEntitled = hasWriteAccess(subscription) && canWrite;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    void hapticLight();
    try {
      await refreshSubscription();
      toast.success("Account status updated");
    } catch {
      toast.error("Unable to reach authentication server");
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSubscription]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-left shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isEntitled
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-neutral-100 border-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
          }`}
        >
          {isEntitled ? (
            <ShieldCheck className="w-5 h-5" />
          ) : (
            <Lock className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {isEntitled ? "Pro Account Active" : "Pro Plan Required"}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Retail Workspace
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Account Status
        </span>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            isEntitled
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
          }`}
        >
          {currentStatus}
        </span>
      </div>

      <div className="space-y-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
        <p>
          This feature requires an active Pro account. Membership changes are managed via your browser at{" "}
          <strong className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono tracking-tight select-all">
            {host}
          </strong>
          .
        </p>
      </div>

      <div className="pt-2 flex items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs h-9 min-h-[36px] gap-1.5 border-neutral-300 dark:border-neutral-700"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Checking…" : "Check status"}
        </Button>

        {onDismiss ? (
          <Button
            type="button"
            size="sm"
            onClick={onDismiss}
            className="text-xs h-9 min-h-[36px] px-4 font-semibold"
          >
            Done
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ProMembershipModal({
  open,
  status,
  onDismiss,
}: NoticeProps & { open: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 backdrop-blur-xs p-4 sm:items-center">
      <ProMembershipNotice status={status} onDismiss={onDismiss} />
    </div>
  );
}
