import { useEffect, useState, useCallback } from "react";
import { isCashierModeActive, setCashierModeActive } from "@/lib/cashierMode";

/**
 * Hook for staff role segregation.
 * In Cashier Mode ("Umucuruzi"), wholesale cost prices, overall store profits,
 * and dangerous delete buttons are hidden from counter employees.
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

  const exitCashierMode = useCallback(() => {
    setCashierModeActive(false);
    setIsCashier(false);
  }, []);

  return {
    isCashierMode: isCashier,
    enterCashierMode,
    exitCashierMode,
  };
}
