import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMPANY } from "@/lib/company";
import { BrandMark } from "@/components/BrandMark";
import { toast } from "sonner";
import { t, type CatalogueId } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";

export default function SupportPage() {
  const lang = useAppLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email, and message");
      return;
    }

    setSending(true);

    // Prepare direct mailto intent so message delivery is guaranteed
    const subjectPrefix =
      subject === "app_review"
        ? "[App Store Reviewer Help]"
        : subject === "billing"
        ? "[Billing & Subscription]"
        : subject === "deletion"
        ? "[Account Deletion Request]"
        : "[Support Request]";

    const mailSubject = `${subjectPrefix} Inquiry from ${name.trim()}`;
    const mailBody = `Name: ${name.trim()}\nEmail: ${email.trim()}\nTopic: ${subject}\n\nMessage:\n${message.trim()}\n\nSent via Sella Web Support Hub.`;

    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      toast.success("Thank you! Opening your email client to dispatch the message.");
      window.location.href = `mailto:${COMPANY.businessEmail}?subject=${encodeURIComponent(
        mailSubject
      )}&body=${encodeURIComponent(mailBody)}`;
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] font-sans antialiased selection:bg-[#0F172A] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{t("WEB-126" as CatalogueId)}</span>
          </Link>

          <div className="flex items-center gap-2">
            <BrandMark variant="icon" size="xs" framed={false} />
            <span className="font-bold text-sm text-[#0F172A]">{t("WEB-127" as CatalogueId)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5E7EB] bg-white text-xs font-semibold text-[#0F172A]">
            <HelpCircle size={14} className="text-[#0F172A]" />
            <span>{t("WEB-128" as CatalogueId)}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
            {t("WEB-129" as CatalogueId)}
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            {t("WEB-130" as CatalogueId)}
          </p>
        </div>

        {/* Notice for App Store & Google Play Reviewers */}
        <section className="bg-white rounded-2xl border border-blue-200 p-6 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1 text-xs leading-relaxed text-[#6B7280]">
            <h3 className="font-bold text-sm text-[#0F172A]">
              Notice for Apple App Store & Google Play Reviewers
            </h3>
            <p>
              This official support hub fulfills store review requirements for active customer communication, complaint resolution, and data erasure requests.
              For reviewer sandbox testing, you can sign in to the web or mobile app using reviewer demo credentials, or test Mobile Money checkout using MTN Sandbox test number{" "}
              <code className="font-mono font-semibold text-[#0F172A] bg-[#FAFAFA] px-1 py-0.5 rounded border border-[#E5E7EB]">
                46733123454
              </code>.
            </p>
          </div>
        </section>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[#0F172A]">
              <Mail size={18} />
            </div>
            <div>
              <div className="font-bold text-sm text-[#0F172A]">Email Support</div>
              <div className="text-xs text-[#6B7280] mt-1">Direct inquiries & billing questions</div>
            </div>
            <a
              href="mailto:h.kubana@alustudent.com"
              className="text-xs font-semibold text-[#0F172A] hover:underline block pt-1"
            >
              h.kubana@alustudent.com
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[#0F172A]">
              <Phone size={18} />
            </div>
            <div>
              <div className="font-bold text-sm text-[#0F172A]">Shop questions</div>
              <div className="text-xs text-[#6B7280] mt-1">Sales, stock, customer credit, and billing. Monday – Saturday, 8am – 7pm CAT.</div>
            </div>
            <a
              href="mailto:h.kubana@alustudent.com"
              className="text-xs font-semibold text-[#0F172A] hover:underline block pt-1"
            >
              Email the team
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[#0F172A]">
              <MapPin size={18} />
            </div>
            <div>
              <div className="font-bold text-sm text-[#0F172A]">Kigali Headquarters</div>
              <div className="text-xs text-[#6B7280] mt-1">{COMPANY.legalName}</div>
            </div>
            <div className="text-xs text-[#6B7280] pt-1">
              Kigali, Republic of Rwanda
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <section className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-10 shadow-xs">
          <div className="max-w-2xl space-y-2 mb-8">
            <h2 className="text-xl font-bold text-[#0F172A]">{t("WEB-131" as CatalogueId)}</h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Fill in the form below. We typically respond to merchant inquiries within 4 business hours.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-emerald-950">Message Initiated</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Your email client has been opened with your inquiry. If your client did not open automatically, please send your note directly to <strong>h.kubana@alustudent.com</strong>.
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs"
                >
                  Send Another Message
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">
                    {t("WEB-132" as CatalogueId)}
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Alex Nkurunziza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={sending}
                    className="h-11 text-sm bg-white border-[#E5E7EB] rounded-xl focus-visible:ring-1 focus-visible:ring-[#0F172A]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">
                    {t("WEB-133" as CatalogueId)}
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={sending}
                    className="h-11 text-sm bg-white border-[#E5E7EB] rounded-xl focus-visible:ring-1 focus-visible:ring-[#0F172A]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">
                  Inquiry Topic
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sending}
                  className="w-full h-11 px-3 text-sm bg-white border border-[#E5E7EB] rounded-xl text-[#111827] focus:outline-hidden focus:ring-1 focus:ring-[#0F172A]"
                >
                  <option value="general">General Question</option>
                  <option value="billing">Billing & Mobile Money Payments</option>
                  <option value="app_review">App Store / Google Play Reviewer Query</option>
                  <option value="pos_inventory">POS & Inventory Configuration</option>
                  <option value="deletion">Account & Data Deletion</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">
                  {t("WEB-134" as CatalogueId)}
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe your inquiry or question in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  className="w-full p-3.5 text-sm bg-white border border-[#E5E7EB] rounded-xl text-[#111827] focus:outline-hidden focus:ring-1 focus:ring-[#0F172A]"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full sm:w-auto px-6 h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Dispatching message…</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send size={14} />
                      <span>{t("WEB-135" as CatalogueId)}</span>
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* Helpful Resources Links */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E5E7EB]">
          <Link
            to="/docs"
            className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] transition-colors block text-xs space-y-1"
          >
            <div className="font-semibold text-[#0F172A]">Documentation & Guide</div>
            <p className="text-[#6B7280]">Learn how to record sales, add inventory, and export reports.</p>
          </Link>

          <Link
            to="/delete-account"
            className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] transition-colors block text-xs space-y-1"
          >
            <div className="font-semibold text-[#0F172A]">Account & Data Erasure</div>
            <p className="text-[#6B7280]">Self-service and public data deletion requests.</p>
          </Link>

          <Link
            to="/terms"
            className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] transition-colors block text-xs space-y-1"
          >
            <div className="font-semibold text-[#0F172A]">Terms of Service</div>
            <p className="text-[#6B7280]">App usage rules, Pro subscriptions, and refund guidelines.</p>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <div>© {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-[#0F172A]">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#0F172A]">Terms of Service</Link>
            <Link to="/delete-account" className="hover:text-[#0F172A]">Data Erasure</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
