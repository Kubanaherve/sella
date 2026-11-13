# Sella — macOS Liquid Dark Glass Design System & Code Pack

This document details the complete design overhaul and code architecture for **Sella's Dark Glassmorphic UI**, adapted to mirror the physical light transmission, specular edge highlights, and saturation-boosted frosted glass aesthetics of **macOS Sonoma / Sequoia and Apple visionOS**.

---

## 1. Executive Summary & Root Cause Analysis

### What Was Broken in Dark Mode Previously
1. **Opaque White Glass Overlays**: Classes like `.glass-card`, `.sella-list-card`, `.sella-stat`, `.sella-sheet-glass`, and `.sella-popup-glass` had hardcoded `rgba(255, 255, 255, 0.78)` backgrounds with no `.dark` overrides. In dark mode, cards appeared as stark, blinding white boxes against a dark canvas.
2. **Static Navigation Glass**: `.sella-app-header` and `.sella-tabbar` remained translucent white, clashing jarringly with the dark page canvas.
3. **Hardcoded Light Mode Utilities**: Screens heavily used `bg-white`, `border-slate-200`, `bg-blue-50`, `bg-emerald-50`, and `bg-amber-50` with no dark variant classes (`dark:bg-...`).
4. **Cobalt Text Invisibility**: Hardcoded `#0B3FCC` (deep cobalt blue) was used across headers, prices, and icons. On dark cards, this deep blue was nearly invisible (contrast failure).
5. **Muddy Dark Gray Syndrome**: Without a saturation boost (`saturate(180% - 190%)`) and specular bevel rim reflections, dark glass elements looked like flat, dirty plastic rather than refined Apple-grade liquid glass.

---

## 2. The Apple macOS Liquid Dark Glass Architecture

```
┌────────────────────────────────────────────────────────┐
│  Level 1: Deep Cosmic Canvas (#040817)                 │
│  ├── Radial Sapphire Node (hsl 217 90% 50% / 0.28)     │
│  └── Radial Electric Cyan Node (hsl 199 95% 45% / 0.20)│
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Level 2: Surface Glass (Cards & List Items)       │  │
│  │ ├── Backdrop: blur(24px) saturate(190%)          │  │
│  │ ├── Gradient: rgba(17,30,60,0.72) → rgba(8,15,34)│  │
│  │ ├── Inset Highlight: inset 0 1px 0 rgba(255,255) │  │
│  │ ├── Hairline Border: 1px solid rgba(255,255,0.1) │  │
│  │ │                                                │  │
│  │ │ ┌───────────────────────────────────────────┐  │  │
│  │ │ │ Level 3: Nested Glass (.glass-sub-card)   │  │  │
│  │ │ │ ├── Surface: rgba(255, 255, 255, 0.05)    │  │  │
│  │ │ │ ├── Border: 1px solid rgba(255,255,0.08)  │  │  │
│  │ │ │ └── Text: #5AC8FA (Electric Cyan Accent)  │  │  │
│  │ │ └───────────────────────────────────────────┘  │  │
│  │ └────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Core Principles
1. **Saturation Boosting (`saturate(190%)`)**: macOS frosted glass always amplifies the colors of lights and objects behind it. Without saturation boost, dark glass looks gray and lifeless.
2. **Top Specular Inset Rim (`inset 0 1px 0 rgba(255, 255, 255, 0.15)`)**: Physical glass has beveled edges that catch directional overhead ambient light.
3. **Dynamic Accents**: In dark mode, `#0B3FCC` transforms to **Electric Cyan `#5AC8FA`** and **Neon Sky `#9EC4FF`** for crystal-clear readability and contrast.
4. **Adaptive Semantic Helpers**: Low-stock, cash, credit, and product avatars dynamically shift from opaque chalky pastels in light mode to **luminous translucent glass pills (`rgba(..., 0.2)`)** in dark mode.

---

## 3. CSS Reference (`src/index.css`)

### 3.1 CSS Variables for Dark Glass
```css
.dark {
  --background: 224 71% 4%;
  --foreground: 214 60% 96%;

  --card: 222 44% 10%;
  --card-foreground: 214 60% 96%;

  --popover: 222 44% 10%;
  --popover-foreground: 214 60% 96%;

  --primary: 217 100% 58%;
  --primary-foreground: 0 0% 100%;

  --secondary: 222 35% 16%;
  --secondary-foreground: 214 50% 92%;

  --muted: 222 30% 15%;
  --muted-foreground: 215 20% 68%;

  --accent: 199 90% 62%;
  --accent-foreground: 222 52% 8%;

  --border: 222 28% 22% / 0.55;
  --input: 222 28% 22% / 0.7;
  --ring: 217 100% 58%;

  --glass-bg: 222 42% 12% / 0.72;
  --glass-border: 214 80% 90% / 0.12;
  --glass-shadow: 217 90% 40% / 0.32;
  --glass-highlight: 0 0% 100% / 0.15;
  --glass-blue-wash: 217 100% 55% / 0.16;
}

html.dark body {
  background-color: #040817;
  background-image:
    radial-gradient(ellipse 90% 60% at 100% -10%, hsl(217 90% 50% / 0.28), transparent 60%),
    radial-gradient(ellipse 70% 50% at -10% 25%, hsl(199 95% 45% / 0.2), transparent 55%),
    radial-gradient(ellipse 60% 50% at 50% 110%, hsl(222 90% 30% / 0.35), transparent 65%),
    linear-gradient(170deg, #030713 0%, #060e24 45%, #08163e 100%);
  background-size: auto, auto, auto, auto;
  background-attachment: fixed, fixed, fixed, fixed;
}
```

