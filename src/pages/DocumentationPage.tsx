import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Lock,
  MessageCircle,
  Moon,
  Package,
  Printer,
  Search,
  ShieldCheck,
  Smartphone,
  Sun,
  WifiOff,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { isNativeApp } from "@/lib/platform";
import { ProMembershipNotice } from "@/components/ProMembershipNotice";

type DocSectionId =
  | "getting-started"
  | "pos-sales"
  | "debts-reminders"
  | "inventory"
  | "printers"
  | "billing"
  | "offline";

interface DocSection {
  id: DocSectionId;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<DocSectionId>("getting-started");
  const [search, setSearch] = useState("");
  const { toggleAppearance, isDark } = useTheme();

  const sections: DocSection[] = [
    {
      id: "getting-started",
      title: "1. Getting Started & PIN Login",
      icon: <Lock size={18} />,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Getting Started with Sella</h2>
          <p className="text-sm text-slate-600 dark:text-white/75 leading-relaxed">
            Sella is designed for daily speed in Rwandan retail shops. Instead of long, complex passwords that slow you down during morning rush hours, Sella secures each shop account with a **Rwanda phone number + 4-digit PIN**.
          </p>

          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Step-by-Step Activation</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 dark:text-white/80">
              <li>
                <strong>Download & Install:</strong> Install Sella from the Google Play Store or launch the application on your Android device.
              </li>
              <li>
                <strong>Register Your Shop:</strong> Enter your shop name (e.g. <em>Karegeya Boutique</em>), your owner name, email, and phone number (e.g. <code>0788 123 456</code>).
              </li>
              <li>
                <strong>Choose your 4-Digit PIN:</strong> Pick a memorable 4-digit secret PIN (e.g. <code>1111</code>).
              </li>
              <li>
                <strong>Instant Dialpad Login:</strong> Tap the numerical keys on your screen to log in immediately. Your session remains protected by rate limits (8 failed attempts triggers an automatic 15-minute lockout).
              </li>
            </ol>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 space-y-2 text-xs text-slate-700 dark:text-white/70">
            <p className="font-bold text-[#1A6FFF] flex items-center gap-1.5">
              <ShieldCheck size={16} /> Self-Serve PIN Reset
            </p>
            <p>
              Forgot your PIN? Tap <strong>"Forgot PIN"</strong> on the dialpad screen. Sella sends a verified OTP to your registered email address or phone so you can reset your PIN in seconds without calling customer support.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "pos-sales",
      title: "2. Counter Point of Sale (POS)",
      icon: <CreditCard size={18} />,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Counter Point of Sale (POS)</h2>
          <p className="text-sm text-slate-600 dark:text-white/75 leading-relaxed">
            Ring up sales with zero delays. Search items by name, barcode, or category tag, adjust quantities with 1 tap, and split payments between Cash and Mobile Money.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2 shadow-sm dark:shadow-none">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Split Payments</h4>
              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                Customer paying 10,000 FRW in Cash and the remaining 25,000 FRW via MTN MoMo? Tap <strong>Split</strong> to record both channels with individual audit references.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2 shadow-sm dark:shadow-none">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Exact Change Calculator</h4>
              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                Type the cash bill handed over by the customer (e.g. 5,000 FRW on a 3,200 FRW order) and Sella instantly displays the exact change due (1,800 FRW).
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "debts-reminders",
      title: "3. Debts & 1-Click WhatsApp",
      icon: <MessageCircle size={18} />,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Client Debt Ledger & WhatsApp Reminders</h2>
          <p className="text-sm text-slate-600 dark:text-white/75 leading-relaxed">
            In Rwanda, community trust and store credit (amadeni) drive retail volume. Sella helps you maintain flawless debt records and eliminates awkward money conversations with polite, automated reminders.
          </p>

          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">How to Send a WhatsApp Debt Reminder:</h3>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-white/80">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#1A6FFF] shrink-0 mt-0.5" />
                <span><strong>Record the Credit Sale:</strong> During checkout, select <em>"Ideni" (Credit)</em> and assign it to an existing client or quick-add a new client with their phone number.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#1A6FFF] shrink-0 mt-0.5" />
                <span><strong>View Outstanding Debts:</strong> Open the <strong>Amadeni</strong> tab to see your total receivables, overdue balances, and customer ledger.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#1A6FFF] shrink-0 mt-0.5" />
                <span><strong>1-Click WhatsApp Reminder:</strong> Tap "WhatsApp Reminder". Sella opens WhatsApp with a courteous, pre-formatted Kinyarwanda message: <em>"Muraho [Izina]! Tubibukije ko mufite ideni rya [Amount] FRW kuri [Shop Name]. Murakoze!"</em></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#1A6FFF] shrink-0 mt-0.5" />
                <span><strong>Partial Payment Tracking:</strong> Record partial repayments anytime. Sella automatically recalculates the remaining balance and logs the transaction history.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "inventory",
      title: "4. Inventory & Excel Import",
      icon: <Package size={18} />,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Inventory Management & Batch Import</h2>
          <p className="text-sm text-slate-600 dark:text-white/75 leading-relaxed">
            Keep track of quantities in real time. Sella automatically deducts stock when sales are finalized and alerts you when quantities drop below safe minimums.
          </p>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3 shadow-sm dark:shadow-none">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-emerald-500" /> Excel & CSV Bulk Import
            </h4>
            <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
              Have hundreds of products already listed in an Excel spreadsheet? Go to <strong>Inventory → Import Excel/CSV</strong>. Sella maps your columns (Item Name, Cost Price, Selling Price, Quantity, Category, Barcode) and imports them into your shop ledger in seconds.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "printers",
      title: "5. Thermal Printers (58mm / 80mm)",
      icon: <Printer size={18} />,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Bluetooth Thermal Receipt Printers</h2>
          <p className="text-sm text-slate-600 dark:text-white/75 leading-relaxed">
            Give your customers genuine printed receipts. Sella connects seamlessly to standard portable 58mm and counter 80mm ESC/POS thermal printers via Bluetooth or USB.
          </p>

          <div className="space-y-3 text-sm text-slate-700 dark:text-white/80">
            <p><strong>Configuring Your Printer:</strong></p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600 dark:text-white/75">
              <li>Turn on your Bluetooth thermal printer (e.g. POS-5802, Xprinter, Netum).</li>
              <li>Pair the printer in your Android device's Bluetooth settings (PIN is typically <code>0000</code> or <code>1234</code>).</li>
              <li>In Sella, complete any sale and tap <strong>"Print Thermal"</strong>. Sella routes ESC/POS formatting directly to your paired printer.</li>
              <li>You can customize your shop header, telephone, address, and receipt thank-you notes in <strong>Account → Receipt Settings</strong>.</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "billing",
      title: isNativeApp() ? "6. Pro plan" : "6. Subscriptions & MoMo Checkout",
      icon: <Smartphone size={18} />,
      content: isNativeApp() ? (
        <ProMembershipNotice />
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Pro plan</h2>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Every shop starts with a 7-day trial. After that, Pro is prepaid monthly or yearly.
          </p>
          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-2 text-sm text-[#111827]">
            <p className="font-semibold">Prices</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Monthly: 5,000 RWF</li>
              <li>Annual: 50,000 RWF</li>
            </ul>
            <p className="pt-1 text-[#6B7280]">
              Pay with MTN MoMo or Airtel Money from the website. The account updates when the payment is confirmed.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "offline",
      title: "7. Offline-First Architecture & Sync",
      icon: <WifiOff size={18} />,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Offline-First Resilience</h2>
          <p className="text-sm text-slate-600 dark:text-white/75 leading-relaxed">
            Internet in Kigali or upcountry commercial centers can occasionally drop. With Sella, your shop never stops operating.
          </p>

          <div className="space-y-3 text-sm text-slate-700 dark:text-white/80">
            <p>
              Sella uses an <strong>IndexedDB local cache (Dexie)</strong> combined with a resilient, transactional <strong>Outbox queue</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-white/75">
              <li>When offline, sales are saved securely to your local phone database.</li>
              <li>Receipts print immediately with an <em>Offline</em> receipt reference.</li>
              <li>The moment your device reconnects to Wi-Fi or 4G/5G, Sella's background outbox sync automatically uploads pending transactions to the Supabase cloud without duplicating entries.</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const current = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BrandMark variant="icon" size="sm" framed={false} />
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">Sella</span>
            </Link>
            <span className="hidden sm:inline text-slate-300 dark:text-white/30 text-sm">/</span>
            <span className="hidden sm:inline-block text-xs font-semibold text-[#1A6FFF] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-[#1A6FFF]/10 border border-blue-200 dark:border-[#1A6FFF]/20">
              User Documentation
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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

            {!isNativeApp() && (
              <Link to="/subscribe" className="hidden sm:inline-block">
                <Button size="sm" className="btn-gold min-h-11 text-xs">
                  Subscribe with MoMo
                </Button>
              </Link>
            )}
            <Link to="/" className="text-xs text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} /> <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Docs Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-4 space-y-4 sticky top-24">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
              <Input
                placeholder="Search guide..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
              />
            </div>

            <nav className="p-2 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none space-y-1">
              {filteredSections.map((s) => {
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#1A6FFF] text-white shadow-md shadow-blue-500/25"
                        : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? "text-white" : "text-[#1A6FFF]"}>{s.icon}</span>
                      <span>{s.title}</span>
                    </div>
                    <ChevronRight size={14} className={isActive ? "opacity-100" : "opacity-40"} />
                  </button>
                );
              })}
            </nav>

            <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/5 shadow-sm dark:shadow-none space-y-2 text-xs text-slate-600 dark:text-white/60">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <HelpCircle size={14} className="text-[#1A6FFF]" /> Need Human Help?
              </p>
              <p>Our Kigali support team is available via WhatsApp or email.</p>
              <a
                href="mailto:hello@sella.app"
                className="text-[#1A6FFF] underline block font-medium"
              >
                hello@sella.app
              </a>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/40 dark:shadow-2xl min-h-[500px]">
            {current.content}
          </main>
        </div>
      </div>
    </div>
  );
}
