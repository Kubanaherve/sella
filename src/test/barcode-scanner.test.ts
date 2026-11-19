import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

function TestScannerComponent({
  onScan,
  enabled,
  maxIntervalMs,
}: {
  onScan: (code: string) => void;
  enabled?: boolean;
  maxIntervalMs?: number;
}) {
  useBarcodeScanner({ onScan, enabled, maxIntervalMs });
  return React.createElement("div");
}

describe("useBarcodeScanner hardware listener", () => {
  it("detects rapid sequential scanner keystrokes and fires onScan on Enter", async () => {
    const onScan = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    root.render(React.createElement(TestScannerComponent, { onScan, enabled: true }));
    await new Promise((r) => setTimeout(r, 20));

    const barcode = "6001234567890";
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    for (const char of barcode) {
      now += 20;
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: char, bubbles: true })
      );
    }

    now += 20;
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith(barcode);

    root.unmount();
    container.remove();
  });

  it("ignores human typing where key intervals exceed threshold", async () => {
    const onScan = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    root.render(
      React.createElement(TestScannerComponent, {
        onScan,
        enabled: true,
        maxIntervalMs: 60,
      })
    );
    await new Promise((r) => setTimeout(r, 20));

    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "A", bubbles: true }));

    now += 300;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "B", bubbles: true }));

    now += 300;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onScan).not.toHaveBeenCalled();

    root.unmount();
    container.remove();
  });
});
