import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  CreditCard,
  Lock,
  MessageCircle,
  Package,
  Printer,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { type ScreenId } from "./PhoneMockup";
import { t, type CatalogueId } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";

interface InteractiveShowcaseProps {
  activeScreen: ScreenId;
  onScreenChange: (id: ScreenId) => void;
}

export function InteractiveShowcase({
  activeScreen,
  onScreenChange,
}: InteractiveShowcaseProps) {
  const lang = useAppLanguage();
  const rw = lang === "rw";
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const tabs: Array<{ id: ScreenId; label: string; icon: React.ReactNode }> = [
    { id: "pos", label: t("WEB-067" as CatalogueId), icon: <CreditCard size={15} /> },
    { id: "debts", label: t("WEB-068" as CatalogueId), icon: <MessageCircle size={15} /> },
    { id: "stock", label: t("WEB-069" as CatalogueId), icon: <Package size={15} /> },
    { id: "receipt", label: t("WEB-070" as CatalogueId), icon: <Printer size={15} /> },
    { id: "staff", label: t("WEB-071" as CatalogueId), icon: <Lock size={15} /> },
  ];

  const details: Record<
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
      title: rw ? "Igurisha ryihuta kuri kaunta n'ubwishyu buvanze" : "Lightning-Fast Counter POS & Split Payments",
      subtitle: rw ? "Byakorewe umuvuduko kuri kaunta idafite amakosa" : "Engineered for speed at the counter with zero lag",
      description: rw
        ? "Andika ibicuruzwa mu masegonda make. Gaba amafaranga mu buryo bwa kashi, MTN MoMo, cyangwa ideni rimwe."
        : "Ring up items in seconds. Split payment between Cash, MTN MoMo, and customer credit in a single checkout.",
      features: [
        rw ? "Kamera isoma barcode ako kanya" : "Camera barcode scanning",
        rw ? "Irakora 100% n'iyo interineti yahita" : "100% offline-first POS queueing",
        rw ? "Kubara chenji y'umukiliya mu mafaranga nyarwanda" : "Instant RWF change calculation",
      ],
      stat: "< 3s",
      statLabel: rw ? "Igihe cyo kugurisha ku mukiliya umwe" : "Average customer checkout time",
    },
    debts: {
      title: rw ? "Igitabo cy'amadeni n'ubutumwa bwa WhatsApp ku munsi" : "Customer Credit Ledger & 1-Tap WhatsApp Reminders",
      subtitle: rw ? "Nta na rimwe uzongera kwibagirwa amafaranga abakiriya bakugomba" : "Never lose track of unpaid shop credits or client balances",
      description: rw
        ? "Genzura amadeni yose y'iduka. Kanda rimwe gusa wohereze ubutumwa bw'ikinyabupfura kuri WhatsApp y'umukiliya bumwibutsa kwishyura."
        : "Track all customer credit balances. Tap once to dispatch polite, pre-formatted debt reminders directly to WhatsApp.",
      features: [
        rw ? "Ubutumwa bwa WhatsApp buhita bwuzuzamo imibare" : "Automated WhatsApp payment reminder message",
        rw ? "Kubara amadeni yose hamwe ku bacuruzi bose" : "Real-time total unpaid ledger across all clients",
        rw ? "Kwandika kwishyura igice bitinze" : "Instant partial payment logging & balance deduction",
      ],
      stat: "94%",
      statLabel: rw ? "Igipimo cyo kwishyuzwa binyuze kuri WhatsApp" : "Debt recovery rate with WhatsApp alerts",
    },
    stock: {
      title: rw ? "Gucunga sitoki n'imiburo y'ibiri gushira" : "Live Inventory Tracking & Low Stock Alerts",
      subtitle: rw ? "Menya ibiri mu bubiko n'ibikeneye gutumizwa mbere y'uko bishira" : "Know exact quantities and reorder before shelves run dry",
      description: rw
        ? "Buri gurisha rihita rigabanya umubare w'ibikoresho bisigaye muri sitoki. Niba bigeze ku gipimo fatizo, uhita ubona integuza."
        : "Every sale instantly decrements remaining shelf quantities. Receive proactive alerts when items hit critical reorder levels.",
      features: [
        rw ? "Integuza y'ibicuruzwa byegereje gushira" : "Proactive low-stock reorder thresholds",
        rw ? "Kwinjiza ibicuruzwa byinshi muri Excel/CSV" : "Bulk inventory import via Excel & CSV",
        rw ? "Gukurikirana igiciro cyo kurangura n'icyo kugurisha" : "Wholesale cost vs retail margin tracking",
      ],
      stat: "100%",
      statLabel: rw ? "Sitoki ihora ihuje n'ibiri ku meza" : "Inventory accuracy between shelf and register",
    },
    receipt: {
      title: rw ? "Inyemezabwishyu za Bluetooth Thermal na PDF" : "Bluetooth Thermal Receipts & Digital PDF Invoices",
      subtitle: rw ? "Resi zifite umutekano w'umukiliya n'ikimenyetso cya shop" : "Professional branding and trust for every counter transaction",
      description: rw
        ? "Printinga kuri printer ya Bluetooth (58mm cyangwa 80mm) cyangwa ohereza PDF ku mukiliya ifite izina ry'iduka na ref ya MoMo."
        : "Print clean, itemized receipts on any 58mm or 80mm ESC/POS thermal printer, or share digital PDFs with MoMo approval codes.",
      features: [
        rw ? "Yemera printer za Bluetooth 58mm na 80mm" : "Compatible with standard 58mm & 80mm thermal printers",
        rw ? "Guhana PDF ifite ikaseri ry'iduka" : "Official PDF invoices with digital verification stamps",
        rw ? "Kugaragaza nomero ya ref ya MoMo ku nyemezabwishyu" : "MTN MoMo transaction reference printed on receipt",
      ],
      stat: "58/80mm",
      statLabel: rw ? "Ubugari bwa resi zose zemewe mu Rwanda" : "Standard paper width supported",
    },
    staff: {
      title: rw ? "Umutekano w'umukozi ugurisha na PIN y'imibare 4" : "Staff PIN Security & Shift Handover Control",
      subtitle: rw ? "Umukozi agurisha ku meza atabangamiye amabanga ya shop" : "Empower cashiers at the counter with zero risk to shop settings",
      description: rw
        ? "Umukozi yinjira na PIN y'imibare 4. Ashobora kugurisha no gusohora resi, ariko ntiyemerewe gusiba inyandiko cyangwa guhindura ibiciro."
        : "Cashiers sign in with a simple 4-digit PIN. They record sales and issue receipts, but cannot erase ledger history or alter prices.",
      features: [
        rw ? "PIN y'imibare 4 yihariye kuri buri mukozi" : "Dedicated 4-digit PIN for each cashier",
        rw ? "Gufunga uburenganzira bwo gusiba amadeni cyangwa ibicuruzwa" : "Role-based restriction on deleting sales and inventory",
        rw ? "Raporo y'ibyo umukozi yagurishije muri shift ye" : "Shift reconciliation report (Cash vs MoMo in drawer)",
      ],
      stat: "100%",
      statLabel: rw ? "Umutekano w'imikoreshereze y'ikese" : "Protection against unauthorized record deletion",
    },
  };

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

  const detail = details[activeScreen];

  return (
    <div className="space-y-6 select-none">
      {/* Sliding Pill Selector */}
      <div className="flex justify-center">
        <div ref={trackRef} className="pill-track max-w-full overflow-x-auto no-scrollbar">
          <span ref={indicatorRef} className="pill-indicator" aria-hidden="true" />
          {tabs.map((tab) => {
            const isActive = activeScreen === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{detail.title}</h3>
            <p className="text-sm text-[#0B3FCC] font-semibold">{detail.subtitle}</p>
          </div>
          <div className="bg-[#0B3FCC]/10 border border-[#0B3FCC]/20 rounded-2xl px-4 py-2 shrink-0 text-left sm:text-right">
            <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">{detail.stat}</p>
            <p className="text-[11px] text-slate-500 font-medium">{detail.statLabel}</p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
          {detail.description}
        </p>

        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          {detail.features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5 transition-colors shadow-2xs"
            >
              <CheckCircle2 size={16} className="text-[#0B3FCC] shrink-0 mt-0.5" />
              <span className="text-xs text-slate-800 leading-tight font-medium">{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
