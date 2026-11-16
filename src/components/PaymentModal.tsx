import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/kinyarwanda";
import { toRwf } from "@/lib/money";
import type { PaymentMethod } from "@/db/types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    amount: number,
    thankYouMessage: string,
    paymentMethod: PaymentMethod,
    referenceNumber: string | null
  ) => void | Promise<void>;
  customerName: string;
  totalAmount: number;
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "momo", label: "MTN MoMo" },
  { value: "cash", label: "Cash" },
  { value: "airtel", label: "Airtel Money" },
  { value: "bank", label: "Bank" },
];

const PaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  totalAmount,
}: PaymentModalProps) => {
  const [paymentAmount, setPaymentAmount] = useState<string>(totalAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [thankYouMessage, setThankYouMessage] = useState(
    `Thank you very much!! Mugire ibihe byiza.`
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount(totalAmount.toString());
      setReferenceNumber("");
      setError("");
      setSubmitting(false);
    }
  }, [isOpen, totalAmount]);

  const handleConfirm = async () => {
    if (submitting) return;
    const amount = toRwf(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Andika umubare w'amafaranga yemewe");
      return;
    }
    const due = toRwf(totalAmount);
    if (amount > due) {
      setError(`Amafaranga ntashobora kurenza ${formatCurrency(due)}`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(
        amount,
        thankYouMessage,
        paymentMethod,
        referenceNumber.trim() || null
      );
      setPaymentAmount(String(due));
    } catch {
      // Parent surfaces toast; keep modal open for retry
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setPaymentAmount(totalAmount.toString());
    setError("");
    onClose();
  };

  const remainingAfterPayment = toRwf(totalAmount) - toRwf(paymentAmount || 0);
  const showRef = paymentMethod === "momo" || paymentMethod === "airtel" || paymentMethod === "bank";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md z-[130] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Kwishyura kwa {customerName}</DialogTitle>
          <DialogDescription>
            Ideni ryose: <strong>{formatCurrency(totalAmount)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 space-y-4 py-4">
          <div className="space-y-2">
            <Label>Uburyo bwo kwishyura</Label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`text-xs font-bold rounded-xl px-3 py-2.5 transition-all border ${
                    paymentMethod === m.value
                      ? "sella-chip-glass-active border-transparent"
                      : "sella-chip-glass justify-center"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amafaranga yishyuye</Label>
            <Input
              id="amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => {
                setPaymentAmount(e.target.value);
                setError("");
              }}
              placeholder="Andika amafaranga"
              className="input-glow"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {showRef && (
            <div className="space-y-2">
              <Label htmlFor="ref">MoMo / Tx reference (optional)</Label>
              <Input
                id="ref"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TxId from MoMo SMS"
                className="input-glow"
              />
              <p className="text-[11px] text-muted-foreground">
                Bika numero y&apos;ubutumwa bwa MoMo kugira ngo wishyure neza.
              </p>
            </div>
          )}

          {remainingAfterPayment > 0 && toRwf(paymentAmount) > 0 && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-xl backdrop-blur-sm">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Amafaranga azasigara:{" "}
                <strong>{formatCurrency(remainingAfterPayment)}</strong>
              </p>
            </div>
          )}

          {remainingAfterPayment === 0 && toRwf(paymentAmount) > 0 && (
            <div className="p-3 bg-green-50 dark:bg-emerald-500/15 border border-green-200 dark:border-emerald-500/30 rounded-xl">
              <p className="text-sm text-green-800 dark:text-emerald-200">
                ✓ Ideni ryose rizishyurwa burundu!
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Ubutumwa bwo gushimira</Label>
            <Input
              id="message"
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              placeholder="Murakoze cyane..."
              className="input-glow"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Bireke
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? "…" : "Emeza"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
