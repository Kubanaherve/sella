import { Capacitor } from "@capacitor/core";
import { getSupabase } from "@/integrations/supabase/client";
import { getAnnualPriceRwf, getMonthlyPriceRwf } from "@/lib/entitlements";

export type BillingPlan = "monthly" | "annual";
export type BillingChannel = "paypack_mtn" | "paypack_airtel" | "momo_manual" | "bank_transfer" | "apple_iap";

export function getNativePlatform(): "ios" | "android" | "web" {
  const p = Capacitor.getPlatform();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  return "web";
}

/** Route billing by platform: iOS → StoreKit path; Web/Android → MoMo/Bank. */
export function preferredBillingChannels(): BillingChannel[] {
  if (getNativePlatform() === "ios") {
    return ["apple_iap", "paypack_mtn", "momo_manual", "bank_transfer"];
  }
  return ["paypack_mtn", "paypack_airtel", "momo_manual", "bank_transfer"];
}

export function planAmount(plan: BillingPlan): number {
  return plan === "annual" ? getAnnualPriceRwf() : getMonthlyPriceRwf();
}

export async function startPaypackCashin(input: {
  phone: string;
  plan: BillingPlan;
  network?: "mtn" | "airtel";
}) {
  const sb = getSupabase();
  const { data, error } = await sb.functions.invoke("paypack-cashin", {
    body: {
      phone: input.phone,
      plan_tier: input.plan,
      network: input.network || "mtn",
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function submitManualPayment(input: {
  plan: BillingPlan;
  method: "momo_manual" | "bank_transfer";
  referenceId: string;
  proofFile?: File | null;
}) {
  const sb = getSupabase();
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");

  let proofUrl: string | null = null;
  if (input.proofFile) {
    const path = `${userData.user.id}/${Date.now()}_${input.proofFile.name.replace(/\s+/g, "_")}`;
    const { error: upErr } = await sb.storage.from("receipts").upload(path, input.proofFile, {
      upsert: false,
      contentType: input.proofFile.type || "image/jpeg",
    });
    if (upErr) throw upErr;
    const { data: signed } = await sb.storage.from("receipts").createSignedUrl(path, 60 * 60 * 24 * 30);
    proofUrl = signed?.signedUrl || path;
  }

  const { data, error } = await sb
    .from("subscription_payments")
    .insert({
      user_id: userData.user.id,
      amount: planAmount(input.plan),
      currency: "RWF",
      plan_tier: input.plan,
      payment_method: input.method,
      reference_id: input.referenceId.trim(),
      proof_image_url: proofUrl,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function startAppleIap(_plan: BillingPlan) {
  // Capacitor StoreKit / RevenueCat hook — wired when native IAP plugin is configured.
  // Multiplatform SaaS: readers may still pay via web MoMo for B2B access (Guideline 3.1.3(b)).
  throw new Error(
    "Apple In-App Purchase is configured for TestFlight builds. Use Manage Subscription on iOS, or pay via MoMo on the website."
  );
}

export async function deleteAccountRemote() {
  const sb = getSupabase();
  const { data, error } = await sb.functions.invoke("delete-account", { body: {} });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
