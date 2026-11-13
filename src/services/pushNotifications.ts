/**
 * Push notification scaffolding (Capacitor + FCM).
 * Registers device tokens into `devices` when the Push plugin is available.
 * Does not fail the app if the plugin is not installed yet.
 */
import { Capacitor } from "@capacitor/core";
import { getSupabase } from "@/integrations/supabase/client";

export async function registerPushDevice(): Promise<{ ok: boolean; reason?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: "web — use browser Notification API later" };
  }

  try {
    // @vite-ignore — optional native plugin; keep production build working if omitted
    const mod = await import(
      /* @vite-ignore */ "@capacitor/push-notifications"
    ).catch(() => null);
    if (!mod?.PushNotifications) {
      return {
        ok: false,
        reason: "Install @capacitor/push-notifications@^8 and add FCM/APNs config",
      };
    }

    const { PushNotifications } = mod;
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") {
      return { ok: false, reason: "permission denied" };
    }

    await PushNotifications.register();

    return await new Promise((resolve) => {
      const handle = PushNotifications.addListener("registration", async (token) => {
        try {
          await handle.remove();
          const sb = getSupabase();
          const { data: userData } = await sb.auth.getUser();
          if (!userData.user) {
            resolve({ ok: false, reason: "not signed in" });
            return;
          }
          const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
          await sb.from("devices").upsert(
            {
              user_id: userData.user.id,
              platform,
              push_token: token.value,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "user_id,push_token" }
          );
          resolve({ ok: true });
        } catch (e) {
          resolve({
            ok: false,
            reason: e instanceof Error ? e.message : "register failed",
          });
        }
      });

      PushNotifications.addListener("registrationError", (err) => {
        resolve({ ok: false, reason: String(err?.error || "registrationError") });
      });

      setTimeout(() => resolve({ ok: false, reason: "timeout waiting for token" }), 15000);
    });
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "push unavailable" };
  }
}
