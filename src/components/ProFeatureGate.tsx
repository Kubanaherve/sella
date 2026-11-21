import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasProFeatures } from "@/lib/entitlements";
import { isNativeApp } from "@/lib/platform";
import { getAppLanguage } from "@/lib/appLanguage";
import { ProMembershipNotice } from "@/components/ProMembershipNotice";

/** Pro tools. Trial has full access. Normal does not. The plan comes from the server subscription row. */
export function ProFeatureGate({
  children,
  feature,
}: {
  children: ReactNode;
  feature: string;
}) {
  const { mode, subscription } = useAuth();
  if (mode === "local" || hasProFeatures(subscription)) return <>{children}</>;
  if (isNativeApp()) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <ProMembershipNotice />
      </div>
    );
  }
  const rw = getAppLanguage() === "rw";
  return (
    <div className="max-w-md mx-auto p-6">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <h1 className="text-lg font-semibold tracking-tight text-[#111827]">Pro</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
          {rw
            ? `${feature} iri muri gahunda ya Pro.`
            : `${feature} is part of the Pro plan.`}
        </p>
        <Link
          to="/subscribe?product=pro"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white"
        >
          {rw ? "Reba gahunda ya Pro" : "View the Pro plan"}
        </Link>
      </div>
    </div>
  );
}
