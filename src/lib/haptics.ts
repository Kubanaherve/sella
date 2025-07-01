import { Capacitor } from "@capacitor/core";

/** Light tap — dial pad, tabs, toggles. */
export async function hapticLight() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* web / unavailable */
  }
}

/** Success — payment saved, debt created, PIN unlocked. */
export async function hapticSuccess() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* ignore */
  }
}

/** Error / wrong PIN. */
export async function hapticError() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    /* ignore */
  }
}
