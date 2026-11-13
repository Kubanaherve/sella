import { Link } from "react-router-dom";
import { BRAND } from "@/lib/brand";

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-transparent text-foreground p-6 max-w-2xl mx-auto pb-[max(2rem,env(safe-area-inset-bottom),var(--sella-safe-bottom-floor))] pt-[max(1.5rem,calc(var(--sella-safe-top-floor)+0.75rem),env(safe-area-inset-top))]">
    <Link to="/" className="text-sm text-primary">← Back</Link>
    <h1 className="text-2xl font-bold mt-4 mb-2">{BRAND.name} Privacy Policy</h1>
    <p className="text-xs text-muted-foreground mb-6">Last updated: 12 November 2026</p>
    <div className="space-y-4 text-sm leading-relaxed">
      <p>
        This Policy explains how {BRAND.name} processes personal data in line with GDPR principles and
        Rwanda Law Nº 058/2021 relating to the protection of personal data and privacy.
      </p>
      <h2 className="font-semibold text-base">1. Data we collect</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Account: phone number, business name, owner name, PIN-derived auth credentials</li>
        <li>Business records you enter: clients, debts, sales, inventory</li>
        <li>Billing: MoMo/bank references, receipt images, subscription status</li>
        <li>Device/app diagnostics needed to operate the Service</li>
      </ul>
      <h2 className="font-semibold text-base">2. Purposes & lawful bases</h2>
      <p>
        We process data to provide the Service (contract), secure accounts (legitimate interest /
        legal obligation), process subscriptions (contract), and comply with store / tax rules.
      </p>
      <h2 className="font-semibold text-base">3. Sharing</h2>
      <p>
        Processors may include Supabase (hosting/auth/DB), WhatsApp/Meta or Twilio (OTP delivery),
        Paypack (MoMo), and Apple/Google for store billing. We do not sell personal data.
      </p>
      <h2 className="font-semibold text-base">4. Retention & deletion</h2>
      <p>
        Data is retained while your account is active. Use &quot;Delete Account & All Data&quot; in Account
        settings to request erasure (Apple Guideline 5.1.1). Backups may lag briefly.
      </p>
      <h2 className="font-semibold text-base">5. Your rights</h2>
      <p>
        You may request access, correction, export, or deletion of your personal data, and lodge a
        complaint with the competent supervisory authority in Rwanda or your EEA country of residence.
      </p>
      <h2 className="font-semibold text-base">6. Contact</h2>
      <p>Privacy requests: via Account → support channel published in the app.</p>
    </div>
  </div>
);

export default PrivacyPolicyPage;
