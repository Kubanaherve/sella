import { Link } from "react-router-dom";
import { MarketingIntro, MarketingShell } from "@/components/marketing/MarketingShell";
import { Seo } from "@/components/marketing/Seo";
import { COMPANY } from "@/lib/company";

const LINKS = [
  { to: "/docs", title: "User guide", body: "How to sell, track debts, and use the shop day to day." },
  { to: "/faq", title: "FAQ", body: "Trial, payments, devices, and account deletion." },
        { to: "/login", title: "Account and billing", body: "Sign in, then open Account to see your plan, features, and payment history." },
  { to: "/delete-account", title: "Delete your account", body: "Request erasure of the shop account and its data." },
  { to: "/privacy", title: "Privacy policy", body: "What we collect and why." },
  { to: "/contact", title: "Contact", body: `Email ${COMPANY.businessEmail}.` },
];

export default function SupportPage() {
  return (
    <MarketingShell>
      <Seo
        title="Sella support"
        description="Get help with Sella: user guide, billing, account deletion, and contact for KUBANA Friend TECHNOLOGIES."
        path="/support"
      />
      <MarketingIntro
        kicker="Support"
        title="Help for shop owners"
        lede="Start with the guide. For a billing or account problem, sign in and open Account, or write to the company."
      />
      <div className="max-w-3xl mx-auto px-4 pb-16 grid sm:grid-cols-2 gap-4">
        {LINKS.map((item) => (
          <Link key={item.to} to={item.to} className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] p-5 hover:border-[#1A6FFF] transition-colors">
            <h2 className="font-bold">{item.title}</h2>
            <p className="text-sm text-slate-600 dark:text-white/65 mt-2 leading-relaxed">{item.body}</p>
          </Link>
        ))}
      </div>
    </MarketingShell>
  );
}
