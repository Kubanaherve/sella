import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Laptop, Monitor, Smartphone, TabletSmartphone } from "lucide-react";
import { COMPANY } from "@/lib/company";
import {
  detectVisitorPlatform,
  platformEnvFromImportMeta,
  resolvePlatformCatalog,
  type PlatformId,
  type PlatformOffer,
} from "@/lib/platforms";

const ICONS: Record<PlatformId, typeof Smartphone> = {
  ios: TabletSmartphone,
  android: Smartphone,
  macos: Laptop,
  windows: Monitor,
  web: Globe,
};

function mailtoFor(platform: PlatformOffer, email: string): string {
  const subject = `Sella ${platform.name} launch request`;
  const body = `Please email ${email} when the official Sella ${platform.name} download is published.\n\nCompany: ${COMPANY.legalName}`;
  return `mailto:${COMPANY.businessEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function DownloadCenter() {
  const visitor = useMemo(
    () => detectVisitorPlatform(typeof navigator === "undefined" ? "" : navigator.userAgent, typeof navigator === "undefined" ? "" : navigator.platform),
    []
  );
  const offers = useMemo(
    () => resolvePlatformCatalog(platformEnvFromImportMeta(import.meta.env), visitor),
    [visitor]
  );
  const recommended = offers.find((offer) => offer.recommended) ?? offers[offers.length - 1];
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const requestLaunch = (offer: PlatformOffer) => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setNote("Enter a valid email. This opens your mail app — nothing is stored until you send the message.");
      return;
    }
    setNote(`Your email app will open a launch request for ${offer.name}. Send the message to finish.`);
    window.location.href = mailtoFor(offer, trimmed);
  };

  return (
    <section id="download" className="scroll-mt-24">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1A6FFF]">Get Sella</span>
        <h2 className="text-3xl sm:text-4xl font-black">Five ways in. One account.</h2>
        <p className="text-sm text-slate-600 dark:text-white/65 leading-relaxed">
          Recommended for this visit: <strong className="text-slate-900 dark:text-white">{recommended.name}</strong>.
          Store and installer buttons appear only after that build is published.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => {
          const Icon = ICONS[offer.id];
          const live = offer.status === "available" && !!offer.href;
          return (
            <article
              key={offer.id}
              className={`rounded-3xl border p-5 flex flex-col gap-4 bg-white/90 dark:bg-white/[0.04] shadow-sm ${
                offer.recommended ? "border-[#1A6FFF]" : "border-slate-200/80 dark:border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1A6FFF]/10 text-[#1A6FFF] flex items-center justify-center">
                  <Icon size={20} />
                </div>
                {offer.recommended ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#1A6FFF]">Recommended</span>
                ) : null}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">{offer.name}</h3>
                <p className="text-xs text-slate-500 dark:text-white/55">{offer.store}</p>
                <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed pt-1">{offer.blurb}</p>
              </div>
              <div className="mt-auto space-y-2">
                {live && offer.href ? (
                  offer.href.startsWith("/") ? (
                    <Link
                      to={offer.href}
                      className="h-11 rounded-2xl bg-[#1A6FFF] text-white text-xs font-bold inline-flex items-center justify-center w-full"
                    >
                      {offer.action}
                    </Link>
                  ) : (
                    <a
                      href={offer.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 rounded-2xl bg-[#1A6FFF] text-white text-xs font-bold inline-flex items-center justify-center w-full"
                    >
                      {offer.action}
                    </a>
                  )
                ) : (
                  <>
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      Coming soon — no download link yet
                    </p>
                    <button
                      type="button"
                      onClick={() => requestLaunch(offer)}
                      className="h-11 rounded-2xl border border-slate-300 dark:border-white/15 text-xs font-bold w-full"
                    >
                      Email me when it launches
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <form
        className="mt-6 max-w-xl mx-auto flex flex-col sm:flex-row gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const pending = offers.find((offer) => offer.status === "coming_soon");
          if (!pending) {
            setNote("Every listed build already has an official link.");
            return;
          }
          requestLaunch(pending);
        }}
      >
        <label className="sr-only" htmlFor="launch-email">
          Email for launch notice
        </label>
        <input
          id="launch-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@shop.com"
          autoComplete="email"
          className="flex-1 h-11 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 px-4 text-sm"
        />
        <button type="submit" className="h-11 px-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold">
          Request a launch email
        </button>
      </form>
      <p className="text-center text-[11px] text-slate-500 dark:text-white/50 mt-3 max-w-xl mx-auto" role="status">
        {note ||
          "A launch request opens your email app to KUBANA Friend TECHNOLOGIES. It is not saved on a server until you send it."}
      </p>
    </section>
  );
}
