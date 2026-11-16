import React from "react";
import {
  TrendingUp,
  Package,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Wifi,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/kinyarwanda";

interface DesktopMockupProps {
  className?: string;
}

export function DesktopMockup({ className = "" }: DesktopMockupProps) {
  return (
    <div className={`desktop-mockup-wrapper ${className}`}>
      {/* Ambient shadow underneath */}
      <div className="desktop-shadow--ambient" aria-hidden="true" />

      {/* MacBook / Desktop Window Container */}
      <div className="desktop-device">
        {/* macOS Window Title Bar */}
        <div className="desktop-bar">
          <div className="desktop-traffic-lights" aria-hidden="true">
            <span className="dot dot-close" />
            <span className="dot dot-min" />
            <span className="dot dot-max" />
          </div>

          <div className="desktop-url-bar">
            <Lock size={11} className="text-emerald-500 shrink-0" />
            <span className="truncate">sella.rw/dashboard</span>
            <span className="desktop-sync-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Realtime Synced
            </span>
          </div>

          <div className="desktop-actions-right">
            <Wifi size={13} className="text-emerald-500 opacity-80" />
            <span className="text-[11px] font-medium opacity-60">Rwanda</span>
          </div>
        </div>

        {/* Dashboard Interior */}
        <div className="desktop-dashboard">
          {/* Left Mini Sidebar */}
          <aside className="desktop-sidebar">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-6 h-6 rounded-lg bg-[#1A6FFF] flex items-center justify-center text-white font-black text-xs shadow-sm">
                S
              </div>
              <span className="text-xs font-bold tracking-tight">Karegeya</span>
            </div>

            <nav className="space-y-1">
              <div className="sidebar-link active">
                <TrendingUp size={13} />
                <span>Overview</span>
              </div>
              <div className="sidebar-link">
                <Package size={13} />
                <span>Ububiko</span>
              </div>
              <div className="sidebar-link">
                <Users size={13} />
                <span>Amadeni</span>
              </div>
              <div className="sidebar-link">
                <ShieldCheck size={13} />
                <span>Subscription</span>
              </div>
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-200/60 dark:border-white/10 px-1">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Shop Plan</p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Pro Active</p>
            </div>
          </aside>

          {/* Main Dashboard Panel */}
          <main className="desktop-main">
            {/* Greeting Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <small className="text-[10px] text-[#1A6FFF] font-bold uppercase tracking-wider">
                  Kigali • Nyarugenge Market
                </small>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Mwaramutse, Karegeya Boutique
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} />
                All Systems Online
              </span>
            </div>

            {/* 3 Metrics Cards */}
            <div className="grid grid-cols-3 gap-2.5 my-3">
              <div className="dash-stat-card">
                <small className="dash-stat-label">Total Sales Today</small>
                <b className="dash-stat-value text-slate-900 dark:text-white">{formatCurrency(485000)}</b>
                <span className="dash-stat-delta text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight size={10} /> +18.4% vs ejo
                </span>
              </div>

              <div className="dash-stat-card">
                <small className="dash-stat-label">Pending Debts</small>
                <b className="dash-stat-value text-amber-600 dark:text-amber-400">{formatCurrency(124000)}</b>
                <span className="dash-stat-delta text-slate-500 dark:text-slate-400">
                  4 clients pending
                </span>
              </div>

              <div className="dash-stat-card">
                <small className="dash-stat-label">Total Inventory</small>
                <b className="dash-stat-value text-slate-900 dark:text-white">142 items</b>
                <span className="dash-stat-delta text-emerald-600 dark:text-emerald-400">
                  98% in stock
                </span>
              </div>
            </div>

            {/* Weekly Sales Curve Wave Chart */}
            <div className="dash-chart-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Weekly Revenue Trend (FRW)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Mon — Sun</span>
              </div>

              {/* Responsive SVG Curve Chart with gradient fill */}
              <div className="h-20 w-full relative">
                <svg
                  viewBox="0 0 400 90"
                  preserveAspectRatio="none"
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    <linearGradient id="salesCurveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A6FFF" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#1A6FFF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Fill */}
                  <path
                    d="M0 65 Q 40 70, 70 48 T 140 52 T 210 32 T 280 38 T 350 18 T 400 12 L 400 90 L 0 90 Z"
                    fill="url(#salesCurveGrad)"
                  />
                  {/* Line */}
                  <path
                    d="M0 65 Q 40 70, 70 48 T 140 52 T 210 32 T 280 38 T 350 18 T 400 12"
                    fill="none"
                    stroke="#1A6FFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Highlight Peak Dot */}
                  <circle cx="350" cy="18" r="4.5" fill="#1A6FFF" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>

              {/* Chart footer labels */}
              <div className="flex justify-between text-[9px] text-slate-500 pt-1 font-mono">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span className="font-bold text-[#1A6FFF]">Sat (Peak)</span>
                <span>Sun</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
