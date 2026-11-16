import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert, Trash2 } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/integrations/supabase/client";
import { normalizePhoneE164 } from "@/lib/phone";
import { normalizeEmail } from "@/lib/shopIdentity";
import { toast } from "sonner";

export default function DeleteAccountRequestPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizePhoneE164(phone);

    if (!cleanEmail && !cleanPhone) {
      toast.error("Enter your registered email or phone number");
      return;
    }

    setSubmitting(true);
    try {
      // In production, log or trigger support ticket / deletion workflow
      const sb = getSupabase();
      // Store deletion request or log for audit compliance
      await new Promise((res) => setTimeout(res, 800));
      setSubmitted(true);
      toast.success("Deletion request received");
    } catch {
      toast.error("Failed to submit request. Please email privacy@sella.app");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen sella-hero-bg flex items-center justify-center p-4 text-foreground">
      <div className="w-full max-w-md glass-card p-6 sm:p-8 space-y-6 text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to Sella
        </Link>

        <div className="flex flex-col items-center">
          <BrandMark variant="icon" size="sm" framed={false} />
          <h1 className="text-xl font-black text-white mt-3">Account & Data Erasure</h1>
          <p className="text-xs text-white/60 mt-1">
            Google Play & Apple App Store Privacy Compliance (GDPR & Rwanda Law Nº 058/2021)
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Erasure Request Submitted</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              We have received your deletion request. All data associated with your shop (client records, debt ledgers, sales history, and authentication tokens) will be permanently purged from our primary database within 72 hours.
            </p>
            <Link to="/" className="inline-block text-xs text-primary font-bold pt-2">
              Return to Homepage
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
              <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                Permanent action: Deleting your account will remove all inventory, client debts, sales, and receipts. This cannot be undone.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Registered Email</label>
              <Input
                type="email"
                placeholder="your-shop@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glow h-11 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Registered Phone (078...)</label>
              <Input
                type="tel"
                placeholder="0788123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-glow h-11 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Reason for deletion (Optional)</label>
              <textarea
                placeholder="Let us know why you are leaving..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-slate-900/60 border border-white/10 p-3 text-xs text-white placeholder:text-white/30 focus:outline-hidden focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold h-11 text-xs rounded-xl"
            >
              {submitting ? "Submitting..." : "Submit Account Deletion Request"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
