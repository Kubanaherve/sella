import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { APP_LANGUAGES, t, type CatalogueId } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import { setAppLanguage, type AppLanguage } from "@/lib/appLanguage";
import { COMPANY } from "@/lib/company";
import { isNativeApp } from "@/lib/platform";

const LINKS = [
  { href: "/#register", id: "WEB-001" },
  { href: "/pricing", id: "WEB-002" },
  { href: "/download", id: "WEB-003" },
  { href: "/support", id: "WEB-049" },
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const lang = useAppLanguage();
  const [open, setOpen] = useState(false);
  const native = isNativeApp();

  return (
    <div className="sella-public min-h-screen" dir={lang === "ar" ? "rtl" : "ltr"}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
        {lang === "rw" ? "Simbuka ku birimo" : "Skip to content"}
      </a>
      <header className="sticky top-0 z-30 border-b border-[#E6E6E6] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="Sella">
            <BrandMark variant="icon" size="sm" framed={false} />
            <span className="text-[15px] font-semibold tracking-tight">Sella</span>
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] text-[#4B4B4B] md:flex" aria-label={t("WEB-001" as CatalogueId)}>
            {LINKS.map((item) => (
              <Link key={item.href} to={item.href} className="hover:text-[#141414]">
                {t(item.id as CatalogueId)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="site-lang">{t("WEB-051" as CatalogueId)}</label>
            <select
              id="site-lang"
              value={lang}
              onChange={(event) => setAppLanguage(event.target.value as AppLanguage)}
              className="h-10 rounded-md border border-[#E6E6E6] bg-white px-2 text-[13px]"
            >
              {APP_LANGUAGES.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            {!native && (
              <Link to="/login" className="hidden h-10 items-center px-2 text-[13px] font-medium sm:inline-flex">
                {t("WEB-004" as CatalogueId)}
              </Link>
            )}
            {!native && (
              <Link to="/signup" className="inline-flex h-10 items-center rounded-md bg-[#0B3FCC] px-3 text-[13px] font-semibold text-white">
                {t("WEB-005" as CatalogueId)}
              </Link>
            )}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center md:hidden"
              aria-expanded={open}
              aria-label={open ? t("WEB-053" as CatalogueId) : t("WEB-052" as CatalogueId)}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? "×" : "☰"}
            </button>
          </div>
        </div>
        {open && (
          <nav className="grid gap-1 border-t border-[#E6E6E6] px-4 py-3 text-sm md:hidden">
            {LINKS.map((item) => (
              <Link key={item.href} to={item.href} className="py-2" onClick={() => setOpen(false)}>
                {t(item.id as CatalogueId)}
              </Link>
            ))}
            {!native && (
              <Link to="/login" className="py-2" onClick={() => setOpen(false)}>{t("WEB-004" as CatalogueId)}</Link>
            )}
          </nav>
        )}
      </header>
      <main id="main">{children}</main>
      <footer className="border-t border-[#E6E6E6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[13px] text-[#4B4B4B] sm:flex-row sm:justify-between">
          <p>
            <span className="font-semibold text-[#141414]">Sella</span>
            <span className="mt-1 block max-w-sm">{COMPANY.legalName}, Kigali. {COMPANY.businessEmail}</span>
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy">{t("MISC-011" as CatalogueId)}</Link>
            <Link to="/terms">{t("MISC-010" as CatalogueId)}</Link>
            <Link to="/support">{t("WEB-049" as CatalogueId)}</Link>
            <Link to="/delete-account">{t("WEB-050" as CatalogueId)}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
