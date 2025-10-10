import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, labels } from "@/lib/kinyarwanda";
import {
  buildWhatsAppReceiptMessage,
  downloadReceiptPdf,
  type ReceiptData,
} from "@/lib/receipt";
import { getReceiptPrefs } from "@/lib/receiptPrefs";
import { ThermalReceipt } from "@/components/sale/ThermalReceipt";
import { phoneToWhatsAppDigits } from "@/lib/phone";
import { toast } from "sonner";
import {
  CheckCircle2,
  FileText,
  MessageCircle,
  Printer,
  X,
} from "lucide-react";

type Props = {
  data: ReceiptData;
  onClose: () => void;
};

export function SaleComplete({ data, onClose }: Props) {
  const prefs = useMemo(() => getReceiptPrefs(), []);
  const [showPrinter, setShowPrinter] = useState(false);
  const [printerPlay, setPrinterPlay] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const statusLabel =
    data.paymentStatus === "paid"
      ? labels.statusPaid
      : data.paymentStatus === "partial"
        ? labels.statusPartial
        : labels.statusCredit;

  const doDownloadPdf = async () => {
    await downloadReceiptPdf(data);
    setPdfPreviewOpen(false);
    toast.success("PDF ya resi yakuruwe");
  };

  const openPdfPreview = () => {
    if (!prefs.enabled || !prefs.allowPdf) {
      toast.message("Resi zirahagaritswe mu igenamiterere");
      return;
    }
    setPdfPreviewOpen(true);
  };

  const generateWithAnim = () => {
    if (!prefs.enabled || !prefs.allowPdf) {
      toast.message("Resi zirahagaritswe mu igenamiterere");
      return;
    }
    if (prefs.showAnimation) {
      setShowPrinter(true);
      setPrinterPlay(true);
      return;
    }
    openPdfPreview();
  };

  const afterAnimation = () => {
    setShowPrinter(false);
    setPrinterPlay(false);
    setPdfPreviewOpen(true);
  };

  const shareWhatsApp = () => {
    if (!prefs.allowWhatsApp) {
      toast.message("Kohereza kuri WhatsApp birahagaritswe");
      return;
    }
    const msg = buildWhatsAppReceiptMessage(data);
    const digits = data.customerPhone
      ? phoneToWhatsAppDigits(data.customerPhone)
      : "";
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const printReceipt = () => {
    if (!prefs.allowPrint) {
      toast.message("Printinga irahagaritswe");
      return;
    }
    setPdfPreviewOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
        <div className="w-full max-w-md bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#0b4fd9] to-[#1a6fff] px-5 pt-5 pb-4 text-white relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={22} />
              <h2 className="font-bold text-lg">{labels.saleCompleted}</h2>
            </div>
            <p className="text-xs text-white/75 mt-1">{data.receiptNumber}</p>
            <p className="text-3xl font-extrabold tabular-nums mt-3">
              {formatCurrency(data.total)}
            </p>
          </div>

          <div className="p-4 space-y-3">
            <div className="rounded-2xl bg-muted/50 border border-border p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{labels.received}</span>
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(data.paid)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{labels.balance}</span>
                <span className="font-semibold text-rose-700">
                  {formatCurrency(data.remaining)}
                </span>
              </div>
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground pt-1">
                Imiterere: {statusLabel}
              </p>
              {data.lines.slice(0, 4).map((l, i) => (
                <p key={i} className="text-[11px] text-muted-foreground flex justify-between gap-2">
                  <span className="truncate">
                    {l.name} × {l.quantity}
                  </span>
                  <span className="shrink-0">
                    {formatCurrency(l.unitPrice * l.quantity)}
                  </span>
                </p>
              ))}
              {data.lines.length > 4 && (
                <p className="text-[10px] text-muted-foreground">
                  … n&apos;andi {data.lines.length - 4}
                </p>
              )}
            </div>

            {showPrinter && prefs.enabled && (
              <ThermalReceipt
                data={data}
                play={printerPlay}
                onDone={printerPlay ? afterAnimation : undefined}
              />
            )}

            {prefs.enabled && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 h-11"
                  onClick={generateWithAnim}
                >
                  <FileText size={15} /> {labels.receipt}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 h-11"
                  onClick={printReceipt}
                >
                  <Printer size={15} /> {labels.print}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 col-span-2 h-11"
                  onClick={shareWhatsApp}
                >
                  <MessageCircle size={15} /> WhatsApp
                </Button>
              </div>
            )}

            <Button type="button" className="w-full h-12 btn-navy font-bold" onClick={onClose}>
              {labels.finish}
            </Button>
          </div>
        </div>
      </div>

      {pdfPreviewOpen && (
        <div className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md max-h-[92vh] bg-slate-100 rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col overflow-hidden">
            <div className="bg-white px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold">Preview ya resi</h3>
                <p className="text-[11px] text-muted-foreground">
                  Uko PDF izagaragara mbere yo kuyimanura
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                onClick={() => setPdfPreviewOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-sm shadow border border-slate-200 mx-auto max-w-sm overflow-hidden">
                <div className="bg-[#1a6fff] text-white text-center px-3 py-4">
                  <p className="font-bold text-lg">{data.shopName}</p>
                  <p className="text-[10px] text-blue-100 mt-0.5">{data.receiptNumber}</p>
                </div>
                <div className="px-3 py-2 text-[11px] text-slate-600 border-b border-slate-100">
                  <p>{data.customerName}</p>
                  {data.customerPhone && <p>{data.customerPhone}</p>}
                </div>
                <div className="divide-y divide-slate-100">
                  {data.lines.map((l, i) => (
                    <div key={i} className="px-3 py-2 flex justify-between text-[11px] gap-2">
                      <span className="truncate">
                        {l.name} × {l.quantity}
                      </span>
                      <span className="font-semibold shrink-0">
                        {formatCurrency(l.unitPrice * l.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-3 space-y-1 border-t border-slate-200 text-sm">
                  <div className="flex justify-between font-bold">
                    <span>{labels.total}</span>
                    <span>{formatCurrency(data.total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 text-xs">
                    <span>{labels.received}</span>
                    <span>{formatCurrency(data.paid)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 text-xs">
                    <span>{labels.balance}</span>
                    <span>{formatCurrency(data.remaining)}</span>
                  </div>
                </div>
                {data.thankYouMessage && (
                  <p className="px-3 pb-3 text-[10px] text-center text-slate-500">
                    {data.thankYouMessage}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-white border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setPdfPreviewOpen(false)}
              >
                Subira
              </Button>
              <Button
                className="flex-[1.3] h-11 btn-navy font-bold gap-1.5"
                onClick={() => void doDownloadPdf()}
              >
                <FileText size={16} /> Manura PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
