import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sella.app",
  appName: "Sella",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  ios: {
    // Let CSS env(safe-area-*) + our floor own insets (avoid double native padding).
    contentInset: "never",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: "#040816",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0B3FCC",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "body",
    },
  },
};

export default config;
