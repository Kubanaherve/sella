import { useState } from "react";
import { MarketingIntro, MarketingShell } from "@/components/marketing/MarketingShell";
import { Seo } from "@/components/marketing/Seo";
import { COMPANY } from "@/lib/company";
import { formatRwf, trialLengthDays } from "@/lib/plans";
import { getAnnualPriceRwf, getMonthlyPriceRwf } from "@/lib/entitlements";

export default function FaqPage() {
  const days = trialLengthDays();
  const items = [
    {
      q: "Is there a free plan?",
      a: `New shops get a ${days}-day free trial with the full counter. After that, recording new sales needs Pro. You can still open the account to renew.`,
    },
    {
      q: "What does Pro cost?",
      a: `${formatRwf(getMonthlyPriceRwf())} prepaid for a month, or ${formatRwf(getAnnualPriceRwf())} prepaid for a year. The price on the checkout screen is the price that is charged.`,
    },
    {
      q: "Will you charge my MoMo again automatically?",
      a: "No. Website payments are for a period you choose. When that period ends, you pay again if you want to keep recording sales.",
    },
    {
      q: "Can I subscribe on the website and use the phone app?",
      a: "Yes, once you sign into the same account. If you buy inside the iPhone or Android app after those apps are on the stores, that purchase follows Apple or Google billing rules and is verified before the account is updated.",
    },
    {
      q: "Where are the Mac, Windows, iPhone, and Android downloads?",
      a: "They are listed on the download page. A button links out only when an official address is configured. Until then the card says coming soon.",
    },
    {
      q: "Does Sella work without internet?",
      a: "The counter can keep selling from the local database. Cloud backup and subscription checks need a connection.",
    },
    {
      q: "How do I delete my data?",
      a: "Use Delete account on the website, or Account inside the app. That request is the erasure path described in the privacy policy.",
    },
    {
      q: "Who owns Sella?",
      a: `${COMPANY.legalName} owns Sella. Support email: ${COMPANY.businessEmail}.`,
    },
  ];

  return (
    <MarketingShell>
      <Seo
        title="Sella FAQ"
        description="Answers about Sella pricing, trials, offline use, downloads, and the company behind the product."
        path="/faq"
      />
      <MarketingIntro kicker="FAQ" title="Straight answers" lede="If a download or a payment is not live, we say so." />
      <div className="max-w-3xl mx-auto px-4 pb-16 space-y-2">
        {items.map((item) => (
          <FaqItem key={item.q} question={item.q} answer={item.a} />
        ))}
      </div>
    </MarketingShell>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04]">
      <button type="button" className="w-full text-left px-4 py-4 font-semibold text-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {question}
      </button>
      {open && <p className="px-4 pb-4 text-sm text-slate-600 dark:text-white/70 leading-relaxed">{answer}</p>}
    </div>
  );
}
