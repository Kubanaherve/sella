import { useState } from "react";
import { Lock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { changePin, verifyProfilePin } from "@/db/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/integrations/supabase/client";

const PIN_LEN = 4;

export function ChangePinCard() {
  const { profile, mode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"current" | "new" | "confirm">("current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setStep("current");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const verifyCurrentPin = async () => {
    if (currentPin.length !== PIN_LEN) {
      toast.error("PIN igomba kuba imibare 4");
      return;
    }
    if (mode === "local") {
      if (!profile?.id) {
        toast.error("Ntibishoboka kubona konti yawe");
        return;
      }
      setIsLoading(true);
      try {
        const ok = await verifyProfilePin(profile.id, currentPin);
        if (!ok) {
          toast.error("PIN yubwa sibyo");
          return;
        }
        setStep("new");
      } catch {
        toast.error("Habaye ikosa");
      } finally {
        setIsLoading(false);
      }
      return;
    }
    // Cloud: old PIN checked on final submit via edge function
    setStep("new");
  };

  const handleNewPin = () => {
    if (newPin.length !== PIN_LEN) {
      toast.error("PIN nshya igomba kuba imibare 4");
      return;
    }
    setStep("confirm");
  };

  const handleChangePin = async () => {
    if (confirmPin !== newPin) {
      toast.error("PIN nshya ntizihura");
      return;
    }
    setIsLoading(true);
    try {
      if (mode === "cloud") {
        const sb = getSupabase();
        const { data, error } = await sb.functions.invoke("update-pin", {
          body: { old_pin: currentPin, new_pin: newPin },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      } else {
        if (!profile?.id) throw new Error("Ntibishoboka kubona konti yawe");
        await changePin(profile.id, currentPin, newPin);
      }
      toast.success("PIN yahinduwe neza");
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Habaye ikosa");
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full glass-card p-4 flex items-center gap-4 hover:bg-accent/50 transition-all active:scale-[0.98] text-left"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Hindura PIN</p>
          <p className="text-sm text-muted-foreground">Guhindura PIN ya imibare 4</p>
        </div>
      </button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Hindura PIN
            </DialogTitle>
            <DialogDescription>
              {step === "current" && "Injiza PIN yawe y'ubu (imibare 4)"}
              {step === "new" && "Injiza PIN nshya (imibare 4)"}
              {step === "confirm" && "Ongera wandike PIN nshya"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {step === "current" && (
              <>
                <Input
                  type="password"
                  value={currentPin}
                  onChange={(e) =>
                    setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LEN))
                  }
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest"
                  maxLength={PIN_LEN}
                  inputMode="numeric"
                  autoFocus
                />
                <Button
                  onClick={verifyCurrentPin}
                  disabled={isLoading || currentPin.length !== PIN_LEN}
                  className="w-full"
                >
                  {isLoading ? "..." : "Komeza"}
                </Button>
              </>
            )}

            {step === "new" && (
              <>
                <Input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LEN))}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest"
                  maxLength={PIN_LEN}
                  inputMode="numeric"
                  autoFocus
                />
                <Button onClick={handleNewPin} disabled={newPin.length !== PIN_LEN} className="w-full">
                  Komeza
                </Button>
              </>
            )}

            {step === "confirm" && (
              <>
                <Input
                  type="password"
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LEN))
                  }
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest"
                  maxLength={PIN_LEN}
                  inputMode="numeric"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("new")} className="flex-1">
                    <X className="w-4 h-4 mr-1" />
                    Inyuma
                  </Button>
                  <Button
                    onClick={handleChangePin}
                    disabled={isLoading || confirmPin.length !== PIN_LEN}
                    className="flex-1"
                  >
                    {isLoading ? (
                      "..."
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Emeza
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