### 3.2 Glass Component Overrides in Dark Mode
```css
/* Glass Card */
.dark .glass-card {
  background: linear-gradient(
    160deg,
    rgba(17, 30, 60, 0.72) 0%,
    rgba(8, 15, 34, 0.8) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.15) inset,
    0 16px 40px rgba(0, 0, 0, 0.5),
    0 0 24px rgba(26, 111, 255, 0.08);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
}

.dark .glass-card::before {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 42%,
    rgba(90, 200, 250, 0.06) 100%
  );
}

/* List Card */
.dark .sella-list-card {
  background: linear-gradient(
    165deg,
    rgba(16, 28, 58, 0.7) 0%,
    rgba(7, 14, 32, 0.8) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.12) inset,
    0 14px 34px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
}

/* Stat Tile */
.dark .sella-stat {
  background: linear-gradient(
    160deg,
    rgba(16, 28, 56, 0.7) 0%,
    rgba(8, 15, 33, 0.78) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.14) inset,
    0 12px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
}

/* App Header (Sticky Top Glass) */
.dark .sella-app-header {
  background: linear-gradient(
    180deg,
    rgba(8, 16, 36, 0.82) 0%,
    rgba(4, 8, 22, 0.75) 100%
  );
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.12) inset,
    0 12px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
}

/* Tab Bar (Docked Bottom Glass) */
.dark .sella-tabbar {
  background: linear-gradient(
    180deg,
    rgba(10, 20, 44, 0.82) 0%,
    rgba(4, 8, 22, 0.94) 100%
  );
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.12) inset,
    0 -14px 36px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
}

.dark .sella-tab-active {
  color: #5ac8fa;
  text-shadow: 0 0 12px rgba(90, 200, 250, 0.4);
}

.dark .sella-tab-active::before {
  background: linear-gradient(90deg, #1a6fff, #5ac8fa);
  box-shadow: 0 0 8px rgba(90, 200, 250, 0.7);
}

/* Dialog & Sheet Glass */
.dark .sella-popup-glass {
  background: linear-gradient(
    165deg,
    rgba(15, 26, 54, 0.92) 0%,
    rgba(6, 12, 28, 0.96) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.18) inset,
    0 26px 65px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(32px) saturate(190%);
  -webkit-backdrop-filter: blur(32px) saturate(190%);
}

/* Nested Sub-Cards inside Cards */
.glass-sub-card {
  @apply rounded-xl border border-white/60 bg-white/45 backdrop-blur-sm transition-colors;
}
.dark .glass-sub-card {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset;
}
```

---

## 4. Reusable Sample Codes to Provide to Other Agents

### Sample 1: The macOS Frosted Glass Hero Card
```tsx
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroMoneyCardProps {
  shopName: string;
  period: "today" | "week";
  onPeriodChange: (p: "today" | "week") => void;
  amountFormatted: string;
  salesTotalFormatted: string;
  debtTotalFormatted: string;
}

export function HeroMoneyCard({
  shopName,
  period,
  onPeriodChange,
  amountFormatted,
  salesTotalFormatted,
  debtTotalFormatted,
}: HeroMoneyCardProps) {
  return (
    <section className="glass-card relative rounded-3xl px-4 pt-4 pb-5">
      {/* Top Pill & Segmented Control */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1A6FFF]/12 dark:bg-[#1A6FFF]/20 border border-white/60 dark:border-white/10 px-2.5 py-1 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <span className="text-[11px] font-semibold text-primary dark:text-[#5AC8FA] truncate">
            {shopName}
          </span>
        </div>

        {/* Apple-style Sliding Segmented Pill */}
        <div className="inline-flex rounded-full bg-muted/80 dark:bg-white/10 p-0.5 backdrop-blur-md border border-transparent dark:border-white/10">
          <button
            type="button"
            onClick={() => onPeriodChange("today")}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all",
              period === "today"
                ? "bg-white text-foreground shadow-sm dark:bg-white/20 dark:text-white dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Uyu munsi
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange("week")}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all",
              period === "week"
                ? "bg-white text-foreground shadow-sm dark:bg-white/20 dark:text-white dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Icyumweru
          </button>
        </div>
      </div>

      {/* Main Big Number */}
      <div className="text-center px-1">
        <p className="text-[13px] text-muted-foreground font-medium">Amafaranga yinjiye</p>
        <p className="mt-3 leading-none tracking-tight">
          <span className="text-[2.65rem] sm:text-[2.85rem] font-extrabold text-foreground tabular-nums">
            {amountFormatted}
          </span>
          <span className="ml-1.5 text-base font-bold text-muted-foreground align-top">
            FRW
          </span>
        </p>
        <div className="mt-3 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/50 dark:border-emerald-500/25 px-3 py-1 backdrop-blur-sm">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Igiteranyo: {salesTotalFormatted}
          </span>
        </div>
      </div>

      {/* Lower Metrics Divider */}
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div className="text-center px-1">
          <div className="inline-flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
            <ArrowUpRight size={14} strokeWidth={2.5} />
            <span className="text-sm font-bold tabular-nums text-foreground">
              {salesTotalFormatted}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Ubucuruzi</p>
        </div>
        <div className="text-center px-1 border-l border-border">
          <div className="inline-flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 mb-1">
            <ArrowDownRight size={14} strokeWidth={2.5} />
            <span className="text-sm font-bold tabular-nums text-foreground">
              {debtTotalFormatted}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Ideni ryatanzwe</p>
        </div>
      </div>
    </section>
  );
}
```

