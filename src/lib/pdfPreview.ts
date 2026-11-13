import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Rasterize PDF page(s) to PNG data URLs so the preview can scale
 * cleanly inside a phone-sized popup (native PDF iframes clip).
 */
export async function pdfBlobUrlToPreviewImages(
  pdfUrl: string,
  opts?: { maxPages?: number; scale?: number }
): Promise<string[]> {
  const maxPages = opts?.maxPages ?? 3;
  const scale = opts?.scale ?? 1.75;
  let pdf: PDFDocumentProxy | null = null;
  try {
    pdf = await getDocument({ url: pdfUrl, withCredentials: false }).promise;
    const pages = Math.min(pdf.numPages, maxPages);
    const out: string[] = [];
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#edf0fa";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      out.push(canvas.toDataURL("image/jpeg", 0.88));
    }
    return out;
  } finally {
    try {
      await pdf?.destroy();
    } catch {
      /* ignore */
    }
  }
}
