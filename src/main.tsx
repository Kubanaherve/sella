import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";
import { initSafeAreaChrome } from "./lib/safeArea";

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
  // Keep native splash until React SellaSplash mounts, then hide quickly
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    window.setTimeout(() => {
      void SplashScreen.hide({ fadeOutDuration: 420 });
    }, 220);
  } catch {
    /* ignore */
  }
}

void initNativeChrome();

createRoot(document.getElementById("root")!).render(<App />);
