import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { APP_LANGUAGES } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import { setAppLanguage, type AppLanguage } from "@/lib/appLanguage";

interface GlobalLanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "minimal" | "compact";
}

/**
 * Universal Global Language Switcher supporting:
 * - English (en)
 * - Ikinyarwanda (rw)
 * - Simplified Chinese (zh)
 * - Arabic (ar)
 * and regional languages. Persists instantly to localStorage and cookies.
 */
export function GlobalLanguageSwitcher({
  className = "",
  variant = "pill",
}: GlobalLanguageSwitcherProps) {
  const currentLang = useAppLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOption = APP_LANGUAGES.find((item) => item.id === currentLang) || APP_LANGUAGES[0];

  const handleSelect = (langId: AppLanguage) => {
    setAppLanguage(langId);
    setIsOpen(false);
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {["rw", "en", "zh", "ar"].map((id) => {
          const item = APP_LANGUAGES.find((l) => l.id === id);
          if (!item) return null;
          const isActive = currentLang === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id as AppLanguage)}
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#0B3FCC] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-start ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select Language"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200/90 bg-white/95 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#0B3FCC]/30"
      >
        <Globe size={14} className="text-[#0B3FCC] shrink-0" />
        <span className="truncate max-w-[100px]">{activeOption.label}</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-1.5 w-48 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {currentLang === "rw"
              ? "Hitamo Ururimi"
              : currentLang === "zh"
              ? "选择语言"
              : currentLang === "ar"
              ? "اختر اللغة"
              : "Select Language"}
          </div>

          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {APP_LANGUAGES.map((item) => {
              const isSelected = currentLang === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-[#0B3FCC] font-bold"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-[10px] font-mono uppercase text-slate-400">
                      {item.id}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  {isSelected && <Check size={14} className="text-[#0B3FCC] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
