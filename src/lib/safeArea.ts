import { Capacitor } from "@capacitor/core";

/**
 * Capacitor WKWebView / Android WebView sometimes report
 * env(safe-area-inset-top) as 0 even while drawing under the status bar.
 * We measure when possible and always set a native floor so headers clear
 * notches, Dynamic Island, and battery icons on every phone.
 */

function measureCssSafeTop(): number {
  if (typeof document === "undefined") return 0;
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-top:constant(safe-area-inset-top);";
  document.documentElement.appendChild(el);
  const value = parseFloat(getComputedStyle(el).paddingTop) || 0;
  el.remove();
  return value;
}

/** Logical-pixel floor for iOS when CSS env() is missing. */
function iosSafeTopFloor(): number {
  const short = Math.min(window.screen.width, window.screen.height);
  const long = Math.max(window.screen.width, window.screen.height);
  // Pre-notch (SE / 8): status bar only
  if (long < 812) return 20;
  // Dynamic Island class (14 Pro / 15 / 16 …)
  if (short >= 390 && long >= 844) return 59;
  // Classic notch
  return 47;
}

function androidSafeTopFloor(): number {
  return 28;
}

export function applySafeAreaChrome(): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const measured = measureCssSafeTop();
  let floor = measured;

  if (Capacitor.isNativePlatform()) {
    root.classList.add("sella-native-chrome");
    const platform = Capacitor.getPlatform();
    if (platform === "ios") {
      root.classList.add("sella-ios-chrome");
      floor = Math.max(measured, iosSafeTopFloor());
    } else if (platform === "android") {
      root.classList.add("sella-android-chrome");
      floor = Math.max(measured, androidSafeTopFloor());
    }
  } else if (measured > 0) {
    // Installed PWA / iOS Safari standalone may still need insets
    floor = measured;
  }

  root.style.setProperty("--sella-safe-top-floor", `${floor}px`);
  if (Capacitor.getPlatform() === "ios" || Capacitor.getPlatform() === "android") {
    root.style.setProperty("--sella-safe-bottom-floor", platformBottomFloor());
  }
}

function platformBottomFloor(): string {
  return Capacitor.getPlatform() === "ios" ? "20px" : "12px";
}

export function initSafeAreaChrome(): void {
  applySafeAreaChrome();
  window.addEventListener("resize", applySafeAreaChrome);
  window.addEventListener("orientationchange", () => {
    window.setTimeout(applySafeAreaChrome, 50);
  });
  // Re-measure after first paint / Capacitor bridge ready
  window.setTimeout(applySafeAreaChrome, 0);
  window.setTimeout(applySafeAreaChrome, 300);
}
