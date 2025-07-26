import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import {
  buildDebtWhatsAppMessage,
  formatItemsParen,
  invoicePdfBlob,
  type InvoiceData,
} from "@/lib/invoicePdf";
import { normalizePhoneE164, phoneToWhatsAppDigits } from "@/lib/phone";

export type ReminderStatus =
  | "idle"
  | "preparing"
  | "opening"
  | "fallback"
  | "error"
  | "done";

export type ReminderPrepareResult = {
  ok: true;
  message: string;
  phoneE164: string;
  waDigits: string;
  fileName: string;
  blob: Blob;
  invoice: InvoiceData;
} | {
  ok: false;
  reason: "missing_phone" | "invalid_phone" | "no_debt" | "pdf_failed";
  message: string;
};

export type ReminderShareResult = {
  ok: boolean;
  mode: "native_share" | "web_share" | "whatsapp_text" | "saved_fallback";
  error?: string;
};

/** Validate Rwandan / E.164 customer phone for WhatsApp. */
export function validateCustomerPhone(raw: string | null | undefined): {
  ok: boolean;
  e164?: string;
  waDigits?: string;
  error?: string;
} {
  if (!raw || !String(raw).trim()) {
    return {
      ok: false,
      error: "Uyu mukiriya nta numero afite. Ongeraho numero mbere yo kohereza.",
    };
  }
  const e164 = normalizePhoneE164(raw);
  const digits = e164.replace(/\D/g, "");
  // Rwanda mobile: +250 7XXXXXXXX (12 digits with country code)
  const okRw = digits.startsWith("250") && digits.length === 12 && /^2507\d{8}$/.test(digits);
  const okIntl = digits.length >= 10 && digits.length <= 15;
  if (!okRw && !okIntl) {
    return {
      ok: false,
      error: "Numero ntiyemewe. Gerageza format: 07X XXX XXX cyangwa +2507XXXXXXXX.",
    };
  }
  if (!okRw && digits.startsWith("250") && digits.length !== 12) {
    return {
      ok: false,
      error: "Numero ya Rwanda igomba kuba +2507XXXXXXXX (imibare 9 nyuma ya 0).",
    };
  }
  return { ok: true, e164, waDigits: phoneToWhatsAppDigits(e164) };
}

