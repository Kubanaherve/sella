import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Share a PDF via native sheet / Web Share / download fallback. */
export async function sharePdfBlob(opts: {
  blob: Blob;
  fileName: string;
  title?: string;
  text?: string;
}): Promise<"shared" | "downloaded" | "cancelled"> {
  const { blob, fileName, title = "Sella PDF", text } = opts;

  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      const written = await Filesystem.writeFile({
        path: `share/${fileName}`,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });
      await Share.share({
        title,
        text,
        files: [written.uri],
        dialogTitle: title,
      });
      return "shared";
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/cancel|dismiss|abort/i.test(msg)) return "cancelled";
    }
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return "shared";
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/cancel|abort/i.test(msg)) return "cancelled";
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return "downloaded";
}

/** Open the system print dialog for a PDF blob (new tab / iframe). */
export async function printPdfBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    const tryPrint = () => {
      try {
        win.focus();
        win.print();
      } catch {
        /* ignore */
      }
    };
    win.addEventListener("load", tryPrint);
    window.setTimeout(tryPrint, 700);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  // Popup blocked — trigger download instead
  const a = document.createElement("a");
  a.href = url;
  a.download = `print-${Date.now()}.pdf`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
