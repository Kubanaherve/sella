import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  HelpCircle,
  Laptop,
  Lock,
  Menu,
  MessageCircle,
  Monitor,
  Package,
  Play,
  Printer,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TabletSmartphone,
  Users,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Seo } from "@/components/marketing/Seo";
import { PhoneMockup, type ScreenId } from "@/components/landing/PhoneMockup";
import { InteractiveShowcase } from "@/components/landing/InteractiveShowcase";
import { RegisterTaskDemo } from "@/components/landing/RegisterTaskDemo";
import { PricingCards } from "@/components/marketing/PricingCards";
import { DownloadCenter } from "@/components/marketing/DownloadCenter";
import { GooglePlayBadge, AppStoreBadge } from "@/components/marketing/StoreBadges";
import { APP_LANGUAGES, t, type CatalogueId } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import { setAppLanguage, type AppLanguage } from "@/lib/appLanguage";
import { COMPANY } from "@/lib/company";
import { isNativeApp } from "@/lib/platform";

const SHOP_QUESTIONS = [
  {
    qId: "WEB-014",
    aId: "WEB-015",
    icon: <WifiOff className="text-[#0B3FCC]" size={20} />,
  },
  {
    qId: "WEB-016",
    aId: "WEB-017",
    icon: <MessageCircle className="text-emerald-600" size={20} />,
  },
  {
    qId: "WEB-018",
    aId: "WEB-019",
    icon: <Lock className="text-[#0B3FCC]" size={20} />,
  },
  {
    qId: "WEB-020",
    aId: "WEB-021",
    icon: <Printer className="text-blue-600" size={20} />,
  },
] as const;

