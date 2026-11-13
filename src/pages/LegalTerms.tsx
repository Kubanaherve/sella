import { Link } from "react-router-dom";
import { BRAND } from "@/lib/brand";

const LegalTermsPage = () => (
  <div className="min-h-screen bg-transparent text-foreground p-6 max-w-2xl mx-auto pb-[max(2rem,env(safe-area-inset-bottom),var(--sella-safe-bottom-floor))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
    <Link to="/" className="text-sm text-primary">← Back</Link>
    <h1 className="text-2xl font-bold mt-4 mb-2">{BRAND.name} Terms of Service</h1>
    <p className="text-xs text-muted-foreground mb-6">Last updated: 12 November 2026</p>
    <div className="prose prose-sm space-y-4 text-sm leading-relaxed">
      <p>
        These Terms govern your use of the {BRAND.name} multi-tenant business management software
        (the &quot;Service&quot;), operated for merchants in Rwanda and beyond.
      </p>
      <h2 className="font-semibold text-base">1. Account & eligibility</h2>
      <p>
        You must provide accurate business and contact information. You are responsible for PIN/OTP
        security and all activity under your account. Phone authentication may use WhatsApp delivery.
      </p>
      <h2 className="font-semibold text-base">2. Subscriptions & trial</h2>
      <p>
        New accounts receive a 7-day free trial. After trial, continued write access requires an active
        paid plan (monthly or annual) paid via MTN/Airtel MoMo (Paypack), manual MoMo, Rwandan bank
        transfer, or applicable app-store billing on iOS. Prices are shown in-app in RWF.
      </p>
      <h2 className="font-semibold text-base">3. Acceptable use</h2>
      <p>
        You may only use the Service for lawful business record-keeping. You must not attempt to
        access other tenants&apos; data, abuse OTP delivery, or submit fraudulent payment proofs.
      </p>
      <h2 className="font-semibold text-base">4. Data & export</h2>
      <p>
        You own your customer and inventory data. You may export reports/PDFs while your account exists.
        Deleting your account permanently removes associated cloud data subject to legal retention needs.
      </p>
      <h2 className="font-semibold text-base">5. Liability</h2>
      <p>
        The Service is provided &quot;as is&quot;. To the fullest extent permitted by law, we are not liable for
        lost profits or data arising from misuse, network failures, or third-party payment rails.
      </p>
      <h2 className="font-semibold text-base">6. Contact</h2>
      <p>Support requests: use in-app Account settings or the email published on our website.</p>
    </div>
  </div>
);

export default LegalTermsPage;
