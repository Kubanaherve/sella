import { useEffect, useState, useCallback } from "react";
import {
  clearCashierMode,
  isCashierModeActive,
  setCashierModeActive,
} from "@/lib/cashierMode";
import { verifyOwnerPin } from "@/lib/ownerGate";

/**
 * Hook for staff role segregation.
 * In Cashier Mode ("Umucuruzi"), wholesale cost prices, overall store profits,
 * and dangerous delete buttons are hidden from counter employees.
 * Leaving cashier mode requires the owner PIN.
 */
export function useCashierMode() {
  const [isCashier, setIsCashier] = useState(isCashierModeActive);

  useEffect(() => {
    const handleChanged = (e: Event) => {
      const custom = e as CustomEvent<{ active: boolean }>;
      setIsCashier(custom.detail?.active ?? isCashierModeActive());
    };
    window.addEventListener("sella:cashier_mode_changed", handleChanged);
    return () => {
      window.removeEventListener("sella:cashier_mode_changed", handleChanged);
    };
  }, []);

  const enterCashierMode = useCallback(() => {
    setCashierModeActive(true);
    setIsCashier(true);
  }, []);

  const exitCashierMode = useCallback(async (pin: string) => {
    const ok = await verifyOwnerPin(pin);
    if (!ok) return false;
    clearCashierMode();
    setIsCashier(false);
    return true;
  }, []);

  return {
    isCashierMode: isCashier,
    enterCashierMode,
    exitCashierMode,
  };
}