---

### Sample 2: Frosted List Card with Nested Metric Sub-Cards
```tsx
import { cn } from "@/lib/utils";

interface ItemCardProps {
  name: string;
  category: string;
  stockQty: number;
  sellingPrice: number;
  profit: number;
  isLowStock: boolean;
  avatarBg: string;
  avatarColor: string;
  formatCurrency: (val: number) => string;
}

export function ItemCard({
  name,
  category,
  stockQty,
  sellingPrice,
  profit,
  isLowStock,
  avatarBg,
  avatarColor,
  formatCurrency,
}: ItemCardProps) {
  return (
    <article className="sella-list-card p-3.5 flex gap-3">
      {/* Dynamic Avatar with specular rim */}
      <div
        className="w-12 h-12 rounded-2xl font-extrabold flex items-center justify-center shrink-0 text-base border border-white/70 dark:border-white/10 shadow-sm backdrop-blur-sm"
        style={{ background: avatarBg, color: avatarColor }}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-foreground truncate">{name}</h3>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{category}</p>
          </div>
          <span
            className={cn(
              "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm",
              isLowStock
                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
            )}
          >
            {isLowStock ? "Bike" : "Hariho"}
          </span>
        </div>

        {/* 3-Column Glass Sub-Card Grid */}
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          <div className="glass-sub-card px-2 py-1.5">
            <p className="text-[9px] text-muted-foreground font-medium">Gurisha</p>
            <p className="text-xs font-extrabold tabular-nums truncate text-[#0B3FCC] dark:text-[#5AC8FA]">
              {formatCurrency(sellingPrice)}
            </p>
          </div>

          <div className="glass-sub-card px-2 py-1.5">
            <p className="text-[9px] text-muted-foreground font-medium">Stock</p>
            <p className={cn("text-xs font-extrabold tabular-nums", isLowStock ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
              {stockQty}
            </p>
          </div>

          <div className="glass-sub-card px-2 py-1.5">
            <p className="text-[9px] text-muted-foreground font-medium">Inyungu</p>
            <p className={cn("text-xs font-extrabold tabular-nums truncate", profit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {formatCurrency(profit)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
```

---

### Sample 3: Quick Action Glass Shortcuts
```tsx
import { Plus, List, TrendingUp, Package, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SHORTCUTS = [
  {
    icon: Plus,
    label: "Igurisha rishya",
    tone: "bg-blue-50/80 text-blue-900 border border-blue-100/60 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-400/20 backdrop-blur-md",
    iconTone: "bg-blue-100 text-blue-700 dark:bg-blue-500/25 dark:text-blue-200",
  },
  {
    icon: List,
    label: "Urutonde rw'amadeni",
    tone: "bg-sky-50/80 text-sky-900 border border-sky-100/60 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-400/20 backdrop-blur-md",
    iconTone: "bg-sky-100 text-sky-700 dark:bg-sky-500/25 dark:text-sky-200",
  },
  {
    icon: TrendingUp,
    label: "Raporo y'amafaranga",
    tone: "bg-indigo-50/80 text-indigo-900 border border-indigo-100/60 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/20 backdrop-blur-md",
    iconTone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-200",
  },
  {
    icon: Package,
    label: "Ububiko (Stock)",
    tone: "bg-slate-50/80 text-slate-800 border border-slate-200/60 dark:bg-slate-700/25 dark:text-slate-200 dark:border-slate-500/20 backdrop-blur-md",
    iconTone: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200",
  },
];

export function QuickActionGrid() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {SHORTCUTS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl p-3 active:scale-[0.97] transition-all",
              item.tone
            )}
          >
            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", item.iconTone)}>
              <Icon size={20} strokeWidth={2.25} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

---

## 5. Verification Checklist

- [x] All 10 Vitest test suites (31 tests) pass without regression.
- [x] TypeScript type checking (`tsc --noEmit`) passes with 0 errors.
- [x] Production build (`npm run build`) builds Vite chunks and PWA service workers cleanly in 4s.
- [x] Tested all major views in Dark Mode: Dashboard, Sales, Debts, Inventory, Clients, Assistant, More, Receipt Settings, Payment Modals, and Auth.
