import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, labels } from "@/lib/kinyarwanda";
import {
  buildWhatsAppReceiptMessage,
  receiptPdfBlob,
  type ReceiptData,
} from "@/lib/receipt";
import { getReceiptPrefs } from "@/lib/receiptPrefs";
import { ThermalReceipt } from "@/components/sale/ThermalReceipt";
import { phoneToWhatsAppDigits } from "@/lib/phone";
import { printPdfBlob, sharePdfBlob } from "@/lib/sharePdf";
import { GlassDocPreviewModal } from "@/components/GlassDocPreviewModal";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const fileName = `sella-receipt-${data.receiptNumber}.pdf`;

  const statusLabel =
    data.paymentStatus === "paid"
      ? labels.statusPaid
      : data.paymentStatus === "partial"
        ? labels.statusPartial
        : labels.statusCredit;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openPdfPreview = async () => {
    if (!prefs.enabled || !prefs.allowPdf) {
      toast.message("Resi zirahagaritswe mu igenamiterere");
      return;
    }
    setPdfPreviewOpen(true);
    setPreviewLoading(true);
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const blob = await receiptPdfBlob(data);
      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      toast.error("Ntibashoboye gutegura preview");
      setPdfPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPdfPreviewOpen(false);
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
    void openPdfPreview();
  };

  const afterAnimation = () => {
    setShowPrinter(false);
    setPrinterPlay(false);
    void openPdfPreview();
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
    void openPdfPreview();
  };

  const sendPdf = async () => {
    if (!previewBlob) return;
    setBusy(true);
    try {
      const result = await sharePdfBlob({
        blob: previewBlob,
        fileName,
        title: "Sella Receipt",
        text: buildWhatsAppReceiptMessage(data),
      });
      if (result === "shared") toast.success("Resi yoherejwe");
      else if (result === "downloaded") toast.success("PDF yamanitswe");
    } catch {
      toast.error("Kohereza byanze");
    } finally {
      setBusy(false);
    }
  };

  const printPdf = async () => {
    if (!previewBlob) return;
    setBusy(true);
    try {
      await printPdfBlob(previewBlob);
    } catch {
      toast.error("Printinga byanze");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] sella-overlay flex items-end sm:items-center justify-center p-3">
        <div className="sella-popup-glass w-full max-w-md rounded-3xl overflow-hidden">
          <div className="sella-popup-header-glass px-5 pt-5 pb-4 relative">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-md"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="relative z-10 flex items-center gap-2">
              <CheckCircle2 size={22} />
              <p className="font-bold text-lg">{labels.saleComplete}</p>
            </div>
            <p className="relative z-10 text-white/80 text-xs mt-1">{statusLabel}</p>
            <p className="relative z-10 text-3xl font-extrabold mt-3 tabular-nums">
              {formatCurrency(data.total)}
            </p>
            <div className="relative z-10 mt-2 flex gap-4 text-xs text-white/85">
              <span>
                {labels.received}: {formatCurrency(data.paid)}
              </span>
              <span>
                {labels.balance}: {formatCurrency(data.remaining)}
              </span>
            </div>
          </div>

          <div className="relative z-10 p-4 space-y-3">
            <div className="rounded-2xl border border-white/70 bg-white/50 px-3 py-2.5 text-sm backdrop-blur-sm">
              <p className="font-semibold">{data.customerName}</p>
              {data.customerPhone ? (
                <p className="text-xs text-muted-foreground">{data.customerPhone}</p>
              ) : null}
              <div className="mt-2 space-y-1">
                {data.lines.map((l, i) => (
                  <div key={i} className="flex justify-between text-xs gap-2">
                    <span className="truncate">
                      {l.name} × {l.quantity}
                    </span>
                    <span className="font-semibold shrink-0">
                      {formatCurrency(l.unitPrice * l.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {showPrinter && (
              <ThermalReceipt
                data={data}
                play={printerPlay}
                onDone={printerPlay ? afterAnimation : undefined}
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 gap-1.5"
                onClick={() => void openPdfPreview()}
              >
                <FileText size={15} /> Preview
              </Button>
              <Button
                variant="outline"
                className="h-11 gap-1.5"
                onClick={printReceipt}
              >
                <Printer size={15} /> {labels.print}
              </Button>
              <Button
                variant="outline"
                className="h-11 gap-1.5 col-span-2"
                onClick={shareWhatsApp}
              >
                <MessageCircle size={15} /> WhatsApp
              </Button>
              <Button className="h-11 btn-navy col-span-2" onClick={generateWithAnim}>
                <FileText size={15} className="mr-1.5" /> PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <GlassDocPreviewModal
        open={pdfPreviewOpen}
        onClose={closePreview}
        title="Preview ya resi"
        subtitle="Uko PDF izagaragara ku telephone yawe"
        pdfUrl={previewUrl}
        loading={previewLoading}
        busy={busy}
        sendLabel="Send"
        printLabel="Print"
        onSend={() => void sendPdf()}
        onPrint={() => void printPdf()}
      />
    </>
  );
}