export async function prepareDebtReminder(opts: {
  invoice: InvoiceData;
  remaining: number;
}): Promise<ReminderPrepareResult> {
  if (opts.remaining <= 0) {
    return {
      ok: false,
      reason: "no_debt",
      message: "Uyu mukiriya nta deni asigaye. Nta ubutumwa bwo kwibutsa bukenewe.",
    };
  }

  const phoneCheck = validateCustomerPhone(opts.invoice.customerPhone);
  if (!phoneCheck.ok || !phoneCheck.e164 || !phoneCheck.waDigits) {
    return {
      ok: false,
      reason: phoneCheck.error?.includes("nta numero") ? "missing_phone" : "invalid_phone",
      message: phoneCheck.error || "Numero ntiyemewe.",
    };
  }

  try {
    const itemsParen = formatItemsParen(opts.invoice.lines);
    const message = buildDebtWhatsAppMessage({
      itemsParen,
      shopName: opts.invoice.shopName,
      payPhone: opts.invoice.payPhone,
    });
    const blob = await invoicePdfBlob(opts.invoice);
    if (!blob || blob.size < 50) {
      return {
        ok: false,
        reason: "pdf_failed",
        message: "Ntibashoboye gutegura PDF. Ongera ugerageze.",
      };
    }
    const safeName = (opts.invoice.customerName || "umukiriya")
      .replace(/[^\w-]+/g, "_")
      .slice(0, 40);
    const fileName = `Sella_Ideni_${safeName}.pdf`;
    return {
      ok: true,
      message,
      phoneE164: phoneCheck.e164,
      waDigits: phoneCheck.waDigits,
      fileName,
      blob,
      invoice: opts.invoice,
    };
  } catch (e) {
    console.error("prepareDebtReminder", e);
    return {
      ok: false,
      reason: "pdf_failed",
      message: "Ntibashoboye gutegura PDF. Ongera ugerageze.",
    };
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Write PDF to app cache and return a shareable file URI. */
export async function writeReminderPdfToCache(
  blob: Blob,
  fileName: string
): Promise<string> {
  const base64 = await blobToBase64(blob);
  const result = await Filesystem.writeFile({
    path: `reminders/${fileName}`,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });
  return result.uri;
}

/**
 * One-tap share: PDF + personalized message via native share sheet.
 * Shop owner picks WhatsApp → taps Send.
 */
export async function shareDebtReminderNative(prepared: {
  message: string;
  fileName: string;
  blob: Blob;
  waDigits: string;
}): Promise<ReminderShareResult> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const uri = await writeReminderPdfToCache(prepared.blob, prepared.fileName);
      await Share.share({
        title: "Kohereza kwibutsa kuri WhatsApp",
        text: prepared.message,
        files: [uri],
        dialogTitle: "Hitamo WhatsApp",
      });
      return { ok: true, mode: "native_share" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // User cancelled share sheet — not a hard failure
      if (/cancel|dismiss|abort/i.test(msg)) {
        return { ok: true, mode: "native_share" };
      }
      console.error("native share failed", e);
      // Fallback: open WhatsApp chat with text; keep PDF in cache for retry
      try {
        window.open(
          `https://wa.me/${prepared.waDigits}?text=${encodeURIComponent(prepared.message)}`,
          "_blank"
        );
        return { ok: true, mode: "whatsapp_text", error: msg };
      } catch {
        return { ok: false, mode: "saved_fallback", error: msg };
      }
    }
  }

  // Web / PWA: Web Share Level 2 with files when available
  try {
    const file = new File([prepared.blob], prepared.fileName, {
      type: "application/pdf",
    });
    const nav = navigator as Navigator & {
      canShare?: (d: ShareData) => boolean;
      share?: (d: ShareData) => Promise<void>;
    };
    if (nav.share && nav.canShare?.({ files: [file], text: prepared.message })) {
      await nav.share({
        files: [file],
        text: prepared.message,
        title: "Kohereza kwibutsa kuri WhatsApp",
      });
      return { ok: true, mode: "web_share" };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/abort|cancel/i.test(msg)) {
      return { ok: true, mode: "web_share" };
    }
  }

  // Last resort web: open WhatsApp text + trigger download of PDF in same gesture chain
  try {
    const url = URL.createObjectURL(prepared.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = prepared.fileName;
    a.click();
    URL.revokeObjectURL(url);
    window.open(
      `https://wa.me/${prepared.waDigits}?text=${encodeURIComponent(prepared.message)}`,
      "_blank"
    );
    return { ok: true, mode: "whatsapp_text" };
  } catch (e) {
    return {
      ok: false,
      mode: "saved_fallback",
      error: e instanceof Error ? e.message : "Share failed",
    };
  }
}

/** Open PDF from a retained blob (fallback “open document”). */
export function openPdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Full one-tap prepare → share. Callers drive status UI via onStatus. */
export async function runDebtReminderShare(opts: {
  invoice: InvoiceData;
  remaining: number;
  onStatus?: (s: ReminderStatus, detail?: string) => void;
}): Promise<{
  prepared: Extract<ReminderPrepareResult, { ok: true }> | null;
  share: ReminderShareResult | null;
  error?: string;
}> {
  opts.onStatus?.("preparing");
  const prepared = await prepareDebtReminder({
    invoice: opts.invoice,
    remaining: opts.remaining,
  });
  if (!prepared.ok) {
    opts.onStatus?.("error", prepared.message);
    return { prepared: null, share: null, error: prepared.message };
  }

  opts.onStatus?.("opening");
  const share = await shareDebtReminderNative(prepared);
  if (!share.ok) {
    opts.onStatus?.(
      "fallback",
      "PDF iri ready. Kanda « Share PDF and Message » wohereze."
    );
    return { prepared, share };
  }
  if (share.mode === "whatsapp_text" || share.mode === "saved_fallback") {
    opts.onStatus?.(
      "fallback",
      "Ubutumwa bwateguwe. Kanda « Share PDF and Message » wohereze PDF hamwe."
    );
    return { prepared, share };
  }
  opts.onStatus?.("done");
  return { prepared, share };
}
