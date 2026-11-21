import catalogue from "@/i18n/catalogue.json";
import international from "@/i18n/international.json";
import { getAppLanguage, type AppLanguage } from "@/lib/appLanguage";

export type CatalogueId = keyof typeof catalogue;

type Row = Partial<Record<AppLanguage, string>> & { en: string; rw: string };

const rows = catalogue as unknown as Record<string, Row>;
const world = international as unknown as Record<string, Partial<Record<AppLanguage, string>>>;

export const APP_LANGUAGES: { id: AppLanguage; label: string }[] = [
  { id: "rw", label: "Ikinyarwanda" },
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
  { id: "es", label: "Español" },
  { id: "pt", label: "Português" },
  { id: "ar", label: "العربية" },
  { id: "zh", label: "中文" },
  { id: "sw", label: "Kiswahili" },
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
  let text = world[id]?.[lang] || row?.[lang] || row?.en || row?.rw || id;
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.split(`{${key}}`).join(String(value));
    }
  }
  return text;
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
