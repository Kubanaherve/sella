import { Capacitor } from "@capacitor/core";

function nativeAppFlag(): boolean {
  const flag = String(import.meta.env.VITE_IS_NATIVE_APP || "").trim().toLowerCase();
  return flag === "true" || flag === "1";
}

function embeddedWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Capacitor|Cordova|SellaNativeApp|; wv\)/.test(ua);
}

/** True inside Capacitor, Cordova, a wrapped WebView, or an explicit store build. */
export function isNativeApp(): boolean {
  return nativeAppFlag() || Capacitor.isNativePlatform() || embeddedWebView();
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
  return !isNativeApp();
}
