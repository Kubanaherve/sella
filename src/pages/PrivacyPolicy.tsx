import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Mail, Globe, MapPin } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { BrandMark } from "@/components/BrandMark";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] font-sans antialiased selection:bg-[#0F172A] selection:text-white">
      {/* Top Navigation */}
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
            <span className="font-bold text-sm text-[#0F172A]">Sella Privacy</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-xs font-semibold text-[#0F172A]">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Apple App Store & Google Play Certified Legal Notice</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#6B7280]">
            Effective Date: 21 November 2026 · Governing Legal Entity: <strong>{COMPANY.legalName}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-[#111827]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">1. Scope & Commitment</h2>
            <p className="text-[#6B7280]">
              This Privacy Policy describes how <strong>{COMPANY.legalName}</strong> ("Sella", "we", "us", or "our") collects, uses, protects, and discloses personal and business information when you use the Sella mobile application (iOS and Android), web portal, and retail operating services.
            </p>
            <p className="text-[#6B7280]">
              Our data processing practices strictly comply with the <strong>Republic of Rwanda Law Nº 058/2021</strong> relating to the protection of personal data and privacy, the General Data Protection Regulation (GDPR) standards, Apple App Store Review Guidelines (Section 5.1.1), and Google Play Data Safety policies.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">2. Information We Collect</h2>
            <p className="text-[#6B7280]">
              We only collect data necessary to provide reliable Point of Sale, inventory tracking, customer credit ledgers, and digital storefront services:
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-[#E5E7EB]">
              <div>
                <strong className="text-[#111827]">Account & Shop Credentials:</strong> Owner full name, shop business name, Rwandan phone number (MTN/Airtel), email address, commercial trade sector, and hashed authentication credentials (PBKDF2-derived PIN).
              </div>
              <div>
                <strong className="text-[#111827]">Merchant Operational Data:</strong> Catalog inventory (item titles, variations, stock quantities, cost and selling prices), client contacts entered for credit tracking (names, phone numbers, repayment histories), and recorded sales receipts.
              </div>
              <div>
                <strong className="text-[#111827]">Payment & Subscription Metadata:</strong> Reference IDs, payment timestamps, billing plans (Free/Pro), and payment channel codes (e.g., MTN MoMo, Paypack, Flutterwave). We never store raw mobile money PINs or sensitive credit card PAN/CVV details.
              </div>
              <div>
                <strong className="text-[#111827]">Diagnostic & Device Data:</strong> Minimal technical information (device OS version, app bundle version, crash logs) required to ensure offline cache integrity and sync reliability.
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">3. How Third-Party Payment Gateways Process Data</h2>
            <p className="text-[#6B7280]">
              When you subscribe to Sella Pro or pay via Mobile Money, payment processing is handled by certified PCI-DSS compliant financial technology partners:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#6B7280]">
              <li><strong>MTN Rwanda Mobile Money:</strong> Processes direct USSD STK pushes (*182*8*1#) and sandbox test collections. Only your MSISDN phone number and invoice amount are transmitted.</li>
              <li><strong>Paypack Rwanda:</strong> Facilitates instant webhook notifications and merchant disbursements.</li>
              <li><strong>Flutterwave:</strong> Handles international Visa and Mastercard billing where applicable.</li>
            </ul>
            <p className="text-[#6B7280]">
              All communication between our servers and payment rails uses encrypted TLS 1.3 channels. We do not sell, rent, or monetize your financial data to advertisers or third-party data brokers.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">4. Self-Service Account & Data Deletion</h2>
            <p className="text-[#6B7280]">
              We believe in complete data sovereignty. In compliance with Apple App Store Guideline 5.1.1(v) and Google Play account deletion mandates:
            </p>
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-2 text-xs">
              <div className="font-semibold text-[#0F172A]">How to Delete Your Account:</div>
              <p className="text-[#6B7280]">
                1. <strong>Direct In-App / Web Self-Service:</strong> Log into your account, open <Link to="/settings" className="text-[#0F172A] font-semibold underline">Account Settings (/settings)</Link>, scroll to the bottom, and click <strong>"Permanently Delete Account"</strong>.
              </p>
              <p className="text-[#6B7280]">
                2. <strong>Public Deletion Request:</strong> If you are unable to log in, you can submit a direct erasure request at our public compliance portal at <Link to="/delete-account" className="text-[#0F172A] font-semibold underline">/delete-account</Link> or by emailing <strong>h.kubana@alustudent.com</strong>.
              </p>
              <p className="text-[#6B7280]">
                Once confirmed, all data associated with your shop—including inventory items, customer lists, debt ledgers, sales history, storage receipts, and authentication records—is permanently and irreversibly purged from our primary database within 72 hours.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">5. Data Security & Storage</h2>
            <p className="text-[#6B7280]">
              Data is stored using modern cloud database architecture with Row-Level Security (RLS) policies enforcing multi-tenant isolation. No merchant can access or query another shop's financial records. Client-side offline storage uses IndexedDB encryption on mobile and desktop devices.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">6. Contact Information & Data Protection Officer</h2>
            <p className="text-[#6B7280]">
              For privacy inquiries, data export requests, or regulatory questions under Rwanda Law Nº 058/2021, contact our data protection team:
            </p>
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-1.5 text-xs text-[#6B7280]">
              <div className="font-semibold text-[#111827]">{COMPANY.legalName}</div>
              <div>Founder & Lead Engineer: {COMPANY.founderName}</div>
              <div>Official Email: <a href="mailto:h.kubana@alustudent.com" className="text-[#0F172A] font-semibold underline">h.kubana@alustudent.com</a></div>
              <div>Support: use the form on the Support page, or email the address above.</div>
              <div>Headquarters: Kigali, Republic of Rwanda</div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <div>© {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-[#0F172A]">Terms of Service</Link>
            <Link to="/support" className="hover:text-[#0F172A]">Support</Link>
            <Link to="/delete-account" className="hover:text-[#0F172A]">Account Erasure</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
