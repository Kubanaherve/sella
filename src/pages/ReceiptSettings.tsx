import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { getReceiptPrefs, setReceiptPrefs, type ReceiptPrefs } from "@/lib/receiptPrefs";
import {
  getAppLanguage,
  setAppLanguage,
  type AppLanguage,
} from "@/lib/appLanguage";
import { toast } from "sonner";

export default function ReceiptSettingsPage() {
  const [prefs, setPrefs] = useState<ReceiptPrefs>(() => getReceiptPrefs());
  const [lang, setLang] = useState<AppLanguage>(() => getAppLanguage());

  const update = (patch: Partial<ReceiptPrefs>) => {
    const next = setReceiptPrefs(patch);
    setPrefs(next);
    toast.success("Byabitswe");
  };

  const updateLang = (next: AppLanguage) => {
    setAppLanguage(next);
    setLang(next);
    toast.success(next === "en" ? "PDF language: English" : "Ururimi rwa PDF: Ikinyarwanda");
  };

  return (
    <div className="sella-page">
      <PageHeader
        title="Resi"
        subtitle="Si ngombwa — igurisha rikora nta resi"
      />
      <main className="sella-page-body space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            Ururimi rwa PDF / PDF language
          </p>
          <p className="text-xs text-muted-foreground">
            Amafaranga yose ya PDF (fakitire, resi, raporo) akoresha uru rurimi.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateLang("rw")}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold ${
                lang === "rw"
                  ? "bg-[#0B4FD9] text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Ikinyarwanda
            </button>
            <button
              type="button"
              onClick={() => updateLang("en")}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold ${
                lang === "en"
                  ? "bg-[#0B4FD9] text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {(
          [
            ["enabled", "Koresha resi"],
            ["autoGenerate", "Fungura resi nyuma y'igurisha"],
            ["allowPdf", "Emera gukurura PDF"],
            ["allowPrint", "Emera printinga"],
            ["allowWhatsApp", "Emera kohereza kuri WhatsApp"],
            ["showAnimation", "Erekana animation ya printer"],
          ] as const
        ).map(([key, label]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
          >
            <span className="text-sm font-medium">{label}</span>
            <Switch
              checked={Boolean(prefs[key])}
              onCheckedChange={(v) => update({ [key]: v })}
            />
          </div>
        ))}
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <label className="text-xs font-medium text-slate-600">
            Ubutumwa bwo gushima
          </label>
          <Input
            value={prefs.thankYouMessage}
            onChange={(e) => setPrefs((p) => ({ ...p, thankYouMessage: e.target.value }))}
            onBlur={() => update({ thankYouMessage: prefs.thankYouMessage })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          PDF zose zikoresha design imwe ya Sella. Izina rya shop yawe rigaragara
          ku mutwe w&apos;inyandiko.
        </p>
      </main>
    </div>
  );
}
