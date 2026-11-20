import { Capacitor } from "@capacitor/core";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Electron preload exposes `window.sellaDesktop`. The browser site does not. */
export function isDesktopApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as Window & { sellaDesktop?: { product?: string } }).sellaDesktop
  );
}

/** Hide PWA install / web-only tooling on store builds. */
export function showWebOnlyTools(): boolean {
  return !Capacitor.isNativePlatform();
}
