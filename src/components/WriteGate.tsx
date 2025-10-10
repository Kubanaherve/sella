import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { accessLabel, getConfiguredPriceRwf } from "@/lib/entitlements";
import { labels } from "@/lib/kinyarwanda";

/** Blocks create/edit UI when trial/paid access expired. Read/export still allowed. */
export function WriteGate({
  children,
  actionLabel = "Iki gikorwa",
}: {
  children: ReactNode;
  actionLabel?: string;
}) {
  const { canWrite, subscription, mode } = useAuth();
  if (mode === "local" || canWrite) return <>{children}</>;

  const price = getConfiguredPriceRwf().toLocaleString();

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 space-y-2">
      <p className="font-semibold">
        {actionLabel} {labels.writeRequiresSub}
      </p>
      <p>{accessLabel(subscription)}</p>
      <p>{labels.renewMoMoMonth(price)}</p>
      <Link to="/billing" className="inline-flex text-primary font-medium underline">
        {labels.openBilling}
      </Link>
    </div>
  );
}
