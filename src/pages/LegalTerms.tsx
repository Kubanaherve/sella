import { Link } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { BrandMark } from "@/components/BrandMark";

export default function LegalTermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] font-sans antialiased selection:bg-[#0F172A] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Sella</span>
          </Link>

          <div className="flex items-center gap-2">
            <BrandMark variant="icon" size="xs" framed={false} />
            <span className="font-bold text-sm text-[#0F172A]">Terms of Service</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-xs font-semibold text-[#0F172A]">
            <FileText size={14} className="text-[#0F172A]" />
            <span>Commercial SaaS Terms of Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
            Terms of Service
          </h1>
          <p className="text-sm text-[#6B7280]">
            Last updated: 21 November 2026 · Operator: <strong>{COMPANY.legalName}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-[#111827]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">1. Agreement to Terms</h2>
            <p className="text-[#6B7280]">
              These Terms of Service ("Terms") constitute a legally binding agreement between you (whether individually or representing a business entity) and <strong>{COMPANY.legalName}</strong> ("Company", "we", "us", or "our"), governing your access to and use of the Sella shop application, website, and billing portal (collectively, the "Service").
            </p>
            <p className="text-[#6B7280]">
              By creating an account, downloading the mobile app, or accessing the web billing portal, you agree to be bound by these Terms. If you do not agree, do not access or use the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">2. Shop Accounts & Security</h2>
            <p className="text-[#6B7280]">
              To access merchant features, you must register a shop account by providing accurate business, telephone, and identity information. You are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#6B7280]">
              <li>Maintaining the confidentiality of your 4-digit security PIN and account passwords.</li>
              <li>All activities that occur under your shop code and staff accounts.</li>
              <li>Ensuring that cashier staff members follow appropriate operational security procedures when processing cash and digital collections.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">3. Subscriptions, Trials & Billing Terms</h2>
            <p className="text-[#6B7280]">
              Sella starts with a 7-day trial, then Normal or Pro:
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-[#E5E7EB]">
              <div>
                <strong className="text-[#111827]">7-Day Full Trial:</strong> New accounts receive complete access to all commercial tools for 7 days at no charge. No payment card or Mobile Money commitment is required to start the trial.
              </div>
              <div>
                <strong className="text-[#111827]">Normal and Pro:</strong> After the trial, recording new sales requires an active plan. Normal is 27,000 RWF per month or 270,000 RWF per year. Pro is 48,500 RWF per month or 485,000 RWF per year. Annual billing includes two months free.
              </div>
              <div>
                <strong className="text-[#111827]">Payment Rails:</strong> Payments on the web are processed via MTN Mobile Money, Airtel Money, or major payment cards through approved payment providers.
              </div>
              <div>
                <strong className="text-[#111827]">Grace Period:</strong> Paid subscriptions include a 3-day grace period following period expiration to ensure business continuity while renewal is arranged.
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">4. Refund Policy</h2>
            <p className="text-[#6B7280]">
              We strive to provide fair and transparent subscription management:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#6B7280]">
              <li>If you experience a duplicate charge or technical error during Mobile Money checkout, you may request a full refund within <strong>7 days</strong> of the transaction date.</li>
              <li>To request a refund, send the transaction reference and the phone number used to pay to <a href="mailto:h.kubana@alustudent.com" className="text-[#0F172A] font-semibold underline">h.kubana@alustudent.com</a>.</li>
              <li>Verified duplicate charges will be reversed back to your originating Mobile Money wallet or card within 3 to 5 business days.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">5. Data Ownership & Content</h2>
            <p className="text-[#6B7280]">
              You retain 100% intellectual property ownership of all business records, inventory catalogs, customer debt ledgers, and sales logs entered into the Service. We do not claim any ownership rights over your commercial data. You may export or download electronic receipts and reports at any time.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">6. Limitation of Liability</h2>
            <p className="text-[#6B7280]">
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted by applicable Rwandan law, {COMPANY.legalName} shall not be liable for any indirect, incidental, or consequential damages resulting from telecommunication network outages, device hardware faults, or external payment gateway downtime.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">7. Governing Law & Dispute Resolution</h2>
            <p className="text-[#6B7280]">
              These Terms shall be governed by and construed in accordance with the laws of the <strong>Republic of Rwanda</strong>. Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts of Kigali, Rwanda.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <div>© {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-[#0F172A]">Privacy Policy</Link>
            <Link to="/support" className="hover:text-[#0F172A]">Support & Help</Link>
            <Link to="/delete-account" className="hover:text-[#0F172A]">Data Erasure</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
