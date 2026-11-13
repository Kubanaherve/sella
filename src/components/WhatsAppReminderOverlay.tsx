import { MessageCircle, FileText, Share2, X } from "lucide-react";
import type { ReminderStatus } from "@/lib/whatsappReminder";
import { cn } from "@/lib/utils";

type Props = {
  status: ReminderStatus;
  errorMessage?: string | null;
  customerName?: string | null;
  onShareAgain?: () => void;
  onOpenPdf?: () => void;
  onClose: () => void;
};

const STATUS_COPY: Record<
  Exclude<ReminderStatus, "idle" | "done">,
  { title: string; detail: string }
> = {
  preparing: {
    title: "Preparing customer statement…",
    detail: "Turimo gutegura PDF n'ubutumwa.",
  },
  opening: {
    title: "Opening WhatsApp…",
    detail: "Hitamo WhatsApp hanyuma kanda Send.",
  },
  fallback: {
    title: "Share PDF and Message",
    detail:
      "WhatsApp ntishoboye gufunguka ku buryo buziguye. Kanda hasi wohereze PDF n'ubutumwa.",
  },
  error: {
    title: "Ntibashoboye kohereza",
    detail: "Ongera ugerageze cyangwa fungura PDF.",
  },
};

export function WhatsAppReminderOverlay({
  status,
  errorMessage,
  customerName,
  onShareAgain,
  onOpenPdf,
  onClose,
}: Props) {
  if (status === "idle" || status === "done") return null;

  const copy = STATUS_COPY[status];
  const busy = status === "preparing" || status === "opening";

  return (
    <div className="fixed inset-0 z-[120] sella-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="sella-sheet-glass w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] animate-fade-in">
        <div className="relative px-5 pt-5 pb-4 text-white overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-[#1ebe57] via-[#25D366] to-[#128C7E]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5"
          />
          {!busy && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-md"
              aria-label="Funga"
            >
              <X size={20} />
            </button>
          )}
          <div className="relative z-10 flex items-center gap-3">
            <span className="w-14 h-14 rounded-[16px] bg-white/20 border border-white/25 flex items-center justify-center backdrop-blur-md">
              <MessageCircle size={28} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                WhatsApp Reminder
              </p>
              <h2 className="text-lg font-extrabold leading-snug pr-8">
                {copy.title}
              </h2>
              {customerName ? (
                <p className="text-sm text-white/90 truncate mt-0.5">
                  {customerName}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative z-10 px-5 py-5 space-y-4">
          <p className="text-[15px] text-slate-600 leading-relaxed">
            {errorMessage || copy.detail}
          </p>

          {busy && (
            <div className="flex items-center gap-3 rounded-2xl bg-white/55 border border-white/70 px-4 py-3 backdrop-blur-sm">
              <span className="w-5 h-5 rounded-full border-2 border-[#25D366] border-t-transparent animate-spin shrink-0" />
              <span className="text-sm font-semibold text-slate-700">
                {status === "preparing"
                  ? "Preparing customer statement…"
                  : "Opening WhatsApp…"}
              </span>
            </div>
          )}

          {(status === "fallback" || status === "error") && (
            <div className="space-y-2.5">
              {onShareAgain && (
                <button
                  type="button"
                  onClick={onShareAgain}
                  className="w-full min-h-[56px] rounded-2xl bg-[#25D366] text-white text-[16px] font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(37,211,102,0.28)] border border-white/25 active:scale-[0.98]"
                >
                  <Share2 size={20} />
                  Share PDF and Message
                </button>
              )}
              {onOpenPdf && (
                <button
                  type="button"
                  onClick={onOpenPdf}
                  className={cn(
                    "sella-btn-glass w-full min-h-[52px] rounded-2xl text-[15px]"
                  )}
                >
                  <FileText size={18} />
                  Fungura PDF
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[48px] rounded-2xl text-slate-500 text-sm font-semibold"
              >
                Funga
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
