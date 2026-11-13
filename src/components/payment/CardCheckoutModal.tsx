import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AmexLogo,
  MastercardLogo,
  VisaLogo,
  detectCardBrand,
  type CardBrand,
} from "@/components/payment/PaymentBrandLogos";

export type CardPayload = {
  number: string;
  name: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand: CardBrand;
};

export function emptyCard(): CardPayload {
  return {
    number: "",
    name: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    brand: "visa",
  };
}

type Props = {
  open: boolean;
  initial?: CardPayload | null;
  onClose: () => void;
  onConfirm: (card: CardPayload) => void;
};

function formatCardNumber(raw: string, brand: CardBrand): string {
  const digits = raw.replace(/\D/g, "").slice(0, brand === "amex" ? 15 : 16);
  if (brand === "amex") {
    // 4-6-5
    const a = digits.slice(0, 4);
    const b = digits.slice(4, 10);
    const c = digits.slice(10, 15);
    return [a, b, c].filter(Boolean).join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const BRANDS: { id: CardBrand; label: string }[] = [
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "amex", label: "Amex" },
];

export default function CardCheckoutModal({
  open,
  initial,
  onClose,
  onConfirm,
}: Props) {
  const [card, setCard] = useState<CardPayload>(initial || emptyCard());
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setCard(initial || emptyCard());
      setFlipped(false);
      setError("");
    }
  }, [open, initial]);

  const brand = useMemo(() => {
    const detected = detectCardBrand(card.number);
    return detected === "unknown" ? card.brand : detected;
  }, [card.number, card.brand]);

  const faceClass =
    brand === "mastercard"
      ? "sella-pay-card-front is-mastercard"
      : brand === "amex"
        ? "sella-pay-card-front is-amex"
        : "sella-pay-card-front is-visa";

  const patch = (partial: Partial<CardPayload>) => {
    const next = { ...card, ...partial };
    const detected = detectCardBrand(next.number);
    if (detected !== "unknown") next.brand = detected;
    setCard(next);
  };

  const confirm = () => {
    const digits = card.number.replace(/\D/g, "");
    const needLen = brand === "amex" ? 15 : 16;
    if (digits.length < Math.min(13, needLen)) {
      setError("Enter a valid card number");
      return;
    }
    if (!card.name.trim()) {
      setError("Enter the name on the card");
      return;
    }
    if (!card.expiryMonth || !card.expiryYear) {
      setError("Enter expiry MM/YY");
      return;
    }
    const cvvNeed = brand === "amex" ? 4 : 3;
    if (card.cvv.length < cvvNeed) {
      setError(`Enter ${cvvNeed}-digit CVC`);
      setFlipped(true);
      return;
    }
    onConfirm({ ...card, brand });
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[160] sella-overlay flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="sella-popup-glass relative z-10 w-full max-w-[400px] rounded-[28px] p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Card details</h2>
            <p className="text-xs text-muted-foreground">
              Pick a network — the card updates live
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Brand switcher */}
        <div className="relative z-10 grid grid-cols-3 gap-2">
          {BRANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                patch({ brand: b.id });
                setFlipped(false);
              }}
              className={`rounded-2xl border px-2 py-2.5 flex flex-col items-center gap-1 transition-all ${
                brand === b.id
                  ? "border-transparent ring-2 ring-primary/60 bg-white/80 shadow-md"
                  : "border-white/50 bg-white/40"
              }`}
            >
              {b.id === "visa" && <VisaLogo className="h-5" />}
              {b.id === "mastercard" && <MastercardLogo className="h-7" />}
              {b.id === "amex" && <AmexLogo className="h-5" />}
              <span className="text-[10px] font-semibold">{b.label}</span>
            </button>
          ))}
        </div>

        {/* 3D card only */}
        <div className="sella-pay-card-scene mx-auto w-full max-w-[340px] relative z-10">
          <div className={`sella-pay-card-inner ${flipped ? "is-flipped" : ""}`}>
            <div className={`sella-pay-card-face ${faceClass}`}>
              <div className="flex items-start justify-between">
                <div className="h-10 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner border border-white/40" />
                <div className="rounded-md bg-white/95 px-2 py-1 shadow-sm">
                  {brand === "mastercard" ? (
                    <MastercardLogo className="h-6" />
                  ) : brand === "amex" ? (
                    <AmexLogo className="h-4" />
                  ) : (
                    <VisaLogo className="h-4" />
                  )}
                </div>
              </div>
              <p className="mt-8 font-mono text-[18px] tracking-[0.16em] text-white drop-shadow-md">
                {formatCardNumber(card.number, brand) ||
                  (brand === "amex"
                    ? "•••• •••••• •••••"
                    : "•••• •••• •••• ••••")}
              </p>
              <div className="mt-6 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-wider text-white/65">
                    Card holder
                  </p>
                  <p className="truncate text-sm font-semibold tracking-wide text-white">
                    {card.name.trim().toUpperCase() || "YOUR NAME"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] uppercase tracking-wider text-white/65">
                    Valid thru
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {card.expiryMonth && card.expiryYear
                      ? `${card.expiryMonth.padStart(2, "0")}/${card.expiryYear.slice(-2)}`
                      : "MM/YY"}
                  </p>
                </div>
              </div>
            </div>

            <div className="sella-pay-card-face sella-pay-card-back">
              <div className="mt-5 h-11 w-full bg-black/85" />
              <div className="mt-4 flex items-center gap-2 px-4">
                <div className="h-9 flex-1 rounded bg-white/95 flex items-center justify-end px-3">
                  <span className="font-mono text-base tracking-[0.35em] text-slate-800">
                    {card.cvv || (brand === "amex" ? "••••" : "•••")}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase text-white/80">
                  CVC
                </span>
              </div>
              <p className="mt-4 px-4 text-[10px] leading-relaxed text-white/55">
                Security code is on the back
                {brand === "amex" ? " (or front for Amex)" : ""}. Encrypted to
                Flutterwave — never stored on Sella.
              </p>
              <div className="mt-auto flex justify-end px-4 pb-1">
                {brand === "mastercard" ? (
                  <MastercardLogo className="h-6" />
                ) : brand === "amex" ? (
                  <AmexLogo className="h-5" />
                ) : (
                  <div className="rounded bg-white/90 px-1.5 py-0.5">
                    <VisaLogo className="h-3.5" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compact fields under card (still inside popup only) */}
        <div className="relative z-10 space-y-2.5">
          <Input
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="Card number"
            className="input-glow font-mono tracking-wider h-11"
            value={formatCardNumber(card.number, brand)}
            onFocus={() => setFlipped(false)}
            onChange={(e) => {
              const max = brand === "amex" ? 15 : 16;
              patch({
                number: e.target.value.replace(/\D/g, "").slice(0, max),
              });
            }}
          />
          <Input
            autoComplete="cc-name"
            placeholder="Name on card"
            className="input-glow uppercase h-11"
            value={card.name}
            onFocus={() => setFlipped(false)}
            onChange={(e) => patch({ name: e.target.value.slice(0, 40) })}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              className="input-glow font-mono h-11"
              value={
                card.expiryMonth
                  ? formatExpiry(
                      `${card.expiryMonth}${card.expiryYear.slice(-2)}`
                    )
                  : ""
              }
              onFocus={() => setFlipped(false)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                patch({
                  expiryMonth: digits.slice(0, 2),
                  expiryYear: digits.slice(2, 4)
                    ? `20${digits.slice(2, 4)}`
                    : "",
                });
              }}
            />
            <Input
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={brand === "amex" ? "CVC (4)" : "CVC"}
              className="input-glow font-mono tracking-[0.3em] h-11"
              value={card.cvv}
              onFocus={() => setFlipped(true)}
              onBlur={() => setFlipped(false)}
              onChange={(e) =>
                patch({
                  cvv: e.target.value
                    .replace(/\D/g, "")
                    .slice(0, brand === "amex" ? 4 : 4),
                })
              }
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button
          type="button"
          className="relative z-10 w-full sella-btn-confirm h-12"
          onClick={confirm}
        >
          <Check size={18} /> Confirm card
        </Button>
      </div>
    </div>,
    document.body
  );
}
