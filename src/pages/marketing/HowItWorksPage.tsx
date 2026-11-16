import { Link } from "react-router-dom";
import { MarketingIntro, MarketingShell } from "@/components/marketing/MarketingShell";
import { Seo } from "@/components/marketing/Seo";
import { trialLengthDays } from "@/lib/plans";

export default function HowItWorksPage() {
  const days = trialLengthDays();
  const steps = [
    {
      title: "Create the shop",
      body: "Register the shop name, your name, phone, and a 4-digit PIN. Sella gives the shop a code you can keep at the counter.",
    },
    {
      title: "Unlock and sell",
      body: "Each return opens the PIN pad for that shop. Add a sale, take cash or mobile money, or leave the rest as credit.",
    },
    {
      title: "Follow the balance",
      body: "Open debts, record a payment, or send a WhatsApp reminder with the amount still owed.",
    },
    {
      title: "Keep the same account",
      body: `The ${days}-day trial and Pro plan live on the account, not on one device. Sign in on the web app now. Phone and desktop apps use that same account when their stores are live.`,
    },
  ];

  return (
    <MarketingShell>
      <Seo
        title="How Sella works"
        description="Create a shop, unlock with a PIN, record sales and credit, and keep the same Sella account on every released app."
        path="/how-it-works"
      />
      <MarketingIntro
        kicker="How it works"
        title="From the first PIN to the next payment"
        lede="Four steps. No separate product for each device."
      />
      <ol className="max-w-3xl mx-auto px-4 pb-16 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] p-6 flex gap-4">
            <span className="w-9 h-9 rounded-full bg-[#1A6FFF]/15 text-[#1A6FFF] font-black text-sm inline-flex items-center justify-center shrink-0">
              {index + 1}
            </span>
            <div>
              <h2 className="text-lg font-bold">{step.title}</h2>
              <p className="text-sm text-slate-600 dark:text-white/70 mt-1 leading-relaxed">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-center pb-16">
        <Link to="/login" className="inline-flex h-12 px-6 rounded-2xl bg-[#1A6FFF] text-white text-sm font-bold items-center">
          Start on the web
        </Link>
      </p>
    </MarketingShell>
  );
}
