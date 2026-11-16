import { MarketingIntro, MarketingShell } from "@/components/marketing/MarketingShell";
import { PricingCards } from "@/components/marketing/PricingCards";
import { Seo } from "@/components/marketing/Seo";
import { formatRwf, trialLengthDays } from "@/lib/plans";
import { getMonthlyPriceRwf } from "@/lib/entitlements";

export default function PricingPage() {
  const days = trialLengthDays();
  return (
    <MarketingShell>
      <Seo
        title="Sella pricing"
        description={`Start Sella free for ${days} days. Pro is ${formatRwf(getMonthlyPriceRwf())} per month, or pay annually. Payments are verified on the server.`}
        path="/pricing"
      />
      <MarketingIntro
        kicker="Pricing"
        title="Start free. Pay when the trial ends."
        lede="Pro is prepaid in Rwandan francs. A payment unlocks the account only after the server confirms it. Nothing in the browser can mark a payment as successful on its own."
      />
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <PricingCards />
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-16 text-sm text-slate-600 dark:text-white/70 space-y-3 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">How billing works across devices</h2>
        <p>
          A subscription bought on the website is stored on your Sella account. The Mac, Windows, Android, and iPhone apps read that same account when you sign in.
        </p>
        <p>
          Apple requires In-App Purchase for digital subscriptions sold inside the iOS app. Google Play has its own billing rules for the Android app. Those store purchases are verified with the store, then written to the same account. Buying on the website does not skip a store’s rules inside that store’s app.
        </p>
        <p>
          Sella Pro does not silently charge a card every month. You pay for a period. Access continues until that period ends, then you renew.
        </p>
      </div>
    </MarketingShell>
  );
}
