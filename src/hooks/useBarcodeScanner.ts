import { useEffect, useRef } from "react";

function stripScannedText(target: EventTarget | null, code: string) {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  const current = target.value;
  let remove = 0;
  if (current.endsWith(code)) remove = code.length;
  else if (code && current.endsWith(code[0])) remove = 1;
  if (!remove) return;
  const next = current.slice(0, current.length - remove);
  const proto =
    target instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  desc?.set?.call(target, next);
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

interface UseBarcodeScannerOptions {
  onScan: (scannedCode: string) => void;
  enabled?: boolean;
  minChars?: number;
  maxIntervalMs?: number;
}

/**
 * Global listener for handheld USB/Bluetooth barcode scanners operating in HID keyboard emulation mode.
 * Hardware scanners send rapid sequential keystrokes (< 50-60ms apart) terminated by an Enter key.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minChars = 3,
  maxIntervalMs = 65,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore modifier combinations
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (event.key === "Enter") {
        const code = bufferRef.current.trim();
        bufferRef.current = "";

        // Only treat as scanner output if length meets threshold
        if (code.length >= minChars) {
          event.preventDefault();
          event.stopPropagation();
          stripScannedText(event.target, code);
          onScan(code);
        }
        return;
      }

      // Capture single printable characters (digits, letters, dashes, etc.)
      if (event.key.length === 1) {
        const rapid = interval <= maxIntervalMs && bufferRef.current.length > 0;
        if (!rapid && bufferRef.current.length > 0) {
          // Break in rapid input; reset buffer to current keystroke
          bufferRef.current = event.key;
        } else {
          bufferRef.current += event.key;
        }
        // Swallow the burst once it is clearly a scanner, so the code
        // does not also land in the focused customer or search field.
        if (rapid && bufferRef.current.length >= 2) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    // Use capture phase so we intercept before individual input element bubbling
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, minChars, maxIntervalMs, onScan]);
}
