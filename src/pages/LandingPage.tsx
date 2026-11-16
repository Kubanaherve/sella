import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  HelpCircle,
  Lock,
  Menu,
  MessageCircle,
  Moon,
  Package,
  Printer,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  TrendingUp,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { PhoneMockup, type ScreenId } from "@/components/landing/PhoneMockup";
import { DesktopMockup } from "@/components/landing/DesktopMockup";
import { InteractiveShowcase } from "@/components/landing/InteractiveShowcase";
import { DownloadCenter } from "@/components/marketing/DownloadCenter";
import { Seo } from "@/components/marketing/Seo";
import { useTheme } from "@/contexts/ThemeContext";
import { COMPANY } from "@/lib/company";
import { getAnnualPriceRwf, getMonthlyPriceRwf } from "@/lib/entitlements";
import { annualSavingsRwf, formatRwf } from "@/lib/plans";

export default function LandingPage() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("pos");
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleAppearance, isDark } = useTheme();
  const monthlyLabel = formatRwf(getMonthlyPriceRwf());
  const annualLabel = formatRwf(getAnnualPriceRwf());
  const savingsLabel = formatRwf(annualSavingsRwf());

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] text-slate-900 dark:text-slate-100 relative overflow-x-hidden selection:bg-[#1A6FFF] selection:text-white transition-colors duration-300">
      <Seo
        title="Sella — Sales, stock, and credit for your shop"
        description="Sella is shop software from KUBANA Friend TECHNOLOGIES. Record sales, customer credit, and inventory. Start with a free trial."
        path="/"
      />
      {/* ── Skip to Main Content (Accessibility) ── */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {/* ── Ambient Liquid Glowing Orbs ── */}
      <div
        className="liquid-orb liquid-orb--blue w-[500px] h-[500px] -top-32 -left-32"
        aria-hidden="true"
      />
      <div
        className="liquid-orb liquid-orb--cyan w-[420px] h-[420px] top-[30%] -right-40"
        aria-hidden="true"
      />
      <div
        className="liquid-orb liquid-orb--purple w-[480px] h-[480px] bottom-10 left-[20%]"
        aria-hidden="true"
      />

      {/* ── Sticky Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <BrandMark variant="icon" size="sm" framed={false} />
              <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Sella</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-white/70">
            <a href="#showcase" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Platform
            </a>
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Pricing
            </a>
            <Link to="/download" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Download
            </Link>
            <Link to="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">
              <BookOpen size={13} className="text-[#1A6FFF]" />
              <span>User Guide</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleAppearance}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
              title={isDark ? "Light mode (Urumuri)" : "Dark mode (Ijoro)"}
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-700" />}
            </button>

            <Link
              to="/login"
              className="text-xs font-semibold text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
            <Link to="/subscribe" className="hidden sm:block">
              <Button size="sm" className="btn-gold h-9 px-4 text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20">
                Pay with MoMo
              </Button>
            </Link>
            <button
              type="button"
              className="md:hidden w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 inline-flex items-center justify-center"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="md:hidden border-t border-slate-200/80 dark:border-white/10 px-4 py-3 grid gap-1 bg-white/95 dark:bg-slate-950/95">
            <a href="#features" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 text-sm font-semibold">Features</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 text-sm font-semibold">Pricing</a>
            <Link to="/download" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 text-sm font-semibold">Download</Link>
            <Link to="/about" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 text-sm font-semibold">About</Link>
            <Link to="/support" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 text-sm font-semibold">Support</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="px-2 py-2.5 text-sm font-bold text-[#1A6FFF]">Open the web app</Link>
          </nav>
        )}
      </header>

      {/* ── Main Hero Section ── */}
      <main id="main">
        <section className="relative z-10 pt-12 pb-16 px-4 sm:px-6 max-w-7xl mx-auto text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800 dark:text-white/90 tracking-wide">
              Built for Rwanda Retail & Hardware Shops · MTN MoMo & Offline-first
            </span>
          </div>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
            Your Entire Shop in Your Pocket.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300 bg-clip-text text-transparent">
              Zero Stress.
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-white/70 max-w-2xl mx-auto leading-relaxed font-normal">
            Fast credit sales, WhatsApp debt reminders, receipts, and inventory. Use Sella in the browser today. The same account opens in the phone and desktop apps when those builds are published.
          </p>

          {/* Hero Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link to="/subscribe" className="w-full sm:w-auto">
              <Button size="lg" className="btn-gold w-full sm:w-auto h-12 px-7 text-sm font-bold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                <span>Start free trial</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link
              to="/download"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-sm border border-slate-200 dark:border-white/15 backdrop-blur-md transition-all shadow-sm"
            >
              <Download size={16} className="text-[#1A6FFF]" />
              <span>Get the app</span>
            </Link>
          </div>

          {/* Micro Guarantee Chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-white/60">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" /> 7-day free trial
            </span>
            <span className="text-slate-300 dark:text-white/20">·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" /> Pay with MTN *182# or Airtel
            </span>
            <span className="text-slate-300 dark:text-white/20">·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" /> Works completely offline
            </span>
          </div>

          {/* ── Multi-Device Showcase (MacBook + Phone Companion Duo) ── */}
          <div id="showcase" className="mt-14 max-w-5xl mx-auto scroll-mt-24">
            <div className="grid lg:grid-cols-12 gap-8 items-center mb-8">
              {/* Dual Devices: MacBook Laptop with overlapping Phone */}
              <div className="lg:col-span-7">
                <DesktopMockup />
              </div>

              {/* 3D Hardware Phone */}
              <div className="lg:col-span-5 flex justify-center">
                <PhoneMockup
                  activeScreen={activeScreen}
                  onScreenChange={setActiveScreen}
                />
              </div>
            </div>

            {/* Interactive Tabbed Micro-App Selector */}
            <div className="max-w-3xl mx-auto">
              <InteractiveShowcase
                activeScreen={activeScreen}
                onScreenChange={setActiveScreen}
              />
            </div>
          </div>
        </section>

        {/* ── Features Grid Section ── */}
        <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-white/10 relative z-10 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1A6FFF]">
              Engineered for Retailers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Everything your counter needs to run smoothly
            </h2>
            <p className="text-sm text-slate-600 dark:text-white/60">
              Say goodbye to lost paper notebooks, messy Excel sheets, and debt disputes with customers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="feature-glow-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#1A6FFF] border border-blue-500/20 flex items-center justify-center">
                <MessageCircle size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">1-Click WhatsApp Reminders</h3>
              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                Customers who owe you money receive a polite, branded WhatsApp reminder in Kinyarwanda detailing their outstanding balance and due date.
              </p>
            </div>

            <div className="feature-glow-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Smartphone size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instant MoMo Payments (*182#)</h3>
              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                Accept MTN MoMo and Airtel Money directly. Fast STK push notifications prompt customers or shop owners to approve with their PIN in seconds.
              </p>
            </div>

            <div className="feature-glow-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Printer size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">58mm / 80mm Thermal Receipts</h3>
              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                Connect any standard Bluetooth or USB ESC/POS thermal printer. Print crisp receipts with your shop name, logo, phone, and itemized lines.
              </p>
            </div>

            <div className="feature-glow-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <WifiOff size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">100% Offline-First (Dexie)</h3>
              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                Network drops in Kigali or upcountry? Sella keeps selling offline and automatically syncs changes to the cloud as soon as you reconnect.
              </p>
            </div>

            <div className="feature-glow-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center">
                <Package size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inventory & Barcode Scanner</h3>
              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                Scan product barcodes using your phone camera. Track stock levels, low-quantity alerts, cost prices, and profit margins effortlessly.
              </p>
            </div>

            <div className="feature-glow-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bank-Grade Tenant Isolation</h3>
              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                Every shop is assigned a unique Shop Code. Supabase Row Level Security ensures your business data is 100% private and protected.
              </p>
            </div>
          </div>
        </section>

        {/* ── Workflow Section ── */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-white/10 relative z-10 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1A6FFF]">
              Simple 4-Step Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              How Sella runs your business every day
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none text-left space-y-3 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#1A6FFF]/15 text-[#1A6FFF] font-black text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">4-Digit PIN Unlock</h4>
              <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                Open the app every morning. Enter your 4-digit PIN on the dial pad. No passwords to forget.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none text-left space-y-3 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#1A6FFF]/15 text-[#1A6FFF] font-black text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Make Quick Sales</h4>
              <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                Select products or scan barcodes. Split payment between Cash & Mobile Money with exact change.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none text-left space-y-3 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#1A6FFF]/15 text-[#1A6FFF] font-black text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Recover Debts</h4>
              <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                Track due dates. Tap one button to dispatch WhatsApp reminders directly to customer phones.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none text-left space-y-3 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#1A6FFF]/15 text-[#1A6FFF] font-black text-sm flex items-center justify-center">
                4
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Print Receipts</h4>
              <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                Print to your 58mm/80mm thermal machine or send high-res PDF invoices instantly.
              </p>
            </div>
          </div>
        </section>

        {/* ── Pricing Section ── */}
        <section id="pricing" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-white/10 relative z-10 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1A6FFF]">
              Honest Rwanda Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Affordable plans. Pay directly with MoMo.
            </h2>
            <p className="text-sm text-slate-600 dark:text-white/60">
              No credit cards needed. Enjoy a 7-day free trial before you pay a single franc.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
            {/* Monthly Plan */}
            <div className="p-8 rounded-3xl text-left flex flex-col justify-between space-y-6 bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/40 dark:shadow-2xl">
              <div className="space-y-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-[#1A6FFF] border border-blue-500/20">
                  Monthly Plan
                </span>
                <div>
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{monthlyLabel}</p>
                  <p className="text-xs text-slate-500 dark:text-white/60 mt-1">Billed every 30 days via Mobile Money</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-white/80 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Unlimited sales & orders
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Customer debts ledger & WhatsApp reminders
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Full inventory management & barcode scanning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> 58mm / 80mm thermal receipt printing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Cloud database backup & sync
                  </li>
                </ul>
              </div>

              <Link to="/subscribe" className="block pt-4">
                <Button className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold h-12 rounded-2xl text-xs transition-colors">
                  Subscribe Monthly ({monthlyLabel})
                </Button>
              </Link>
            </div>

            {/* Annual Plan */}
            <div className="p-8 rounded-3xl text-left flex flex-col justify-between space-y-6 border-2 border-[#1A6FFF] relative overflow-hidden bg-gradient-to-b from-blue-50/70 to-white dark:from-[#1A6FFF]/10 dark:to-transparent shadow-xl shadow-blue-500/10">
              <div className="absolute top-0 right-0 bg-[#1A6FFF] text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider">
                Best Value (Save {savingsLabel})
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#1A6FFF] text-white">
                  Annual Plan
                </span>
                <div>
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{annualLabel}</p>
                  <p className="text-xs text-slate-500 dark:text-white/60 mt-1">Billed annually · save {savingsLabel}</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-white/80 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#1A6FFF]" /> Everything in Monthly plan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#1A6FFF]" /> Save {savingsLabel} versus twelve monthly payments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#1A6FFF]" /> Priority WhatsApp & phone onboarding
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#1A6FFF]" /> Staff account training support
                  </li>
                </ul>
              </div>

              <Link to="/subscribe" className="block pt-4">
                <Button className="w-full btn-gold font-bold h-12 rounded-2xl text-xs shadow-lg shadow-blue-500/30">
                  Subscribe Annual ({annualLabel})
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── App Store & Download Section ── */}
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-white/10 relative z-10">
          <DownloadCenter />
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/80 dark:border-white/10 py-12 px-4 sm:px-6 max-w-7xl mx-auto text-xs text-slate-500 dark:text-white/50 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <BrandMark variant="icon" size="xs" framed={false} />
            <span className="font-bold text-slate-900 dark:text-white text-sm">Sella</span>
            <span>· {COMPANY.legalName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/download" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Download
            </Link>
            <Link to="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              About
            </Link>
            <Link to="/support" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Support
            </Link>
            <Link to="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Documentation
            </Link>
            <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/delete-account" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Data Erasure
            </Link>
            <a href={`mailto:${COMPANY.businessEmail}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {COMPANY.businessEmail}
            </a>
          </div>
        </div>

        <p className="text-center sm:text-left mt-8 text-[11px] text-slate-400 dark:text-white/40">
          © {new Date().getFullYear()} {COMPANY.legalName}. Sella is a product of the company. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
