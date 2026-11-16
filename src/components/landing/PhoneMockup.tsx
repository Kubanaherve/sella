import React from "react";
import {
  CheckCircle2,
  DollarSign,
  MessageCircle,
  Package,
  Printer,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/kinyarwanda";

export type ScreenId = "pos" | "debts" | "momo" | "receipt";

interface PhoneMockupProps {
  activeScreen: ScreenId;
  onScreenChange?: (screen: ScreenId) => void;
}

export function PhoneMockup({ activeScreen, onScreenChange }: PhoneMockupProps) {
  return (
    <div className="phone-mockup-wrapper">
      {/* Ambient ground plane shadows */}
      <div className="phone-shadow--contact" aria-hidden="true" />
      <div className="phone-shadow--ambient" aria-hidden="true" />

      {/* Hardware Shell */}
      <div className="phone-mockup">
        {/* Hardware Buttons */}
        <span className="phone-btn phone-btn--action" aria-hidden="true" />
        <span className="phone-btn phone-btn--vol-up" aria-hidden="true" />
        <span className="phone-btn phone-btn--vol-down" aria-hidden="true" />
        <span className="phone-btn phone-btn--power" aria-hidden="true" />

        <div className="phone-shell">
          <div className="phone-screen-well">
            <div className="phone-display">
              {/* Dynamic Island */}
              <div className="phone-dynamic-island">
                <span className="phone-camera-lens" />
              </div>

              {/* Glass Reflection Highlight */}
              <div className="phone-glass-glare" aria-hidden="true" />

              {/* Status Bar */}
              <div className="pt-3 px-6 pb-1 flex justify-between items-center text-[11px] font-semibold text-white/70 select-none z-10">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">5G</span>
                  <div className="w-5 h-2.5 rounded-sm border border-white/60 p-0.5 flex items-center">
                    <div className="h-full w-full bg-emerald-400 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Screen Container */}
              <div className="relative flex-1 overflow-hidden pt-2">
                {/* ── Screen 1: Point of Sale (POS) ── */}
                <div className={`mockup-slide p-4 text-white text-left ${activeScreen === "pos" ? "active" : ""}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Karegeya Boutique</p>
                      <h4 className="text-sm font-bold text-white">POS / Igurisha Rishya</h4>
                    </div>
                    <span className="text-[10px] bg-primary/20 text-primary-foreground font-semibold px-2 py-0.5 rounded-full border border-primary/30">
                      Live POS
                    </span>
                  </div>

                  {/* Cart Items */}
                  <div className="mt-3 space-y-2">
                    <div className="bg-white/5 rounded-xl p-2.5 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                          ⌚
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">Rolex Oyster (Black)</p>
                          <p className="text-[10px] text-white/50">1 pcs × 35.000 FRW</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">35.000 FRW</span>
                    </div>

                    <div className="bg-white/5 rounded-xl p-2.5 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                          ✨
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">Men Cologne 100ml</p>
                          <p className="text-[10px] text-white/50">1 pcs × 15.000 FRW</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">15.000 FRW</span>
                    </div>
                  </div>

                  {/* Payment Breakdown Card */}
                  <div className="mt-4 p-3 rounded-2xl bg-gradient-to-br from-primary/15 to-transparent border border-primary/30 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Yose hamwe (Total)</span>
                      <span className="font-extrabold text-sm text-primary-foreground">50.000 FRW</span>
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-md border border-emerald-500/30">
                        Cash: 20.000
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-md border border-amber-500/30">
                        MoMo: 30.000
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                    <CheckCircle2 size={14} /> Emeza Igurisha (Complete Sale)
                  </button>
                </div>

                {/* ── Screen 2: Debts & WhatsApp Reminders ── */}
                <div className={`mockup-slide p-4 text-white text-left ${activeScreen === "debts" ? "active" : ""}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Amadeni (Debts Ledger)</p>
                      <h4 className="text-sm font-bold text-white">Abakiriya bafite Amadeni</h4>
                    </div>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                      3 Active
                    </span>
                  </div>

                  {/* Total Unpaid Banner */}
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-white/60">Total Unpaid Balance</p>
                      <p className="text-base font-extrabold text-amber-300">145.000 FRW</p>
                    </div>
                    <TrendingUp size={20} className="text-amber-400" />
                  </div>

                  {/* Customer Debt Rows */}
                  <div className="mt-3 space-y-2">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">Jean Claude Mugabo</span>
                        <span className="text-xs font-extrabold text-rose-400">45.000 FRW</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-white/50">
                        <span>Due: Ejo (Tomorrow)</span>
                        <span className="text-emerald-400 font-medium">0788 123 456</span>
                      </div>
                      <div className="pt-1">
                        <button className="w-full py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-colors">
                          <MessageCircle size={12} /> Ohereza WhatsApp Reminder
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">Grace Uwase</span>
                        <span className="text-xs font-extrabold text-amber-300">20.000 FRW</span>
                      </div>
                      <p className="text-[10px] text-white/50">Rolex strap · Paid 10.000 FRW</p>
                    </div>
                  </div>
                </div>

                {/* ── Screen 3: Instant MoMo Payment ── */}
                <div className={`mockup-slide p-4 text-white text-left ${activeScreen === "momo" ? "active" : ""}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">MoMo Instant Checkout</p>
                      <h4 className="text-sm font-bold text-white">Kwishyura na MoMo</h4>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>

                  <div className="mt-4 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 mx-auto flex items-center justify-center font-bold text-lg">
                      MTN
                    </div>
                    <p className="text-xs font-semibold text-white/80">Sella Pro Subscription</p>
                    <p className="text-2xl font-black text-amber-300">5.000 FRW <span className="text-xs font-normal text-white/60">/ ukwezi</span></p>
                  </div>

                  {/* STK Push Simulation Card */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-900/90 border border-amber-400/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-amber-400" />
                      <div>
                        <p className="text-[11px] font-bold text-white">Prompt Yoherejwe kuri Telefone</p>
                        <p className="text-[10px] text-white/60">Emeza ubutumwa bwa *182# na PIN</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full animate-pulse w-3/4" />
                    </div>
                    <p className="text-[9px] text-emerald-400 font-medium text-center">
                      ✓ Auto-unlocks real-time with zero reload
                    </p>
                  </div>

                  <div className="mt-4 p-2 rounded-xl bg-white/5 border border-white/5 text-[10px] text-white/60 flex items-center gap-2">
                    <Zap size={14} className="text-amber-400 shrink-0" />
                    <span>Works with MTN MoMo (*182#) & Airtel Money (*500#)</span>
                  </div>
                </div>

                {/* ── Screen 4: Thermal Receipts & Printing ── */}
                <div className={`mockup-slide p-4 text-white text-left ${activeScreen === "receipt" ? "active" : ""}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Inyemezabwishyu (Receipt)</p>
                      <h4 className="text-sm font-bold text-white">58mm / 80mm Resi</h4>
                    </div>
                    <Printer size={16} className="text-blue-400" />
                  </div>

                  {/* Thermal paper preview */}
                  <div className="mt-3 p-3 rounded-xl bg-white text-slate-900 font-mono text-[9px] shadow-lg shadow-black/40 space-y-1.5">
                    <div className="text-center border-b border-dashed border-slate-300 pb-1.5">
                      <p className="font-extrabold text-xs">SELLA BIJOUX</p>
                      <p className="text-[8px] text-slate-600">CHIC Building, Ground Floor</p>
                      <p className="text-[8px] text-slate-600">Tel: 0788 123 456</p>
                    </div>

                    <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
                      <div className="flex justify-between">
                        <span>1x Rolex Oyster</span>
                        <span className="font-bold">35.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Cologne 100ml</span>
                        <span className="font-bold">15.000</span>
                      </div>
                    </div>

                    <div className="flex justify-between font-extrabold text-xs pt-0.5">
                      <span>TOTAL:</span>
                      <span>50.000 FRW</span>
                    </div>
                    <p className="text-center text-[7px] text-slate-500 pt-1">
                      Murakoze guhitamo Sella Shop!
                    </p>
                  </div>

                  {/* Print Actions */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="py-2 px-1 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-[10px] flex items-center justify-center gap-1 transition-colors">
                      <Printer size={12} /> Print Thermal
                    </button>
                    <button className="py-2 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-[10px] flex items-center justify-center gap-1 transition-colors">
                      <MessageCircle size={12} /> Share WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Carousel Pill Dots */}
              <div className="pb-4 pt-2 flex justify-center gap-1.5 z-10">
                {(["pos", "debts", "momo", "receipt"] as ScreenId[]).map((id) => (
                  <button
                    key={id}
                    onClick={() => onScreenChange?.(id)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeScreen === id ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Switch to screen ${id}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
