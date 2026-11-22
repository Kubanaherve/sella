import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertCircle,
  Barcode,
  Check,
  CheckCircle2,
  Lock,
  MessageCircle,
  Package,
  Printer,
  Search,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  User,
  WifiOff,
} from "lucide-react";
import { t, type CatalogueId } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";

export type ScreenId = "pos" | "debts" | "stock" | "receipt" | "staff";

const SCREENS: ScreenId[] = ["pos", "debts", "stock", "receipt", "staff"];

interface PhoneMockupProps {
  activeScreen?: ScreenId;
  onScreenChange?: (screen: ScreenId) => void;
  autoPlay?: boolean;
}

export function PhoneMockup({
  activeScreen: controlledScreen,
  onScreenChange,
  autoPlay = true,
}: PhoneMockupProps) {
  useAppLanguage();
  const [internalScreen, setInternalScreen] = useState<ScreenId>("pos");
  const isControlled = controlledScreen !== undefined;
  const currentScreen = isControlled ? controlledScreen : internalScreen;

  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectScreen = useCallback(
    (screen: ScreenId) => {
      if (!isControlled) {
        setInternalScreen(screen);
      }
      onScreenChange?.(screen);
    },
    [isControlled, onScreenChange]
  );

  // Auto-play screen transition carousel
  useEffect(() => {
    if (!autoPlay || isPaused) return;

    timerRef.current = setTimeout(() => {
      const currentIndex = SCREENS.indexOf(currentScreen);
      const nextIndex = (currentIndex + 1) % SCREENS.length;
      selectScreen(SCREENS[nextIndex]);
    }, 4500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentScreen, autoPlay, isPaused, selectScreen]);

  return (
    <div
      className="phone-mockup-wrapper relative select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Orbits Inspired by Sample Website */}
      <div className="orbit-halo orbit-halo-one" aria-hidden="true" />
      <div className="orbit-halo orbit-halo-two" aria-hidden="true" />

      {/* Floating Glass Badges around the phone */}
      <div className="floating-glass-note note-top-left" aria-hidden="true">
        <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[#0B3FCC]">
          <WifiOff size={16} />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-slate-900 leading-tight">
            {t("WEB-061" as CatalogueId)}
          </p>
          <p className="text-[9px] text-slate-500">
            {t("WEB-062" as CatalogueId)}
          </p>
        </div>
      </div>

      <div className="floating-glass-note note-mid-right" aria-hidden="true">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
          <Smartphone size={16} />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-slate-900 leading-tight">
            {t("WEB-063" as CatalogueId)}
          </p>
          <p className="text-[9px] text-slate-500">
            {t("WEB-064" as CatalogueId)}
          </p>
        </div>
      </div>

      <div className="floating-glass-note note-bottom-right" aria-hidden="true">
        <div className="w-8 h-8 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-600">
          <MessageCircle size={16} />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-slate-900 leading-tight">
            {t("WEB-065" as CatalogueId)}
          </p>
          <p className="text-[9px] text-slate-500">
            {t("WEB-066" as CatalogueId)}
          </p>
        </div>
      </div>

      {/* Ambient ground plane shadows */}
      <div className="phone-shadow--contact" aria-hidden="true" />
      <div className="phone-shadow--ambient" aria-hidden="true" />

      {/* ── TITANIUM HARDWARE SHELL ── */}
      <div className="phone-mockup">
        {/* Hardware Buttons */}
        <span className="phone-btn phone-btn--action" aria-hidden="true" />
        <span className="phone-btn phone-btn--vol-up" aria-hidden="true" />
        <span className="phone-btn phone-btn--vol-down" aria-hidden="true" />
        <span className="phone-btn phone-btn--power" aria-hidden="true" />

        <div className="phone-shell">
          <div className="phone-screen-well">
            <div className="phone-display bg-slate-950 text-white">
              {/* Dynamic Island */}
              <div className="phone-dynamic-island">
                <span className="phone-camera-lens" />
              </div>

              {/* Glass Reflection Highlight */}
              <div className="phone-glass-glare" aria-hidden="true" />

              {/* Status Bar */}
              <div className="pt-3 px-6 pb-1 flex justify-between items-center text-[11px] font-semibold text-white/80 select-none z-10">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono">5G</span>
                  <div className="w-5 h-2.5 rounded-sm border border-white/60 p-0.5 flex items-center">
                    <div className="h-full w-full bg-emerald-400 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Screen Content Slides */}
              <div className="relative flex-1 overflow-hidden pt-1">
                {/* ── Screen 1: Point of Sale (POS / Igurisha) ── */}
                <div className={`mockup-slide p-3.5 text-white text-left ${currentScreen === "pos" ? "active" : ""}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <p className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-wider">Boutique Ineza</p>
                      <h4 className="text-xs font-bold text-white">{t("WEB-067" as CatalogueId)}</h4>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {t("WEB-072" as CatalogueId)}
                    </span>
                  </div>

                  {/* Search / Scan Bar */}
                  <div className="mt-2.5 flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white/60">
                    <Search size={12} className="text-white/40" />
                    <span className="truncate flex-1">{t("WEB-073" as CatalogueId)}</span>
                    <Barcode size={14} className="text-[#38bdf8]" />
                  </div>

                  {/* Cart Items */}
                  <div className="mt-2.5 space-y-1.5 font-sans">
                    <div className="bg-white/5 rounded-xl p-2 flex items-center justify-between border border-white/5">
                      <div>
                        <p className="text-xs font-semibold text-white">Igitenge Wax Hollandais</p>
                        <p className="text-[9px] text-white/50">2 pcs × 9,000 RWF · <span className="text-[#38bdf8]">Hasigaye 6</span></p>
                      </div>
                      <span className="text-xs font-mono font-bold text-white tabular-nums">18,000 RWF</span>
                    </div>

                    <div className="bg-white/5 rounded-xl p-2 flex items-center justify-between border border-white/5">
                      <div>
                        <p className="text-xs font-semibold text-white">Isukari 1kg</p>
                        <p className="text-[9px] text-white/50">3 pcs × 1,500 RWF</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-white tabular-nums">4,500 RWF</span>
                    </div>
                  </div>

                  {/* Split Payment Card */}
                  <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-br from-blue-900/40 to-slate-900/80 border border-blue-500/30 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/70 font-medium">Yose hamwe (Total)</span>
                      <span className="font-extrabold text-sm text-[#38bdf8] font-mono tabular-nums">22,500 RWF</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-0.5 text-[9px] font-mono">
                      <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded-sm border border-emerald-500/30">
                        Cash: 10,500
                      </span>
                      <span className="bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded-sm border border-amber-500/30">
                        MoMo: 7,000
                      </span>
                      <span className="bg-blue-500/20 text-blue-300 font-semibold px-1.5 py-0.5 rounded-sm border border-blue-500/30">
                        Ideni: 5,000
                      </span>
                    </div>
                  </div>

                  {/* Confirmation CTA */}
                  <div className="mt-3">
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl bg-[#0B3FCC] hover:bg-[#0932A3] font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all text-white"
                    >
                      <CheckCircle2 size={13} />
                      <span>{t("WEB-074" as CatalogueId)}</span>
                    </button>
                  </div>
                </div>

                {/* ── Screen 2: Customer Debts (Ideni & WhatsApp) ── */}
                <div className={`mockup-slide p-3.5 text-white text-left ${currentScreen === "debts" ? "active" : ""}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">{t("WEB-068" as CatalogueId)}</p>
                      <h4 className="text-xs font-bold text-white">Ideni rya Shop</h4>
                    </div>
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                      8 Abakiriya
                    </span>
                  </div>

                  {/* Total Outstanding Banner */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-white/60">{t("WEB-075" as CatalogueId)}</p>
                      <p className="text-sm font-extrabold text-amber-300 font-mono tabular-nums">142,000 RWF</p>
                    </div>
                    <TrendingUp size={16} className="text-amber-400" />
                  </div>

                  {/* Customer Debt Row */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-800 text-[#38bdf8] flex items-center justify-center text-[10px] font-bold">
                          <User size={11} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">Karegeya Jean-Paul</p>
                          <p className="text-[9px] text-emerald-400 font-mono">0788 123 456</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-amber-300 font-mono tabular-nums">5,000 RWF</span>
                    </div>

                    {/* WhatsApp Preview Bubble */}
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[9px] text-emerald-200/90 leading-relaxed font-sans">
                      <div className="flex items-center gap-1 font-bold text-emerald-400 mb-0.5">
                        <MessageCircle size={10} />
                        <span>WhatsApp Reminder Preview:</span>
                      </div>
                      <p className="italic">"{t("WEB-077" as CatalogueId)}"</p>
                    </div>

                    <button
                      type="button"
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <MessageCircle size={11} />
                      <span>{t("WEB-076" as CatalogueId)}</span>
                    </button>
                  </div>
                </div>

                {/* ── Screen 3: Stock Inventory (Ububiko) ── */}
                <div className={`mockup-slide p-3.5 text-white text-left ${currentScreen === "stock" ? "active" : ""}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <p className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-wider">{t("WEB-069" as CatalogueId)}</p>
                      <h4 className="text-xs font-bold text-white">Ububiko bwa Shop</h4>
                    </div>
                    <span className="text-[9px] bg-blue-500/20 text-[#38bdf8] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                      142 Ibicuruzwa
                    </span>
                  </div>

                  {/* Stock health alert */}
                  <div className="mt-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-[10px]">
                    <AlertCircle size={14} className="shrink-0 text-rose-400" />
                    <span>{t("WEB-078" as CatalogueId)}</span>
                  </div>

                  {/* Inventory Items List */}
                  <div className="mt-2 space-y-1.5 font-sans">
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-white">Igitenge Wax Hollandais</span>
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-sm">
                          Hasigaye 6
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-white/50 font-mono">
                        <span>Igiciro: 9,000 RWF</span>
                        <span>Reorder: 10</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-3/5" />
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-2 border border-white/5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-white">Amavuta ya kondo 1L</span>
                        <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-sm">
                          Hasigaye 24
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-white/50 font-mono">
                        <span>Igiciro: 3,200 RWF</span>
                        <span>OK</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-4/5" />
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-2 border border-white/5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-white">Isukari 1kg</span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded-sm animate-pulse">
                          Hasigaye 2!
                        </span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full w-1/5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Screen 4: Thermal Receipt (Resi ya Bluetooth) ── */}
                <div className={`mockup-slide p-3 text-white text-left ${currentScreen === "receipt" ? "active" : ""}`}>
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <div>
                      <p className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-wider">{t("WEB-070" as CatalogueId)}</p>
                      <h4 className="text-xs font-bold text-white">58mm / 80mm Bluetooth</h4>
                    </div>
                    <Printer size={14} className="text-[#38bdf8]" />
                  </div>

                  {/* Authentic Paper Receipt */}
                  <div className="mt-2 p-2.5 rounded-lg bg-white text-slate-900 font-mono text-[8px] leading-tight shadow-md space-y-1">
                    <div className="text-center border-b border-dashed border-slate-300 pb-1">
                      <p className="font-extrabold text-[10px] text-slate-900 tracking-tight">BOUTIQUE INEZA</p>
                      <p className="text-[7px] text-slate-500">Kigali, Nyarugenge · Tel: 0788 123 456</p>
                      <p className="text-[7px] text-slate-500">Cashier: Aline (PIN 4281)</p>
                    </div>

                    <div className="space-y-0.5 py-1 border-b border-dashed border-slate-300">
                      <div className="flex justify-between">
                        <span>2x Igitenge Wax</span>
                        <span className="font-bold">18,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3x Isukari 1kg</span>
                        <span className="font-bold">4,500</span>
                      </div>
                    </div>

                    <div className="space-y-0.5 pt-0.5">
                      <div className="flex justify-between font-extrabold text-[9px]">
                        <span>TOTAL:</span>
                        <span>22,500 RWF</span>
                      </div>
                      <div className="flex justify-between text-[7px] text-slate-500">
                        <span>MoMo Ref:</span>
                        <span>MP261122.9814</span>
                      </div>
                    </div>

                    <p className="text-center text-[7px] text-slate-400 pt-0.5">
                      Murakoze guhitamo Sella POS!
                    </p>
                  </div>

                  <div className="mt-2.5">
                    <button
                      type="button"
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors text-white"
                    >
                      <Printer size={12} />
                      <span>{t("WEB-079" as CatalogueId)}</span>
                    </button>
                  </div>
                </div>

                {/* ── Screen 5: Staff PIN Security (Abakozi) ── */}
                <div className={`mockup-slide p-3.5 text-white text-left ${currentScreen === "staff" ? "active" : ""}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <p className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-wider">{t("WEB-071" as CatalogueId)}</p>
                      <h4 className="text-xs font-bold text-white">Shift & PIN Control</h4>
                    </div>
                    <Lock size={14} className="text-[#38bdf8]" />
                  </div>

                  <div className="mt-3 text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-[#38bdf8] border border-blue-500/30 mx-auto flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-xs font-bold text-white">Injira muri Shift yawe</p>
                    <div className="flex justify-center gap-2 pt-1">
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="w-3 h-3 rounded-full bg-white/20" />
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded-xl bg-white/5 border border-white/5 text-[9px] text-white/70 leading-relaxed font-sans">
                    <p>{t("WEB-080" as CatalogueId)}</p>
                  </div>

                  <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between text-[9px] font-mono">
                    <span className="text-emerald-300">Drawer Cash: 48,500 RWF</span>
                    <span className="text-[#38bdf8]">MoMo: 82,000 RWF</span>
                  </div>
                </div>
              </div>

              {/* Bottom Screen Carousel Selector Tabs */}
              <div className="pb-3 pt-1 px-3 flex justify-between items-center z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-xs">
                {SCREENS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectScreen(id)}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                      currentScreen === id
                        ? "bg-[#0B3FCC] text-white shadow-xs"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {id.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
