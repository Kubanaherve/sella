import { useRef, useState } from "react";
import { OwnerPinDialog } from "@/components/OwnerPinDialog";

export function useOwnerPin() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Andika PIN y'umuyobozi");
  const resolver = useRef<((pin: string | null) => void) | null>(null);

  const askOwnerPin = (prompt?: string) =>
    new Promise<string | null>((resolve) => {
      resolver.current = resolve;
      if (prompt) setTitle(prompt);
      setOpen(true);
    });

  const finish = (pin: string | null) => {
    setOpen(false);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(pin);
  };

  const ownerPinDialog = (
    <OwnerPinDialog
      open={open}
      title={title}
      onCancel={() => finish(null)}
      onSubmit={(pin) => finish(pin)}
    />
  );

  return { askOwnerPin, ownerPinDialog };
}
