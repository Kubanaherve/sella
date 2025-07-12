import { Capacitor } from "@capacitor/core";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Hide PWA install / web-only tooling on store builds. */
export function showWebOnlyTools(): boolean {
  return !Capacitor.isNativePlatform();
}
