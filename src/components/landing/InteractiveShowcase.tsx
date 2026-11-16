import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  MessageCircle,
  Package,
  Printer,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Zap,
} from "lucide-react";
import { type ScreenId } from "./PhoneMockup";

interface InteractiveShowcaseProps {
  activeScreen: ScreenId;
  onScreenChange: (id: ScreenId) => void;
}

const TABS: Array<{ id: ScreenId; label: string; icon: React.ReactNode }> = [
  { id: "pos", label: "Point of Sale", icon: <CreditCard size={15} /> },
  { id: "debts", label: "Debts & WhatsApp", icon: <MessageCircle size={15} /> },
  { id: "momo", label: "MoMo Instant Pay", icon: <Smartphone size={15} /> },
  { id: "receipt", label: "Thermal Receipts", icon: <Printer size={15} /> },
];

const DETAILS: Record<
  ScreenId,
  {
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    stat: string;
    statLabel: string;
  }
> = {
  pos: {
    title: "Lighting-Fast Retail Sales & Split Checkout",
    subtitle: "Built for speed at the shop counter with zero lags.",
    description:
      "Ring up multi-item orders in seconds. Apply item-level or basket discounts, and split payments between Cash and Mobile Money seamlessly.",
    features: [
      "Barcode & SKU scanner support via camera or Bluetooth",
      "Automatic customer change calculation",
      "Full offline sale queueing (works even when internet drops)",
    ],
    stat: "< 3s",
    statLabel: "Average checkout time per customer",
  },
  debts: {
    title: "Credit Sales & 1-Click WhatsApp Reminders",
    subtitle: "Never lose track of unpaid balances or forgotten client debts.",
    description:
      "Maintain a spotless credit ledger. When payment is due, send pre-formatted Kinyarwanda payment reminder messages directly to their WhatsApp with a single tap.",
    features: [
      "1-tap WhatsApp message: 'Twakwibutsaga kwishyura ideni...'",
      "Automated total unpaid ledger calculated across all customers",
      "Instant payment logging with live balance reduction",
    ],
    stat: "94%",
    statLabel: "Debt recovery rate with WhatsApp reminders",
  },
  momo: {
    title: "Direct Rwandan Mobile Money (*182#)",
    subtitle: "Real-time subscriptions and customer payments without credit cards.",
    description:
      "Powered by Paypack and local Rwandan telecom networks. Enter any MTN or Airtel phone number to trigger a live STK push prompt directly to the customer's phone.",
    features: [
      "Instant auto-unlock via Supabase Realtime webhooks",
      "Automatic network detection (MTN 078/079 vs Airtel 072/073)",
      "Zero credit card required — keep 99% of your hard-earned revenue",
    ],
    stat: "100%",
    statLabel: "Local Rwanda MoMo compatibility",
  },
  receipt: {
    title: "Thermal Receipts & Digital WhatsApp Invoices",
    subtitle: "Professional branding that earns trust from every customer.",
    description:
      "Print clean, itemized receipts on any standard 58mm or 80mm ESC/POS Bluetooth or USB printer, or share a branded digital PDF receipt directly to their phone.",
    features: [
      "Customizable shop name, phone, address, and thank-you notes",
      "Thermal printer formatting optimized for paper roll efficiency",
      "Full PDF export and 1-tap WhatsApp invoice delivery",
    ],
    stat: "58 / 80mm",
    statLabel: "Compatible with all standard thermal printers",
  },
};

export function InteractiveShowcase({
  activeScreen,
  onScreenChange,
}: InteractiveShowcaseProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // Position indicator smoothly over active tab
  useEffect(() => {
    if (!trackRef.current || !indicatorRef.current) return;
    const activeEl = trackRef.current.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeScreen}"]`
    );
    if (!activeEl) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    indicatorRef.current.style.width = `${activeRect.width}px`;
    indicatorRef.current.style.transform = `translateX(${
      activeRect.left - trackRect.left
    }px)`;
  }, [activeScreen]);

  const detail = DETAILS[activeScreen];

  return (
    <div className="space-y-6">
      {/* Sliding Pill Selector */}
      <div className="flex justify-center">
        <div ref={trackRef} className="pill-track max-w-full overflow-x-auto no-scrollbar">
          <span ref={indicatorRef} className="pill-indicator" aria-hidden="true" />
          {TABS.map((tab) => {
            const isActive = activeScreen === tab.id;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => onScreenChange(tab.id)}
                className={`pill-item flex items-center gap-2 ${isActive ? "active" : ""}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Details Card */}
      <div className="feature-glow-card text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{detail.title}</h3>
            <p className="text-sm text-[#1A6FFF] font-semibold">{detail.subtitle}</p>
          </div>
          <div className="bg-[#1A6FFF]/10 border border-[#1A6FFF]/20 rounded-2xl px-4 py-2 shrink-0 text-left sm:text-right">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{detail.stat}</p>
            <p className="text-[11px] text-slate-500 dark:text-white/60">{detail.statLabel}</p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-600 dark:text-white/75 leading-relaxed">
          {detail.description}
        </p>

        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          {detail.features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 rounded-xl p-3 flex items-start gap-2.5 transition-colors"
            >
              <CheckCircle2 size={16} className="text-[#1A6FFF] shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 dark:text-white/90 leading-tight font-medium">{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
