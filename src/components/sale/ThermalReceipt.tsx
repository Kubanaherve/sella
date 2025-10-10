import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  type ReceiptData,
  shopAccentFromName,
  shopInitials,
} from "@/lib/receipt";
import { formatCurrency } from "@/lib/kinyarwanda";
import { toRwf } from "@/lib/money";

type Props = {
  data: ReceiptData;
  play: boolean;
  onDone?: () => void;
  className?: string;
};

/**
 * Lightweight thermal printer micro-interaction.
 * Respects prefers-reduced-motion via CSS; caller can set play=false to skip.
 */
export function ThermalReceipt({ data, play, onDone, className }: Props) {
  const [phase, setPhase] = useState<"idle" | "print" | "done">(
    play ? "idle" : "done"
  );
  const accent = shopAccentFromName(data.shopName);
  const initials = shopInitials(data.shopName);

  useEffect(() => {
    if (!play) {
      setPhase("done");
      onDone?.();
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("done");
      onDone?.();
      return;
    }
    setPhase("idle");
    const t1 = window.setTimeout(() => setPhase("print"), 180);
    const t2 = window.setTimeout(() => {
      setPhase("done");
      onDone?.();
    }, 1600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [play, data.receiptNumber, onDone]);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="w-44 rounded-xl bg-slate-800 px-3 pt-3 pb-1 shadow-lg">
        <div className="h-2 rounded-full bg-slate-600 mb-2" />
        <div className="h-1.5 rounded bg-slate-700 mb-1" />
        <div
          className={cn(
            "mx-auto overflow-hidden bg-white transition-[max-height] duration-1000 ease-out",
            phase === "idle" ? "max-h-0" : "max-h-[420px]"
          )}
          style={{ width: "92%" }}
        >
          <div className="px-2.5 py-3 text-[10px] text-slate-900 font-mono leading-snug">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: accent }}
                aria-hidden
              >
                {initials}
              </div>
              <div>
                <p className="font-bold text-[11px] leading-tight">{data.shopName}</p>
                <p className="text-[9px] text-slate-500">{data.receiptNumber}</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 mb-2">
              {new Date(data.createdAt).toLocaleString()}
            </p>
            <p className="mb-1">Customer: {data.customerName}</p>
            <div className="border-t border-dashed border-slate-300 my-1.5" />
            {data.lines.map((l, i) => (
              <div key={i} className="flex justify-between gap-1">
                <span className="truncate">
                  {l.quantity}× {l.name}
                </span>
                <span>{formatCurrency(toRwf(l.unitPrice) * l.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-slate-300 my-1.5" />
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(data.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid</span>
              <span>{formatCurrency(data.paid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Balance</span>
              <span>{formatCurrency(data.remaining)}</span>
            </div>
            {phase === "done" && (
              <p className="mt-2 text-center text-[9px] text-slate-500">
                {data.thankYouMessage || "Murakoze!"}
              </p>
            )}
          </div>
        </div>
        <div className="h-2 mt-1 rounded-b-lg bg-slate-900" />
      </div>
      {phase !== "done" && (
        <p className="text-[11px] text-muted-foreground animate-pulse">Printing…</p>
      )}
    </div>
  );
}
