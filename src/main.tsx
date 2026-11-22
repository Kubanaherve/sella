import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";
import { initSafeAreaChrome } from "./lib/safeArea";
import { bootstrapAppearance } from "./contexts/ThemeContext";
import { applyDocumentLanguage, getAppLanguage } from "./lib/appLanguage";

// Synchronously apply language and direction attributes (e.g. dir="rtl" for Arabic)
applyDocumentLanguage(getAppLanguage());

// Automatically pass Accept-Language: {lang} on all API and fetch requests
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const lang = getAppLanguage();
    const headers = new Headers(init?.headers);
    if (!headers.has("Accept-Language")) {
      headers.set("Accept-Language", lang);
    }
    return originalFetch.call(this, input, { ...init, headers });
  };
}

// Manual theme only — apply stored light/dark before paint (never phone system).
bootstrapAppearance();

// Apply before first paint so headers never sit under the notch.
initSafeAreaChrome();

async function initNativeChrome() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Content draws edge-to-edge; CSS + safeArea.ts position headers/tab bar.
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0B3FCC" });
    initSafeAreaChrome();
  } catch {
    /* plugin optional in web */
  }
  // Stage 1 → 2: keep native splash until React splash paints, then crossfade
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    window.setTimeout(() => {
      void SplashScreen.hide({ fadeOutDuration: 280 });
    }, 160);
  } catch {
    /* ignore */
  }
}

void initNativeChrome();

createRoot(document.getElementById("root")!).render(<App />);
