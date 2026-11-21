import { useState, useCallback } from "react";
import { RefreshCw, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { accessLabel } from "@/lib/entitlements";
import { accountHost } from "@/lib/site";
import { toast } from "sonner";
import { hapticLight } from "@/lib/haptics";

export interface AccountStatusModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
  actionRequired?: boolean;
}

/**
 * Store-Compliant Account Status Modal (Apple App Store & Google Play Compliant).
 *
 * Compliance Checklist:
 * - Guideline 3.1.3(b) Multi-platform Services & Reader rules:
 *   1. NO clickable external payment/checkout links or anchors.
 *   2. NO in-app pricing numbers or promotional discount messaging.
 *   3. Informative plain-text explanation that organization subscriptions are managed in the browser.
 *   4. Instant foreground/manual entitlement re-sync trigger ("Check status").
 */
export function AccountStatusModal({
  open,
  onClose,
  featureName,
}: AccountStatusModalProps) {
  const { subscription, refreshSubscription, profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const host = accountHost();
  const statusText = accessLabel(subscription);

  const shopName =
    profile && "business_name" in profile && profile.business_name
      ? String(profile.business_name)
      : null;

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border border-[#E5E7EB] bg-white shadow-none rounded-2xl">
        {/* Top Minimalist Brand Banner */}
        <div className="p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#E5E7EB] bg-[#FAFAFA] text-[#111827]">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold tracking-tight text-[#111827]">
                Pro plan
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                {shopName || "Shop account"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-4 space-y-4 text-left">
          {/* Status Badge Block */}
          <div className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[#6B7280]">Account status</span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#E5E7EB] text-[#111827]">
              {statusText}
            </span>
          </div>

          {/* Compliant Microcopy (Plain text, no external checkout links, no in-app pricing) */}
          <div className="space-y-2 text-sm leading-relaxed text-[#6B7280]">
            <p>
              {featureName ? `${featureName} is part of the Pro plan.` : "This feature is part of the Pro plan."}{" "}
              Membership is not managed in the mobile app.
            </p>
            <p className="text-[#111827]">
              You can manage your account at {host}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-neutral-50/80 dark:bg-neutral-800/30 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs min-h-11 gap-1.5 border-[#E5E7EB]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Checking…" : "Check status"}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="text-xs min-h-11 px-4 font-semibold"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
