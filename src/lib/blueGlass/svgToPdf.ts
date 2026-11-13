import { jsPDF } from "jspdf";
import { BLUE_GLASS_PAGE } from "@/lib/blueGlass/assets";
import sellaIconUrl from "@/assets/brand/sella-blueglass-icon.png";
import sellaGlassScriptUrl from "@/assets/brand/sella-glass-script-pdf.png";

let cachedIconDataUrl: string | null = null;
let cachedWordmarkDataUrl: string | null = null;

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Load the official app-icon PNG as a data URL for SVG embeds. */
export async function loadBlueGlassIconDataUrl(
  override?: string | null
): Promise<string> {
  if (override) return override;
  if (cachedIconDataUrl) return cachedIconDataUrl;
  cachedIconDataUrl = await toDataUrl(sellaIconUrl);
  return cachedIconDataUrl;
}

/** Handwritten glass-bold Sella script for papers / PDFs. */
export async function loadBlueGlassWordmarkDataUrl(): Promise<string> {
  if (cachedWordmarkDataUrl) return cachedWordmarkDataUrl;
  cachedWordmarkDataUrl = await toDataUrl(sellaGlassScriptUrl);
  return cachedWordmarkDataUrl;
}

async function ensureBrandFontsLoaded(): Promise<void> {
  try {
    if (typeof document !== "undefined" && document.fonts?.load) {
      await Promise.all([
        document.fonts.load("500 12px Outfit"),
        document.fonts.load("700 12px Outfit"),
        document.fonts.load("700 12px Sora"),
      ]);
      await document.fonts.ready;
    }
  } catch {
    /* continue with fallbacks */
  }
}

async function svgToPngDataUrl(svg: string): Promise<string> {
  await ensureBrandFontsLoaded();
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to rasterize blue-glass SVG"));
      el.src = url;
    });
    const scale = 2.5;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(BLUE_GLASS_PAGE.widthPx * scale);
    canvas.height = Math.round(BLUE_GLASS_PAGE.heightPx * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.fillStyle = "#edf0fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Convert one or more blue-glass SVG pages into a PDF matching the design artboard. */
export async function blueGlassSvgPagesToPdf(pages: string[]): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [BLUE_GLASS_PAGE.widthMm, BLUE_GLASS_PAGE.heightMm],
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage([BLUE_GLASS_PAGE.widthMm, BLUE_GLASS_PAGE.heightMm]);
    const png = await svgToPngDataUrl(pages[i]);
    doc.addImage(
      png,
      "PNG",
      0,
      0,
      BLUE_GLASS_PAGE.widthMm,
      BLUE_GLASS_PAGE.heightMm
    );
  }

  return doc;
}
