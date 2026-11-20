import { getSessionProfile, verifyProfilePin } from "@/db/localApi";
import { getSupabase, hasSupabaseConfig, isCloudMode } from "@/integrations/supabase/client";

const PIN_ERROR = "PIN y'umuyobozi sibyo";

/**
 * Confirm the shop owner before leaving Cashier Mode or deleting records.
 * Local shops check the Dexie PIN. Cloud shops check the same PIN used at login.
 */
export async function verifyOwnerPin(pin: string): Promise<boolean> {
  const code = pin.trim();
  if (!/^\d{4}$/.test(code)) return false;

  const localProfile = await getSessionProfile();
  if (localProfile?.pin_hash) {
    return verifyProfilePin(localProfile.id, code);
  }

  if (!isCloudMode() || !hasSupabaseConfig()) return false;
  const sb = getSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError || !userData.user) return false;
  const { data: profile, error } = await sb
    .from("profiles")
    .select("phone_normalized, phone")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error || !profile) return false;
  const phone = String(profile.phone_normalized || profile.phone || "");
  if (!phone) return false;
  const { data, error: pinError } = await sb.functions.invoke("pin-login", {
    body: { phone, pin: code },
  });
  if (pinError || !data?.success) return false;
  return true;
}

export async function requireOwnerPin(pin: string): Promise<void> {
  if (!(await verifyOwnerPin(pin))) {
    throw new Error(PIN_ERROR);
  }
}
