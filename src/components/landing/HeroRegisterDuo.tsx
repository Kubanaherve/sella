import { useAppLanguage } from "@/i18n/useAppLanguage";
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  Lock,
  Wifi,
  Barcode,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";

export function HeroRegisterDuo() {
  const lang = useAppLanguage();
  const rw = lang === "rw";

  return (
    <div className="relative w-full max-w-[620px] mx-auto select-none">
      {/* ── DESKTOP/TABLET: Large Legible Counter Register View ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 overflow-hidden text-slate-900 font-sans">
        {/* Counter Register Header Bar */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            </div>
            <span className="ml-2 font-bold text-slate-800 tracking-tight">
              Sella Counter POS
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 font-medium">Boutique Ineza</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{rw ? "Irakora (Offline OK)" : "Offline Ready"}</span>
            </span>
          </div>
        </div>

        {/* Register Body */}
        <div className="p-4 sm:p-5 space-y-4 bg-white">
          {/* Quick search and categories */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                readOnly
                value="Igitenge Wax Hollandais"
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-default"
              />
            </div>
            <div className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 text-xs text-slate-600 font-medium shrink-0">
              <Barcode size={15} />
              <span className="hidden sm:inline">Scanner</span>
            </div>
          </div>

          {/* Current Counter Ticket Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>{rw ? "Igicuruzwa (Item)" : "Item & SKU"}</span>
              <span>{rw ? "Umubare (Qty)" : "Qty"}</span>
              <span className="text-right">{rw ? "Amafaranga (Total)" : "Total (RWF)"}</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="px-3 py-2.5 flex items-center justify-between bg-blue-50/20">
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-slate-900 truncate">
                    Igitenge Wax Hollandais
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    9,000 RWF / igipimo · Hasigaye 6
                  </div>
                </div>
                <div className="font-mono font-medium text-slate-700 px-3">×2</div>
                <div className="font-mono font-bold text-slate-900 text-right">
                  18,000 RWF
                </div>
              </div>

            </div>

            {/* Total Row */}
            <div className="bg-slate-50/80 px-3 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">
                {rw ? "Yose yo kwishyura (Amount Due):" : "Total Amount Due:"}
              </span>
              <span className="text-base font-mono font-extrabold text-slate-900">
                18,000 RWF
              </span>
            </div>
          </div>

          {/* Counter Split Payment Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Smartphone size={14} className="text-[#0B3FCC]" />
                <span className="font-medium">MTN MoMo (*182#)</span>
              </div>
              <span className="font-mono font-semibold text-slate-900">
                12,000 RWF
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-900">
                <User size={14} className="text-amber-700" />
                <span className="font-medium">Ideni</span>
              </div>
              <span className="font-mono font-bold text-amber-800">
                6,000 RWF
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            className="w-full h-10 rounded-xl bg-[#0B3FCC] text-white text-xs font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 cursor-default"
          >
            <CheckCircle2 size={15} />
            <span>{rw ? "Emeza igurisha (Fagitire #184)" : "Confirm Sale & Generate Receipt"}</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE OVERLAY / COMPANION PHONE FRAME (Desktop only) ── */}
      {/* On desktop, show one smaller phone frame with selective blue glass border */}
      <div className="hidden lg:block absolute -right-6 -bottom-6 w-56 rounded-3xl border-2 border-blue-400/80 bg-white/95 backdrop-blur-xl shadow-2xl shadow-blue-900/20 p-2.5 text-slate-900 text-xs transform translate-y-2 z-20">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[10px] text-slate-500 font-mono">
            <span>Sella Mobile Phone</span>
            <span className="text-emerald-600 font-semibold">● Synced</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
              {rw ? "Ideni rishya" : "New Debt Logged"}
            </span>
            <div className="font-bold text-slate-900 text-xs">Umukiliya w'igerageza</div>
            <div className="text-sm font-mono font-bold text-amber-800">
              6,000 RWF
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{rw ? "WhatsApp yiteguye" : "WhatsApp reminder ready"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