export default function LandingPage() {
  const lang = useAppLanguage();
  const rw = lang === "rw";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenId>("pos");
  const native = isNativeApp();

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-[#0B3FCC] selection:text-white antialiased overflow-x-hidden"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <Seo
        title={
          rw
            ? "Sella — Imashini yo kugurisha, sitoki n'amadeni ya shop"
            : "Sella — Shop POS Register, Stock & Customer Credit"
        }
        description={
          rw
            ? "Imashini yo kugurisha ku meza, gucunga sitoki n'igitabo cy'amadeni (Ideni) mu Rwanda. Ikomeza kugurisha interineti ihise."
            : "Shop counter POS register, inventory tracking, and customer credit book for Rwandan merchants. It keeps selling when the internet drops."
        }
        path="/"
      />

      {/* ── Accessibility: Skip to Main Content ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#0B3FCC] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-md"
      >
        {t("WEB-113" as CatalogueId)}
      </a>

      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-all shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Mark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Sella">
            <BrandMark variant="icon" size="sm" framed={false} />
            <span className="text-lg font-bold tracking-tight text-slate-900">Sella</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600"
            aria-label="Main Navigation"
          >
            <a href="#demo" className="hover:text-slate-900 transition-colors">
              {t("WEB-001" as CatalogueId)}
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">
              {t("WEB-002" as CatalogueId)}
            </a>
            <a href="#downloads" className="hover:text-slate-900 transition-colors">
              {t("WEB-003" as CatalogueId)}
            </a>
            <Link to="/support" className="hover:text-slate-900 transition-colors">
              {t("WEB-049" as CatalogueId)}
            </Link>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Language Selector */}
            <div className="relative">
              <label htmlFor="landing-lang" className="sr-only">
                {t("WEB-051" as CatalogueId)}
              </label>
              <select
                id="landing-lang"
                value={lang}
                onChange={(e) => setAppLanguage(e.target.value as AppLanguage)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0B3FCC]/30 cursor-pointer"
              >
                {APP_LANGUAGES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sign in & Trial CTA */}
            {!native && (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                {t("WEB-004" as CatalogueId)}
              </Link>
            )}

            {!native && (
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#0B3FCC] hover:bg-[#0932A3] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>{t("WEB-005" as CatalogueId)}</span>
                <ArrowRight size={13} />
              </Link>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 inline-flex items-center justify-center text-slate-700 hover:bg-slate-50"
              aria-label={mobileMenuOpen ? t("WEB-053" as CatalogueId) : t("WEB-052" as CatalogueId)}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 text-sm font-medium text-slate-700 animate-in fade-in slide-in-from-top-2">
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-slate-900"
            >
              {t("WEB-001" as CatalogueId)}
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-slate-900"
            >
              {t("WEB-002" as CatalogueId)}
            </a>
            <a
              href="#downloads"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-slate-900"
            >
              {t("WEB-003" as CatalogueId)}
            </a>
            <Link
              to="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-slate-900"
            >
              {t("WEB-049" as CatalogueId)}
            </Link>
            {!native && (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-xs font-semibold rounded-lg border border-slate-200 text-slate-800"
                >
                  {t("WEB-004" as CatalogueId)}
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-xs font-bold rounded-lg bg-[#0B3FCC] text-white"
                >
                  {t("WEB-005" as CatalogueId)}
                </Link>
              </div>
            )}
          </nav>
        )}
      </header>

      <main id="main-content">
        {/* ── HERO SECTION ── */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200 bg-gradient-to-b from-blue-50/40 via-white to-white overflow-hidden">
          {/* Ambient Liquid Orbs */}
          <div
            className="liquid-orb liquid-orb--blue w-[500px] h-[500px] -top-32 -left-32 opacity-40"
            aria-hidden="true"
          />
          <div
            className="liquid-orb liquid-orb--cyan w-[420px] h-[420px] top-40 right-[-100px] opacity-30"
            aria-hidden="true"
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
              {/* Left Column: Headline, Description & Actions */}
              <div className="space-y-6 text-left">
                {/* Tahoe Liquid Blue Glass Eyebrow Badge */}
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full backdrop-blur-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-600/10 border border-[#0B3FCC]/30 dark:border-blue-400/40 text-xs font-semibold text-[#0B3FCC] dark:text-blue-300 shadow-[0_4px_20px_-2px_rgba(11,63,204,0.18),inset_0_1px_1px_0_rgba(255,255,255,0.8)] hover:border-[#0B3FCC]/60 transition-all duration-300 group">
                  <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B3FCC] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B3FCC] shadow-[0_0_8px_#0B3FCC]"></span>
                  </span>
                  <span className="tracking-tight font-medium">{t("WEB-059" as CatalogueId)}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.1] max-w-xl">
                  {t("WEB-006" as CatalogueId)}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                  {t("WEB-007" as CatalogueId)}
                </p>

                {/* Call to Actions & Official Store Badges */}
                {!native && (
                  <div className="space-y-3.5 pt-1">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Link
                        to="/signup"
                        className="min-h-12 px-6 rounded-xl bg-[#0B3FCC] hover:bg-[#0932A3] text-white font-bold text-sm shadow-md shadow-blue-600/20 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <span>{t("WEB-005" as CatalogueId)}</span>
                        <ArrowRight size={16} />
                      </Link>

                      <a
                        href="#demo"
                        className="min-h-12 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <Play size={15} className="text-[#0B3FCC] fill-current" />
                        <span>{t("WEB-060" as CatalogueId)}</span>
                      </a>
                    </div>

                    {/* Official Google Play & App Store Badges */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <GooglePlayBadge size="sm" />
                      <AppStoreBadge size="sm" />
                    </div>
                  </div>
                )}

                {/* 4 Shop Proof Metrics */}
                <div className="pt-4 border-t border-slate-200/80 grid grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="font-medium">{t("WEB-109" as CatalogueId)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="font-medium">{t("WEB-110" as CatalogueId)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="font-medium">{t("WEB-111" as CatalogueId)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="font-medium">{t("WEB-112" as CatalogueId)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Realistic iPhone 16 Pro Frame with Animated Screen Carousel */}
              <div className="relative flex justify-center py-6">
                <PhoneMockup
                  activeScreen={activeScreen}
                  onScreenChange={setActiveScreen}
                  autoPlay={true}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── MULTI-SCREEN INTERACTIVE SHOWCASE SECTION ── */}
        <section id="demo" className="py-16 md:py-24 bg-white border-b border-slate-200 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B3FCC]">
                {t("WEB-001" as CatalogueId)}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {t("WEB-114" as CatalogueId)}
              </h2>
              <p className="text-sm text-slate-600">
                {t("WEB-115" as CatalogueId)}
              </p>
            </div>

            {/* Interactive Tab Switcher & Details */}
            <InteractiveShowcase
              activeScreen={activeScreen}
              onScreenChange={setActiveScreen}
            />

            {/* Live Scenario Story (Igurisha -> Ideni -> Ububiko) */}
            <div className="pt-8 border-t border-slate-100">
              <div className="max-w-2xl mb-6 space-y-1 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  {t("WEB-116" as CatalogueId)}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t("WEB-117" as CatalogueId)}
                </p>
              </div>
              <RegisterTaskDemo />
            </div>
          </div>
        </section>

        {/* ── CONCRETE SHOP QUESTIONS (Editorial FAQ) ── */}
        <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12 space-y-2 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B3FCC]">
              {t("WEB-118" as CatalogueId)}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t("WEB-119" as CatalogueId)}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {SHOP_QUESTIONS.map((item) => (
              <div
                key={item.qId}
                className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {t(item.qId as CatalogueId)}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {t(item.aId as CatalogueId)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING SECTION ── */}
        <section id="pricing" className="py-16 md:py-24 bg-white border-y border-slate-200 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B3FCC]">
                {t("WEB-002" as CatalogueId)}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {t("WEB-120" as CatalogueId)}
              </h2>
              <p className="text-sm text-slate-600">
                {t("WEB-121" as CatalogueId)}
              </p>
            </div>

            <PricingCards />
          </div>
        </section>

        {/* ── DOWNLOAD HUB SECTION (App Store, Google Play, Windows, Mac, Web) ── */}
        <section id="downloads" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B3FCC]">
              {t("WEB-003" as CatalogueId)}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t("WEB-090" as CatalogueId)}
            </h2>
            <p className="text-sm text-slate-600">
              {t("WEB-091" as CatalogueId)}
            </p>
          </div>

          {/* Official Store Badges & Download Cards */}
          <DownloadCenter />
        </section>
      </main>

      {/* ── OFFICIAL FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-8 text-xs text-slate-600">
          <div className="space-y-3 max-w-sm text-left">
            <div className="flex items-center gap-2">
              <BrandMark variant="icon" size="xs" framed={false} />
              <span className="font-bold text-sm text-slate-900">Sella</span>
              <span>· {COMPANY.legalName}</span>
            </div>
            <p className="leading-relaxed">
              {t("WEB-122" as CatalogueId)}
            </p>
            <p className="text-slate-500">
              Kigali, Rwanda · {t("WEB-049" as CatalogueId)}:{" "}
              <a href={`mailto:${COMPANY.businessEmail}`} className="text-[#0B3FCC] hover:underline">
                {COMPANY.businessEmail}
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 font-medium text-left">
            <Link to="/login" className="hover:text-slate-900 transition-colors">
              {t("WEB-004" as CatalogueId)}
            </Link>
            <Link to="/pricing" className="hover:text-slate-900 transition-colors">
              {t("WEB-002" as CatalogueId)}
            </Link>
            <Link to="/billing" className="hover:text-slate-900 transition-colors">
              {t("WEB-125" as CatalogueId)}
            </Link>
            <Link to="/support" className="hover:text-slate-900 transition-colors">
              {t("WEB-049" as CatalogueId)}
            </Link>
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">
              {t("MISC-011" as CatalogueId)}
            </Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">
              {t("MISC-010" as CatalogueId)}
            </Link>
            <Link to="/delete-account" className="text-red-600 hover:text-red-700 transition-colors">
              {t("WEB-050" as CatalogueId)}
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} {COMPANY.legalName}. {t("WEB-123" as CatalogueId)}</p>
          <p>
            {t("WEB-124" as CatalogueId)}
          </p>
        </div>
      </footer>
    </div>
  );
}
