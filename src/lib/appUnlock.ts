import { BRAND } from "@/lib/brand";

/** In-memory + session unlock so a cold start / app resume always asks for PIN. */
const UNLOCK_KEY = `${BRAND.storagePrefix}app_unlocked`;

export function isAppUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAppUnlocked(unlocked: boolean) {
  try {
    if (unlocked) sessionStorage.setItem(UNLOCK_KEY, "1");
    else sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* private mode */
  }
}

export function clearAppUnlock() {
  setAppUnlocked(false);
}
