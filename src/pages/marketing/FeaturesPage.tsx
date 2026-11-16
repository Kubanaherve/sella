import { Link } from "react-router-dom";
import { MarketingIntro, MarketingShell } from "@/components/marketing/MarketingShell";
import { Seo } from "@/components/marketing/Seo";

const FEATURES = [
  {
    title: "Sales at the counter",
    body: "Record a sale, split cash and mobile money, and keep the line moving. Credit sales stay attached to the customer.",
  },
  {
    title: "Customer credit",
    body: "See who owes what, what is left, and when it is due. Send a WhatsApp reminder with the balance from the debt screen.",
  },
  {
    title: "Inventory",
    body: "Track quantities in the shop. Cloud sales deduct stock inside a database transaction so a failed checkout does not leave a half-written order.",
  },
  {
    title: "Receipts and invoices",
    body: "Print or share a PDF with the shop name and pay number. Customers get a record they can open on their phone.",
  },
  {
    title: "Offline counter",
    body: "The local database keeps selling when the network drops. Cloud mode syncs when the connection returns.",
  },
  {
    title: "One shop account",
    body: "A shop code, a phone, and a PIN. The same account is what the website, the web app, and future store apps recognize.",
  },
];

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <Seo
        title="Sella features — sales, credit, and stock"
        description="Sella features for shop sales, customer credit, inventory, receipts, offline selling, and one account across devices."
        path="/features"
      />
      <MarketingIntro
        kicker="Product"
        title="What the shop actually does in Sella"
        lede="These are the workflows in the product today. Phone and desktop store apps use this same account when they are published."
      />
      <div className="max-w-5xl mx-auto px-4 pb-16 grid md:grid-cols-2 gap-4">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="feature-glow-card space-y-2">
            <h2 className="text-lg font-bold">{feature.title}</h2>
            <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{feature.body}</p>
          </article>
        ))}
      </div>
      <p className="text-center pb-16 text-sm">
        <Link to="/pricing" className="text-[#1A6FFF] font-semibold">
          See pricing
        </Link>
        <span className="text-slate-400"> · </span>
        <Link to="/download" className="text-[#1A6FFF] font-semibold">
          Get the app
        </Link>
      </p>
    </MarketingShell>
  );
}
