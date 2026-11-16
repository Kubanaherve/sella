import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { accessLabel, hasWriteAccess } from "@/lib/entitlements";
import { entitledFeatures } from "@/lib/plans";

export function CustomerPlanCard() {
  const navigate = useNavigate();
  const { subscription, canWrite } = useAuth();
  const features = entitledFeatures(subscription);
  const writing = hasWriteAccess(subscription) && canWrite;

  return (
    <div className="glass-card rounded-2xl border border-border/60 p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Plan</p>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${writing ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-800 dark:text-amber-200"}`}>
          {writing ? "Can record sales" : "Renew to record sales"}
        </span>
      </div>
      <p>{accessLabel(subscription)}</p>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Pro is prepaid. It stays active until the date above, then you pay again. A website payment and a future App Store or Google Play purchase both update this same account after the server verifies them. Buying on the website does not replace store billing inside those apps.
      </p>
      {subscription?.cancelAtPeriodEnd ? (
        <p className="text-[11px]">Renewal is turned off. Access lasts until the current period ends.</p>
      ) : null}
      <Button className="w-full" onClick={() => navigate("/subscribe")}>
        Upgrade, renew, or compare plans
      </Button>
    </div>
  );
}
