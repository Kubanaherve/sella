import { useEffect, useState } from "react";
import { applyDocumentLanguage, getAppLanguage, LANGUAGE_EVENT, type AppLanguage } from "@/lib/appLanguage";

/** Re-renders when the shop changes preferred language in settings. */
export function useAppLanguage(): AppLanguage {
  const [lang, setLang] = useState<AppLanguage>(() => getAppLanguage());
  useEffect(() => {
    const sync = () => {
      const next = getAppLanguage();
      applyDocumentLanguage(next);
      setLang(next);
    };
    sync();
    window.addEventListener(LANGUAGE_EVENT, sync);
    return () => window.removeEventListener(LANGUAGE_EVENT, sync);
  }, []);
  return lang;
}
