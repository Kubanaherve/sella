import { Capacitor } from "@capacitor/core";

function nativeAppFlag(): boolean {
  if (
    typeof window !== "undefined" &&
    (window as unknown as { IS_NATIVE_APP?: boolean; isNativeApp?: boolean }).IS_NATIVE_APP
  ) {
    return true;
  }
  const flag = String(
    import.meta.env.VITE_IS_NATIVE_APP ||
    import.meta.env.IS_NATIVE_APP ||
    ""
  ).trim().toLowerCase();
  return flag === "true" || flag === "1";
}

function embeddedWebView(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIosWebview = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
  const isAndroidWebview = /Android.*Version\/[0-9.]+\s+(?:Mobile\s+)?Safari\//i.test(ua) || /wv/.test(ua);
  return isIosWebview || isAndroidWebview;
}

/**
 * Detect the mobile app environment using Capacitor.isNativePlatform()
 * with fallback IS_NATIVE_APP flags (env or window globals) and WebView UA detection.
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform() || nativeAppFlag() || embeddedWebView();
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
