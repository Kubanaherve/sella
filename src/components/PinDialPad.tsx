import { useEffect, useState } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticError, hapticLight } from "@/lib/haptics";

interface PinDialPadProps {
  onComplete: (pin: string) => void;
  isLoading?: boolean;
  displayName?: string;
  pinLength?: number;
  /** Bump to clear digits after a failed attempt. */
  resetToken?: number;
  errorMessage?: string | null;
}

export function PinDialPad({
  onComplete,
  isLoading,
  displayName,
  pinLength = 4,
  resetToken = 0,
  errorMessage,
}: PinDialPadProps) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const maxLength = Math.min(8, Math.max(4, pinLength));

  useEffect(() => {
    setPin("");
    if (resetToken > 0) {
      void hapticError();
      setShake(true);
      const t = setTimeout(() => setShake(false), 450);
      return () => clearTimeout(t);
    }
  }, [resetToken]);

  const handlePress = (digit: string) => {
    if (isLoading || pin.length >= maxLength) return;
    void hapticLight();
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === maxLength) {
      setTimeout(() => onComplete(newPin), 120);
    }
  };

  const handleDelete = () => {
    if (isLoading) return;
    setPin((p) => p.slice(0, -1));
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="flex flex-col items-center w-full">
      {displayName && (
        <p className="text-white/85 text-base font-medium mb-1 tracking-tight">
          Muraho, {displayName}
        </p>
      )}
      <p className="text-white/50 text-xs mb-6">Injiza PIN yawe · {maxLength} digits</p>

      <div className={cn("flex gap-3.5 mb-3", shake && "animate-[shake_0.4s_ease-in-out]")}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3.5 h-3.5 rounded-full transition-all duration-200",
              i < pin.length
                ? "bg-white scale-125 shadow-md shadow-white/30"
                : "bg-white/25"
            )}
          />
        ))}
      </div>

      <div className="h-5 mb-4">
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        ) : errorMessage ? (
          <p className="text-rose-200 text-xs text-center">{errorMessage}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-x-5 gap-y-4 w-full max-w-[280px]">
        {digits.map((digit, index) => {
          if (digit === "") {
            return <div key={index} className="w-[72px] h-[72px] mx-auto" />;
          }

          if (digit === "del") {
            return (
              <button
                key={index}
                type="button"
                aria-label="Delete"
                onClick={handleDelete}
                disabled={isLoading || pin.length === 0}
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white/75 hover:bg-white/10 active:bg-white/20 transition-all disabled:opacity-25 mx-auto"
              >
                <Delete size={26} />
              </button>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handlePress(digit)}
              disabled={isLoading}
              className="w-[72px] h-[72px] rounded-full bg-white/12 backdrop-blur-md flex items-center justify-center text-[28px] font-semibold text-white hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all disabled:opacity-50 mx-auto shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            >
              {digit}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
