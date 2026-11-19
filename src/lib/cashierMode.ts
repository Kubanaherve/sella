import { BRAND } from "@/lib/brand";

const CASHIER_MODE_KEY = `${BRAND.storagePrefix}cashier_mode_active`;

/** Returns true if cashier restricted view is enabled (hiding cost prices and net margins from staff). */
export function isCashierModeActive(): boolean {
  try {
    return localStorage.getItem(CASHIER_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setCashierModeActive(active: boolean) {
  try {
    if (active) {
      localStorage.setItem(CASHIER_MODE_KEY, "1");
    } else {
      localStorage.removeItem(CASHIER_MODE_KEY);
    }
    window.dispatchEvent(
      new CustomEvent("sella:cashier_mode_changed", { detail: { active } })
    );
  } catch {
    /* private browsing fallback */
  }
}
