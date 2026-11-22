import catalogue from "@/i18n/catalogue.json";
import international from "@/i18n/international.json";
import { publicRows, publicWorld } from "@/i18n/publicCopy";
import enLocales from "@/i18n/locales/en.json";
import rwLocales from "@/i18n/locales/rw.json";
import zhLocales from "@/i18n/locales/zh.json";
import arLocales from "@/i18n/locales/ar.json";
import { getAppLanguage, setAppLanguage, isRTL, type AppLanguage } from "@/lib/appLanguage";
import { useAppLanguage } from "@/i18n/useAppLanguage";

export type CatalogueId = keyof typeof catalogue | keyof typeof publicRows | keyof typeof enLocales | (string & {});

type Row = Partial<Record<AppLanguage, string>> & { en: string; rw: string };

const localeMaps: Partial<Record<AppLanguage, Record<string, string>>> = {
  en: enLocales,
  rw: rwLocales,
  zh: zhLocales,
  ar: arLocales,
};

const rows: Record<string, Row> = {
  ...(catalogue as unknown as Record<string, Row>),
  ...publicRows,
};
const world: Record<string, Partial<Record<AppLanguage, string>>> = {
  ...(international as unknown as Record<string, Partial<Record<AppLanguage, string>>>),
  ...publicWorld,
};

export const APP_LANGUAGES: { id: AppLanguage; label: string }[] = [
  { id: "rw", label: "Ikinyarwanda" },
  { id: "en", label: "English" },
  { id: "zh", label: "中文 (简体)" },
  { id: "ar", label: "العربية" },
  { id: "fr", label: "Français" },
  { id: "sw", label: "Kiswahili" },
  { id: "es", label: "Español" },
  { id: "pt", label: "Português" },
  { id: "rn", label: "Ikirundi" },
  { id: "lg", label: "Luganda" },
];

/** Exact catalogue wording for the active language. */
export function t(
  id: CatalogueId,
  lang: AppLanguage = getAppLanguage(),
  vars?: Record<string, string | number>
): string {
  const row = rows[id];
  let text = localeMaps[lang]?.[id] || world[id]?.[lang] || row?.[lang];
  if (!text) {
    if (import.meta.env.DEV && import.meta.env.VITE_STRICT_I18N === "true" && lang !== "en") {
      return `[MISSING: ${id}]`;
    }
    text = localeMaps.en?.[id] || row?.en || localeMaps.rw?.[id] || row?.rw || id;
  }
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.split(`{${key}}`).join(String(value));
    }
  }
  return text;
}

/** React hook for fully reactive, localized UI components */
export function useTranslation() {
  const lang = useAppLanguage();
  return {
    t: (id: CatalogueId, vars?: Record<string, string | number>) => t(id, lang, vars),
    lang,
    setLang: setAppLanguage,
    isRtl: isRTL(lang),
  };
}

export function dateLocale(lang: AppLanguage = getAppLanguage()): string {
  switch (lang) {
    case "en":
      return "en-GB";
    case "fr":
      return "fr-FR";
    case "es":
      return "es-ES";
    case "pt":
      return "pt-PT";
    case "ar":
      return "ar";
    case "zh":
      return "zh-CN";
    case "sw":
      return "sw-KE";
    case "rn":
      return "rn-BI";
    case "lg":
      return "lg-UG";
    default:
      return "rw-RW";
  }
}
