import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, Send, Printer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { pdfBlobUrlToPreviewImages } from "@/lib/pdfPreview";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Blob/object URL for the real PDF (Send/Print use this; preview is rasterized) */
  pdfUrl?: string | null;
  children?: ReactNode;
  loading?: boolean;
  busy?: boolean;
  onSend?: () => void;
  onPrint?: () => void;
  sendLabel?: string;
  printLabel?: string;
};

/**
 * Small centered glass popup portaled to body.
 * PDF pages are drawn as fitted images (no native viewer clipping).
 */
export function GlassDocPreviewModal({
  open,
  onClose,
  title,
  subtitle,
  pdfUrl,
  children,
  loading = false,
  busy = false,
  onSend,
  onPrint,
  sendLabel = "Send",
  printLabel = "Print",
}: Props) {
  const [pages, setPages] = useState<string[]>([]);
  const [rasterizing, setRasterizing] = useState(false);
  const [rasterError, setRasterError] = useState(false);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !pdfUrl || loading) {
      setPages([]);
      setRasterError(false);
      setRasterizing(false);
      return;
    }
    let cancelled = false;
    setRasterizing(true);
    setRasterError(false);
    setPages([]);
    void pdfBlobUrlToPreviewImages(pdfUrl, {
      maxPages: 8,
      scale: wide ? 1.7 : 2.4,
    })
      .then((imgs) => {
        if (!cancelled) {
          setPages(imgs);
          setRasterizing(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRasterError(true);
          setRasterizing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, pdfUrl, loading, wide]);

  if (!open || typeof document === "undefined") return null;

  const showLoader = loading || rasterizing;
  const canAct = !busy && !loading && !!pdfUrl;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right, 0px))",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 sella-overlay"
        aria-label="Close overlay"
        onClick={onClose}
      />

      <div
        className={cn(
          "sella-popup-glass relative z-10 flex flex-col animate-fade-in",
          "rounded-2xl",
          wide ? "w-full max-w-6xl" : "w-full max-w-[26rem]",
          "max-h-[calc(100dvh-2.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent_28%)]"
        />

        <div className="relative z-10 flex shrink-0 items-center gap-2 border-b border-[#1A6FFF]/10 dark:border-white/10 px-3 py-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[13px] font-bold text-[#0B3FCC] dark:text-[#E8F2FF]">
              {title}
            </h2>
            {subtitle ? (
              <p className="truncate text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-white/80 dark:bg-white/10 text-foreground dark:text-white active:scale-95 transition-colors"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative z-10 min-h-0 overflow-hidden px-2.5 py-2">
          <div
            className={cn(
              "w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#eef1f6] dark:bg-slate-900/60",
              showLoader || (!pages.length && !rasterError && !children)
                ? "flex min-h-[12rem] items-center justify-center"
                : wide
                  ? "max-h-[min(78dvh,42rem)]"
                  : "max-h-[min(68dvh,36rem)]"
            )}
          >
            {showLoader ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-[#0B3FCC] dark:text-[#5AC8FA]">
                <Loader2 className="animate-spin" size={22} />
                <p className="text-[11px] font-semibold">Gutegura preview…</p>
              </div>
            ) : pages.length > 0 ? (
              <div
                className={cn(
                  "overflow-y-auto overscroll-contain px-1.5 py-1.5",
                  wide ? "max-h-[min(78dvh,42rem)]" : "max-h-[min(68dvh,36rem)]"
                )}
              >
                <div className="mx-auto flex w-full flex-col items-center gap-2">
                  {pages.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${title} · page ${i + 1}`}
                      className="block h-auto w-full rounded-xl bg-white shadow-[0_10px_30px_rgba(23,32,51,0.08)]"
                      draggable={false}
                    />
                  ))}
                </div>
              </div>
            ) : rasterError && pdfUrl ? (
              <iframe
                title={title}
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="h-[min(48dvh,24rem)] w-full bg-[#edf0fa] dark:bg-slate-900"
              />
            ) : children ? (
              <div className="max-h-[min(52dvh,26rem)] overflow-y-auto overscroll-contain p-2">
                <div className="mx-auto w-full">{children}</div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Nta preview iboneka
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 grid shrink-0 grid-cols-2 gap-2 border-t border-[#1A6FFF]/10 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 px-2.5 py-2">
          <button
            type="button"
            disabled={!canAct || !onSend}
            onClick={() => onSend?.()}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#1A6FFF]/20 dark:border-white/15 bg-white dark:bg-white/10 text-[13px] font-bold text-[#0B3FCC] dark:text-[#5AC8FA] active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sendLabel}
          </button>
          <button
            type="button"
            disabled={!canAct}
            onClick={() => onPrint?.()}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] text-[13px] font-semibold text-white disabled:opacity-40"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Printer size={14} />
            )}
            {printLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
