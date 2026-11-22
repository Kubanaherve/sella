import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { getReceiptPrefs, setReceiptPrefs, type ReceiptPrefs } from "@/lib/receiptPrefs";
import { LanguagePicker } from "@/components/LanguagePicker";
import { t } from "@/i18n";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import type { AppLanguage } from "@/lib/appLanguage";
import { toast } from "sonner";

const SWITCHES: Record<
  AppLanguage,
  Record<
    | "enabled"
    | "autoGenerate"
    | "allowPdf"
    | "allowPrint"
    | "allowWhatsApp"
    | "allowSms"
    | "autoSendWhatsApp"
    | "autoSendSms"
    | "showAnimation",
    string
  >
> = {
  rw: {
    enabled: "Koresha resi",
    autoGenerate: "Fungura resi nyuma y'igurisha",
    allowPdf: "Emera kudownloadinga PDF",
    allowPrint: "Emera kuprinta",
    allowWhatsApp: "Emera kohereza kuri WhatsApp",
    allowSms: "Emera kohereza kuri SMS",
    autoSendWhatsApp: "Kohereza ako kanya kuri WhatsApp niba telefoni ihari",
    autoSendSms: "Kohereza ako kanya kuri SMS niba telefoni ihari",
    showAnimation: "Erekana animation ya printer",
  },
  en: {
    enabled: "Use receipts",
    autoGenerate: "Open the receipt after a sale",
    allowPdf: "Allow PDF download",
    allowPrint: "Allow printing",
    allowWhatsApp: "Allow WhatsApp",
    allowSms: "Allow SMS",
    autoSendWhatsApp: "Auto-send receipt to WhatsApp if customer phone exists",
    autoSendSms: "Auto-send receipt to SMS if customer phone exists",
    showAnimation: "Show the printer animation",
  },
  fr: {
    enabled: "Utiliser les reçus",
    autoGenerate: "Ouvrir le reçu après une vente",
    allowPdf: "Autoriser le PDF",
    allowPrint: "Autoriser l'impression",
    allowWhatsApp: "Autoriser WhatsApp",
    allowSms: "Autoriser les SMS",
    autoSendWhatsApp: "Envoyer auto sur WhatsApp si téléphone présent",
    autoSendSms: "Envoyer auto par SMS si téléphone présent",
    showAnimation: "Afficher l'animation de l'imprimante",
  },
  sw: {
    enabled: "Tumia risiti",
    autoGenerate: "Fungua risiti baada ya mauzo",
    allowPdf: "Ruhusu kupakua PDF",
    allowPrint: "Ruhusu kuchapisha",
    allowWhatsApp: "Ruhusu WhatsApp",
    allowSms: "Ruhusu SMS",
    autoSendWhatsApp: "Tuma kiotomatiki kwa WhatsApp ikiwa simu ipo",
    autoSendSms: "Tuma kiotomatiki kwa SMS ikiwa simu ipo",
    showAnimation: "Onyesha mchoro wa printa",
  },
  rn: {
    enabled: "Koresha resi",
    autoGenerate: "Fungura resi inyuma y'igurisha",
    allowPdf: "Emera kudownloadinga PDF",
    allowPrint: "Emera kuprinta",
    allowWhatsApp: "Emera WhatsApp",
    allowSms: "Emera SMS",
    autoSendWhatsApp: "Rungika ako kanya kuri WhatsApp",
    autoSendSms: "Rungika ako kanya kuri SMS",
    showAnimation: "Erekana animation ya printer",
  },
  lg: {
    enabled: "Kozesa risiti",
    autoGenerate: "Ggulawo risiti oluvannyuma lw'otunda",
    allowPdf: "Kiriza kudownloadinga PDF",
    allowPrint: "Kiriza okupulinta",
    allowWhatsApp: "Kiriza WhatsApp",
    allowSms: "Kiriza SMS",
    autoSendWhatsApp: "Sindika mu WhatsApp singa essimu eriwo",
    autoSendSms: "Sindika mu SMS singa essimu eriwo",
    showAnimation: "Laga animation ya pulinta",
  },
  es: {
    enabled: "Usar recibos",
    autoGenerate: "Abrir el recibo después de la venta",
    allowPdf: "Permitir descargar PDF",
    allowPrint: "Permitir imprimir",
    allowWhatsApp: "Permitir WhatsApp",
    allowSms: "Permitir SMS",
    autoSendWhatsApp: "Enviar auto por WhatsApp si hay teléfono",
    autoSendSms: "Enviar auto por SMS si hay teléfono",
    showAnimation: "Mostrar la animación de la impresora",
  },
  pt: {
    enabled: "Usar recibos",
    autoGenerate: "Abrir o recibo depois da venda",
    allowPdf: "Permitir descarregar PDF",
    allowPrint: "Permitir impressão",
    allowWhatsApp: "Permitir WhatsApp",
    allowSms: "Permitir SMS",
    autoSendWhatsApp: "Enviar auto por WhatsApp se houver telefone",
    autoSendSms: "Enviar auto por SMS se houver telefone",
    showAnimation: "Mostrar a animação da impressora",
  },
  ar: {
    enabled: "استخدام الإيصالات",
    autoGenerate: "فتح الإيصال بعد البيع",
    allowPdf: "السماح بتنزيل PDF",
    allowPrint: "السماح بالطباعة",
    allowWhatsApp: "السماح بـ WhatsApp",
    allowSms: "السماح بـ SMS",
    autoSendWhatsApp: "إرسال تلقائي عبر WhatsApp عند توفر الهاتف",
    autoSendSms: "إرسال تلقائي عبر SMS عند توفر الهاتف",
    showAnimation: "إظهار حركة الطابعة",
  },
  zh: {
    enabled: "使用收据",
    autoGenerate: "销售后打开收据",
    allowPdf: "允许下载 PDF",
    allowPrint: "允许打印",
    allowWhatsApp: "允许 WhatsApp",
    allowSms: "允许 SMS 短信",
    autoSendWhatsApp: "客户有电话时自动发送 WhatsApp",
    autoSendSms: "客户有电话时自动发送短信",
    showAnimation: "显示打印机动画",
  },
};

