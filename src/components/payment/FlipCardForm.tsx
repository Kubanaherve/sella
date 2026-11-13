import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MastercardLogo,
  VisaLogo,
  detectCardBrand,
} from "@/components/payment/PaymentBrandLogos";

export type CardPayload = {
  number: string;
  name: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand: "visa" | "mastercard" | "unknown";
};

type Props = {
  value: CardPayload;
  onChange: (next: CardPayload) => void;
  disabled?: boolean;
};

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function emptyCard(): CardPayload {
  return {
    number: "",
    name: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    brand: "unknown",
  };
}

export default function FlipCardForm({ value, onChange, disabled }: Props) {
  const [flipped, setFlipped] = useState(false);
  const brand = useMemo(
    () => detectCardBrand(value.number),
    [value.number]
  );

  const displayNumber =
    formatCardNumber(value.number).padEnd(19, "•").replace(/ /g, "  ") ||
    "••••  ••••  ••••  ••••";
  const displayName = value.name.trim().toUpperCase() || "CARDHOLDER NAME";
  const displayExp =
    value.expiryMonth && value.expiryYear
      ? `${value.expiryMonth.padStart(2, "0")}/${value.expiryYear.slice(-2)}`
      : "MM/YY";

  const patch = (partial: Partial<CardPayload>) => {
    const next = { ...value, ...partial };
    next.brand = detectCardBrand(next.number);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* 3D flip card */}
      <div className="sella-pay-card-scene mx-auto w-full max-w-[340px]">
        <div
          className={`sella-pay-card-inner ${flipped ? "is-flipped" : ""}`}
        >
          {/* Front */}
          <div className="sella-pay-card-face sella-pay-card-front">
            <div className="flex items-start justify-between">
              <div className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200/90 to-amber-500/80 shadow-inner border border-white/30" />
              <div className="flex items-center gap-1.5">
                {brand === "visa" || brand === "unknown" ? (
                  <div className="rounded bg-white/90 px-1.5 py-0.5">
                    <VisaLogo className="h-4" />
                  </div>
                ) : null}
                {brand === "mastercard" || brand === "unknown" ? (
                  <div className="rounded bg-white/90 px-1 py-0.5">
                    <MastercardLogo className="h-5" />
                  </div>
                ) : null}
              </div>
            </div>
            <p className="mt-7 font-mono text-[17px] tracking-[0.18em] text-white drop-shadow">
              {formatCardNumber(value.number) || "•••• •••• •••• ••••"}
            </p>
            <div className="mt-5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wider text-white/60">
                  Card holder
                </p>
                <p className="truncate text-sm font-semibold tracking-wide text-white">
                  {displayName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] uppercase tracking-wider text-white/60">
                  Expires
                </p>
                <p className="text-sm font-semibold text-white">{displayExp}</p>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="sella-pay-card-face sella-pay-card-back">
            <div className="mt-5 h-10 w-full bg-black/80" />
            <div className="mt-4 flex items-center justify-end gap-2 px-4">
              <div className="h-8 flex-1 rounded bg-white/90 flex items-center justify-end px-3">
                <span className="font-mono text-sm tracking-[0.3em] text-slate-800">
                  {value.cvv ? value.cvv.replace(/./g, "•") : "•••"}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                CVC
              </span>
            </div>
            <p className="mt-4 px-4 text-[10px] leading-relaxed text-white/55">
              Security code is on the back of your card. Never share it outside
              this secure checkout.
            </p>
            <div className="mt-auto flex justify-end px-4 pb-1">
              {brand === "mastercard" ? (
                <MastercardLogo className="h-6 opacity-90" />
              ) : (
                <div className="rounded bg-white/90 px-1.5 py-0.5">
                  <VisaLogo className="h-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {flipped ? "Card back — enter CVC" : `Card front — ${displayNumber}`}
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="card-number">Card number</Label>
          <Input
            id="card-number"
            inputMode="numeric"
            autoComplete="cc-number"
            disabled={disabled}
            placeholder="ACCT-000003"
            className="input-glow font-mono tracking-wider"
            value={formatCardNumber(value.number)}
            onFocus={() => setFlipped(false)}
            onChange={(e) =>
              patch({ number: e.target.value.replace(/\D/g, "").slice(0, 16) })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="card-name">Name on card</Label>
          <Input
            id="card-name"
            autoComplete="cc-name"
            disabled={disabled}
            placeholder="As written on card"
            className="input-glow uppercase"
            value={value.name}
            onFocus={() => setFlipped(false)}
            onChange={(e) => patch({ name: e.target.value.slice(0, 40) })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="card-exp">Expiry</Label>
            <Input
              id="card-exp"
              inputMode="numeric"
              autoComplete="cc-exp"
              disabled={disabled}
              placeholder="MM/YY"
              className="input-glow font-mono"
              value={
                value.expiryMonth
                  ? formatExpiry(`${value.expiryMonth}${value.expiryYear.slice(-2)}`)
                  : ""
              }
              onFocus={() => setFlipped(false)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                const mm = digits.slice(0, 2);
                const yy = digits.slice(2, 4);
                patch({
                  expiryMonth: mm,
                  expiryYear: yy ? `20${yy}` : "",
                });
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-cvc">CVC / CVV</Label>
            <Input
              id="card-cvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              disabled={disabled}
              placeholder="123"
              className="input-glow font-mono tracking-[0.35em]"
              value={value.cvv}
              onFocus={() => setFlipped(true)}
              onBlur={() => setFlipped(false)}
              onChange={(e) =>
                patch({ cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
