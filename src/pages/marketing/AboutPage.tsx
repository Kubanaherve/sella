import { Link } from "react-router-dom";
import { MarketingIntro, MarketingShell } from "@/components/marketing/MarketingShell";
import { Seo } from "@/components/marketing/Seo";
import { COMPANY } from "@/lib/company";

export default function AboutPage() {
  return (
    <MarketingShell>
      <Seo
        title="About KUBANA Friend TECHNOLOGIES"
        description="Sella is shop software from KUBANA Friend TECHNOLOGIES, built in Rwanda for sales, stock, and customer credit."
        path="/about"
      />
      <MarketingIntro
        kicker="Company"
        title={COMPANY.legalName}
        lede="Sella is our shop product. The company owns it. The product keeps its own name."
      />
      <article className="max-w-3xl mx-auto px-4 pb-16 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-white/75">
        <p>
          {COMPANY.legalName} builds Sella for shops that sell goods, extend credit, and collect with mobile money. The company is based in {COMPANY.country}.
        </p>
        <p>
          Sella is the product customers use: the website, the web application, and the phone and desktop apps as they are released. Accounts, subscriptions, and shop records stay on one backend so a customer is the same person on every platform.
        </p>
        <p>Founder: {COMPANY.founderName}.</p>
        <p>
          Questions about the company go to{" "}
          <a className="text-[#1A6FFF] font-semibold" href={`mailto:${COMPANY.businessEmail}`}>
            {COMPANY.businessEmail}
          </a>
          .
        </p>
        <p>
          <Link to="/contact" className="text-[#1A6FFF] font-semibold">
            Contact
          </Link>
          <span> · </span>
          <Link to="/support" className="text-[#1A6FFF] font-semibold">
            Support
          </Link>
        </p>
      </article>
    </MarketingShell>
  );
}
