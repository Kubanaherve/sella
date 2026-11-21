import { APP_LANGUAGES } from "@/i18n";
import { t } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import { setAppLanguage, type AppLanguage } from "@/lib/appLanguage";

/** Preferred language. One choice rewrites the shop UI and customer messages. */
export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const lang = useAppLanguage();
  const choose = (next: AppLanguage) => setAppLanguage(next);

  if (compact) {
    return (
      <div className="flex flex-wrap justify-end gap-1 max-w-[280px]">
        {APP_LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => choose(item.id)}
            className={`text-[10px] px-1.5 py-1 rounded font-bold ${
              lang === item.id ? "bg-white text-primary" : "text-slate-600"
            }`}
          >
            {item.id.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <section className="sella-list-card p-3 space-y-2">
      <p className="text-sm font-semibold text-foreground">{t("SETT-006")}</p>
      <p className="text-xs text-muted-foreground">
        {t("SETT-001")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {APP_LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => choose(item.id)}
            className={`min-h-[44px] rounded-xl text-sm font-bold transition-all ${
              lang === item.id
                ? "bg-[#0B4FD9] text-white shadow-md shadow-[#0B4FD9]/30"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
