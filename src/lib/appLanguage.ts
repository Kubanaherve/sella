export type AppLanguage = "rw" | "en" | "fr" | "es" | "pt" | "ar" | "zh" | "sw" | "rn" | "lg";

const KEY = "sella_app_language_v1";
export const LANGUAGE_EVENT = "sella-language";

export const ALL_APP_LANGUAGES: AppLanguage[] = ["rw", "en", "fr", "es", "pt", "ar", "zh", "sw", "rn", "lg"];

export function isRTL(lang: AppLanguage): boolean {
  return lang === "ar";
}

export function applyDocumentLanguage(lang: AppLanguage) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
}

function detectBrowserLanguage(): AppLanguage {
  if (typeof navigator === "undefined" || !navigator.language) return "rw";
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("ar")) return "ar";
  // Sella default language is Kinyarwanda
  return "rw";
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export function getAppLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && (ALL_APP_LANGUAGES as string[]).includes(raw)) return raw as AppLanguage;
  } catch {
    /* ignore */
  }
  const cookieLang = getCookie("sella_lang");
  if (cookieLang && (ALL_APP_LANGUAGES as string[]).includes(cookieLang)) {
    return cookieLang as AppLanguage;
  }
  return detectBrowserLanguage();
}

export function setAppLanguage(lang: AppLanguage): AppLanguage {
  try {
    localStorage.setItem(KEY, lang);
    if (typeof document !== "undefined") {
      document.cookie = `sella_lang=${lang};path=/;max-age=31536000;SameSite=Lax`;
    }
  } catch {
    /* ignore */
  }
  applyDocumentLanguage(lang);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }
  return lang;
}

// Synchronously apply document attributes on load
if (typeof document !== "undefined") {
  applyDocumentLanguage(getAppLanguage());
}
