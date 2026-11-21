export type AppLanguage = "rw" | "en" | "fr" | "es" | "pt" | "ar" | "zh" | "sw" | "rn" | "lg";

const KEY = "sella_app_language_v1";
export const LANGUAGE_EVENT = "sella-language";

const ALL: AppLanguage[] = ["rw", "en", "fr", "es", "pt", "ar", "zh", "sw", "rn", "lg"];

export function applyDocumentLanguage(lang: AppLanguage) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

export function getAppLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && (ALL as string[]).includes(raw)) return raw as AppLanguage;
  } catch {
    /* ignore */
  }
  return "rw";
}

export function setAppLanguage(lang: AppLanguage) {
  localStorage.setItem(KEY, lang);
  applyDocumentLanguage(lang);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }
  return lang;
}
