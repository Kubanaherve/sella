import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useTheme } from "@/contexts/ThemeContext";
import { COMPANY } from "@/lib/company";
import { MARKETING_PATHS } from "@/lib/site";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/benefits", label: "Benefits" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
  { href: "/support", label: "Support" },
] as const;

export function MarketingShell({ children }: { children: ReactNode }) {
  const { toggleAppearance, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] text-slate-900 dark:text-slate-100 relative overflow-x-hidden selection:bg-[#1A6FFF] selection:text-white">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="liquid-orb liquid-orb--blue w-[500px] h-[500px] -top-32 -left-32" aria-hidden="true" />
      <div className="liquid-orb liquid-orb--cyan w-[420px] h-[420px] top-[28%] -right-40" aria-hidden="true" />

      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0" onClick={() => setOpen(false)}>
            <BrandMark variant="icon" size="sm" framed={false} />
            <span className="font-black text-xl tracking-tight">Sella</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-white/70">
            {NAV.map((item) => (
              <Link key={item.href} to={item.href} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAppearance}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <Link to="/login" className="hidden sm:inline text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
              Sign in
            </Link>
            <Link
              to="/login"
              className="hidden sm:inline h-9 px-4 rounded-xl text-xs font-bold bg-[#1A6FFF] text-white shadow-lg shadow-blue-500/20 inline-flex items-center"
            >
              Open Sella
            </Link>
            <button
              type="button"
              className="lg:hidden w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 inline-flex items-center justify-center"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="lg:hidden border-t border-slate-200/80 dark:border-white/10 px-4 py-3 grid gap-1 bg-white/95 dark:bg-slate-950/95">
            {NAV.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="px-2 py-2.5 text-sm font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/about" onClick={() => setOpen(false)} className="px-2 py-2.5 text-sm font-semibold rounded-lg">
              About
            </Link>
            <Link to="/login" onClick={() => setOpen(false)} className="px-2 py-2.5 text-sm font-bold text-[#1A6FFF]">
              Open the web app
            </Link>
          </nav>
        )}
      </header>

      <main id="main" className="relative z-10">
        {children}
      </main>

      <footer className="relative z-10 border-t border-slate-200/80 dark:border-white/10 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-[1.2fr_2fr]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BrandMark variant="icon" size="xs" framed={false} />
              <span className="font-bold">Sella</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/50 max-w-xs leading-relaxed">
              A product of {COMPANY.legalName}. Shop sales, stock, and customer credit.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-white/50">
            {MARKETING_PATHS.map((path) => (
              <Link key={path} to={path} className="hover:text-slate-900 dark:hover:text-white capitalize">
                {path.slice(1).replace(/-/g, " ")}
              </Link>
            ))}
            <Link to="/docs" className="hover:text-slate-900 dark:hover:text-white">
              User guide
            </Link>
            <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white">
              Terms
            </Link>
            <Link to="/delete-account" className="hover:text-slate-900 dark:hover:text-white">
              Delete account
            </Link>
            <a href={`mailto:${COMPANY.businessEmail}`} className="hover:text-slate-900 dark:hover:text-white">
              {COMPANY.businessEmail}
            </a>
          </div>
        </div>
        <p className="max-w-7xl mx-auto mt-8 text-[11px] text-slate-400 dark:text-white/40">
          © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export function MarketingIntro({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="max-w-3xl mx-auto text-center px-4 pt-14 pb-8 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-[#1A6FFF]">{kicker}</p>
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight">{title}</h1>
      <p className="text-sm sm:text-base text-slate-600 dark:text-white/65 leading-relaxed">{lede}</p>
    </header>
  );
}
