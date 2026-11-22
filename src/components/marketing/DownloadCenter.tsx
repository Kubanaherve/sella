import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Laptop,
  Monitor,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { t, type CatalogueId } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import { GooglePlayBadge, AppStoreBadge, WindowsBadge, MacBadge } from "@/components/marketing/StoreBadges";

export function DownloadCenter() {
  useAppLanguage();
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + "/signup");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* ── STORE PLATFORM CARDS GRID ── */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 text-left">
        {/* 1. APPLE APP STORE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                {/* Official Apple Logo SVG */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.66-7.85-11.9-14.34-6.3-9.74-11.2-20.89-14.7-33.44-3.5-12.56-5.25-24.3-5.25-35.24 0-14.07 3.5-25.75 10.5-35.05 7-9.3 15.82-14.05 26.47-14.25 4.9 0 10.27 1.25 16.12 3.75 5.85 2.5 9.77 3.75 11.75 3.75 1.74 0 5.76-1.29 12.06-3.87 6.3-2.58 11.8-3.72 16.5-3.41 12.55.76 22.42 5.37 29.62 13.84-11.08 6.74-16.51 16.03-16.3 27.87.21 9.35 3.86 17.15 10.95 23.4 7.09 6.25 15.54 9.8 25.35 10.66-2.5 7.4-5.38 14.67-8.65 21.82zM119.22 31.85c0-7.07 2.61-13.78 7.82-20.13 5.22-6.35 11.74-10.25 19.58-11.72.33 1.09.5 2.07.5 2.94 0 6.96-2.67 13.6-8.02 19.93-5.34 6.32-11.74 10.23-19.19 11.73-.22-.98-.44-1.93-.69-2.85v.1z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0B3FCC] border border-blue-200">
                iOS 15.0+
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{t("WEB-092" as CatalogueId)}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {t("WEB-093" as CatalogueId)}
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-085" as CatalogueId)}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-086" as CatalogueId)}</span>
              </li>
            </ul>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-5">
            <AppStoreBadge size="full" />
          </div>
        </div>

        {/* 2. GOOGLE PLAY STORE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                {/* Official Google Play Logo SVG */}
                <svg className="w-6 h-6" viewBox="0 0 512 512">
                  <path fill="#4285F4" d="M47.8 19.2C41.7 25.6 38.3 35.8 38.3 49v414c0 13.2 3.4 23.4 9.5 29.8l1.6 1.4L275 268.6v-5.2L49.4 17.8l-1.6 1.4z" />
                  <path fill="#FBBC04" d="M354.4 348l-79.4-79.4v-5.2l79.4-79.4 1.8 1 93.9 53.4c26.8 15.2 26.8 40.2 0 55.4l-93.9 53.4-1.8 1.2z" />
                  <path fill="#EA4335" d="M356.2 346.8L275 266 47.8 493.2c8.8 9.4 23.4 10.4 39.8 1.2l268.6-147.6z" />
                  <path fill="#34A853" d="M356.2 165.2L87.6 17.6C71.2 8.4 56.6 9.4 47.8 18.8L275 246l81.2-80.8z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Android 8.0+
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{t("WEB-095" as CatalogueId)}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {t("WEB-096" as CatalogueId)}
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-084" as CatalogueId)}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-063" as CatalogueId)}</span>
              </li>
            </ul>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-5">
            <GooglePlayBadge size="full" />
          </div>
        </div>

        {/* 3. WINDOWS DESKTOP APP */}
        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-xs flex flex-col justify-between ring-1 ring-blue-500/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#0078D7] text-white flex items-center justify-center shadow-xs">
                {/* Official Microsoft Windows SVG */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 88 88">
                  <path d="M0 12.402l35.689-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.016 45.719zm4.326-39.027L87.914 0v41.527l-47.918.378zm47.929 44.925v41.77L39.996 81.02V46.685z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0B3FCC] border border-blue-200 uppercase">
                {t("WEB-142" as CatalogueId)}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{t("WEB-098" as CatalogueId)}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {t("WEB-099" as CatalogueId)}
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-087" as CatalogueId)}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-088" as CatalogueId)}</span>
              </li>
            </ul>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-5">
            <WindowsBadge size="full" />
          </div>
        </div>

        {/* 4. MACOS DESKTOP APP */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center shadow-xs border border-slate-200">
                <Laptop size={22} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Apple Silicon & Intel
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{t("WEB-101" as CatalogueId)}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {t("WEB-102" as CatalogueId)}
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-089" as CatalogueId)}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-136" as CatalogueId)}</span>
              </li>
            </ul>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-5">
            <MacBadge size="full" />
          </div>
        </div>

        {/* 5. INSTANT WEB APP / PWA */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-200">
                <Zap size={22} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {t("WEB-137" as CatalogueId)}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{t("WEB-104" as CatalogueId)}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {t("WEB-105" as CatalogueId)}
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-046" as CatalogueId)}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t("WEB-138" as CatalogueId)}</span>
              </li>
            </ul>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-5">
            <Link
              to="/signup"
              className="inline-flex min-h-11 items-center justify-center gap-2 w-full rounded-xl bg-[#0B3FCC] hover:bg-[#0932A3] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <ExternalLink size={14} />
              <span>{t("WEB-106" as CatalogueId)}</span>
            </Link>
          </div>
        </div>

        {/* 6. INSTANT PHONE QR CODE SCANNER */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t("WEB-139" as CatalogueId)}
              </span>
              <QrCode size={18} className="text-slate-500" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{t("WEB-107" as CatalogueId)}</h3>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                {t("WEB-108" as CatalogueId)}
              </p>
            </div>

            {/* Generated QR Code Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-center">
              <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none">
                {/* QR Pattern Representation */}
                <rect width="100" height="100" fill="white" />
                <path
                  d="M10 10h30v30H10zM16 16v18h18V16H16zM22 22h6v6h-6zM60 10h30v30H60zM66 16v18h18V16H66zM72 22h6v6h-6zM10 60h30v30H10zM16 66v18h18V66H16zM22 72h6v6h-6zM46 10h8v8h-8zM46 26h8v8h-8zM46 42h8v8h-8zM10 46h8v8h-8zM26 46h8v8h-8zM42 46h8v8h-8zM58 46h8v8h-8zM74 46h8v8h-8zM90 46h8v8h-8zM60 60h8v8h-8zM76 60h8v8h-8zM68 68h8v8h-8zM84 68h8v8h-8zM60 76h8v8h-8zM76 76h8v8h-8zM68 84h8v8h-8zM84 84h8v8h-8z"
                  fill="#071225"
                />
              </svg>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-xs font-semibold text-[#0B3FCC] hover:underline flex items-center justify-center gap-1.5 w-full py-1"
            >
              <span>{copiedLink ? `✓ ${t("WEB-141" as CatalogueId)}` : t("WEB-140" as CatalogueId)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ASSURANCE BANNER ── */}
      <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/70 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-[#0B3FCC] shrink-0" />
          <span className="font-medium">
            {t("WEB-047" as CatalogueId)}
          </span>
        </div>
        <Link
          to="/pricing"
          className="font-bold text-[#0B3FCC] hover:underline shrink-0"
        >
          {t("WEB-002" as CatalogueId)} &rarr;
        </Link>
      </div>
    </div>
  );
}
