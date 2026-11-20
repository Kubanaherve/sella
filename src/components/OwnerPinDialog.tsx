import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  title: string;
  onCancel: () => void;
  onSubmit: (pin: string) => void;
};

export function OwnerPinDialog({ open, title, onCancel, onSubmit }: Props) {
  const [pin, setPin] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPin("");
          onCancel();
        }
      }}
    >
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">PIN y'umuyobozi</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <Input
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          type="password"
          value={pin}
          placeholder="••••"
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPin("");
              onCancel();
            }}
          >
            Reka
          </Button>
          <Button
            type="button"
            disabled={!/^\d{4}$/.test(pin)}
            onClick={() => {
              const next = pin;
              setPin("");
              onSubmit(next);
            }}
          >
            Emeza
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
