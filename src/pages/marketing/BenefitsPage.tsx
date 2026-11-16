import { Link } from "react-router-dom";
import { MarketingIntro, MarketingShell } from "@/components/marketing/MarketingShell";
import { Seo } from "@/components/marketing/Seo";

const BENEFITS = [
  {
    title: "Fewer lost debts",
    body: "Credit is a ledger, not a notebook page. Each balance has a customer, a remaining amount, and a reminder path.",
  },
  {
    title: "A counter that still works offline",
    body: "Shops in Kigali and upcountry lose signal. Sella keeps a local copy so a sale does not wait on the network.",
  },
  {
    title: "Customers get a clear message",
    body: "WhatsApp reminders use the shop’s own wording and the amount still owed, instead of a vague chase.",
  },
  {
    title: "Money stays in whole francs",
    body: "Amounts are handled as Rwandan franc integers so totals do not drift by a fraction of a franc.",
  },
  {
    title: "Your shop stays yours",
    body: "Cloud data is scoped to the signed-in shop. Another shop’s rows are not part of your account.",
  },
  {
    title: "One subscription, checked by the server",
    body: "The backend decides whether the shop can record new sales. A screen cannot grant itself Pro.",
  },
];

export default function BenefitsPage() {
  return (
    <MarketingShell>
      <Seo
        title="Why shops use Sella"
        description="Sella helps shops track credit, keep selling offline, remind customers on WhatsApp, and keep one account across devices."
        path="/benefits"
      />
      <MarketingIntro
        kicker="Benefits"
        title="Less chasing. A clearer counter."
        lede="Sella is built for shops that sell on credit, take MoMo, and need the books to match the drawer."
      />
      <div className="max-w-3xl mx-auto px-4 pb-16 space-y-4">
        {BENEFITS.map((item, index) => (
          <article key={item.title} className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] p-6">
            <p className="text-xs font-bold text-[#1A6FFF]">0{index + 1}</p>
            <h2 className="text-xl font-bold mt-1">{item.title}</h2>
            <p className="text-sm text-slate-600 dark:text-white/70 mt-2 leading-relaxed">{item.body}</p>
          </article>
        ))}
        <p className="text-sm text-center pt-4">
          <Link to="/how-it-works" className="font-semibold text-[#1A6FFF]">
            See how a day in the shop works
          </Link>
        </p>
      </div>
    </MarketingShell>
  );
}
