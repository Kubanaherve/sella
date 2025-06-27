export type AppLanguage = "rw" | "en";

const KEY = "sella_app_language_v1";

export function getAppLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "en" || raw === "rw") return raw;
  } catch {
    /* ignore */
  }
  return "rw";
}

export function setAppLanguage(lang: AppLanguage) {
  localStorage.setItem(KEY, lang);
  return lang;
}