export default function ReceiptSettingsPage() {
  const lang = useAppLanguage();
  const [prefs, setPrefs] = useState<ReceiptPrefs>(() => getReceiptPrefs());

  const update = (patch: Partial<ReceiptPrefs>) => {
    const next = setReceiptPrefs(patch);
    setPrefs(next);
    toast.success(t("NOTIF-003"));
  };

  return (
    <div className="sella-page">
      <PageHeader
        title={t("SETT-004")}
        subtitle={t("SETT-005")}
      />
      <main className="sella-page-body space-y-3">
        <LanguagePicker />

        {(
          [
            ["enabled", SWITCHES[lang].enabled],
            ["autoGenerate", SWITCHES[lang].autoGenerate],
            ["allowPdf", SWITCHES[lang].allowPdf],
            ["allowPrint", SWITCHES[lang].allowPrint],
            ["allowWhatsApp", SWITCHES[lang].allowWhatsApp],
            ["allowSms", SWITCHES[lang].allowSms],
            ["autoSendWhatsApp", SWITCHES[lang].autoSendWhatsApp],
            ["autoSendSms", SWITCHES[lang].autoSendSms],
            ["showAnimation", SWITCHES[lang].showAnimation],
          ] as const
        ).map(([key, label]) => (
          <div
            key={key}
            className="sella-list-card flex items-center justify-between p-3"
          >
            <span className="text-sm font-medium text-foreground">{label}</span>
            <Switch
              checked={Boolean(prefs[key])}
              onCheckedChange={(v) => update({ [key]: v })}
            />
          </div>
        ))}
        <div className="sella-list-card p-3 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t("SETT-011")}
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
