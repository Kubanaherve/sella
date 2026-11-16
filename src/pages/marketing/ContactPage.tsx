import { FormEvent, useState } from "react";
import { MarketingIntro, MarketingShell } from "@/components/marketing/MarketingShell";
import { Seo } from "@/components/marketing/Seo";
import { COMPANY } from "@/lib/company";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2 || message.trim().length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setNotice("Add your name, a valid email, and a message of at least 10 characters.");
      return;
    }
    const subject = `Sella contact from ${name.trim()}`;
    const body = `${message.trim()}\n\nFrom: ${name.trim()}\nEmail: ${email.trim()}`;
    setNotice("Your email app is opening. The message is sent only after you press send there.");
    window.location.href = `mailto:${COMPANY.businessEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <MarketingShell>
      <Seo
        title="Contact KUBANA Friend TECHNOLOGIES"
        description="Contact KUBANA Friend TECHNOLOGIES about Sella. The form opens your email app. It does not pretend a message was delivered."
        path="/contact"
      />
      <MarketingIntro
        kicker="Contact"
        title="Write to the company"
        lede={`Messages go to ${COMPANY.businessEmail}. This form does not store the note on a server.`}
      />
      <form onSubmit={onSubmit} className="max-w-xl mx-auto px-4 pb-20 space-y-3">
        <label className="block text-xs font-semibold" htmlFor="contact-name">
          Name
        </label>
        <input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 px-4 text-sm" />
        <label className="block text-xs font-semibold" htmlFor="contact-email">
          Email
        </label>
        <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 px-4 text-sm" />
        <label className="block text-xs font-semibold" htmlFor="contact-message">
          Message
        </label>
        <textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 px-4 py-3 text-sm" />
        <button type="submit" className="h-12 px-5 rounded-2xl bg-[#1A6FFF] text-white text-sm font-bold">
          Open email
        </button>
        <p className="text-xs text-slate-500 dark:text-white/55" role="status">
          {notice || `You can also email ${COMPANY.businessEmail} directly.`}
        </p>
      </form>
    </MarketingShell>
  );
}
