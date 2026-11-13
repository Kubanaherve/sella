import { Capacitor } from "@capacitor/core";
import { getSupabase } from "@/integrations/supabase/client";
import { getAnnualPriceRwf, getMonthlyPriceRwf } from "@/lib/entitlements";

export type BillingPlan = "monthly" | "annual";
export type BillingChannel =
  | "paypack_mtn"
  | "paypack_airtel"
  | "card_visa_mc"
  | "momo_manual"
  | "airtel_manual"
  | "bank_transfer"
  | "apple_iap";

export function getNativePlatform(): "ios" | "android" | "web" {
  const p = Capacitor.getPlatform();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  return "web";
}

/** Route billing by platform: iOS → StoreKit path; Web/Android → MoMo/Card/Bank. */
export function preferredBillingChannels(): BillingChannel[] {
  if (getNativePlatform() === "ios") {
    return [
      "apple_iap",
      "paypack_mtn",
      "paypack_airtel",
      "card_visa_mc",
      "momo_manual",
      "airtel_manual",
      "bank_transfer",
    ];
  }
  return [
    "paypack_mtn",
    "paypack_airtel",
    "card_visa_mc",
    "momo_manual",
    "airtel_manual",
    "bank_transfer",
  ];
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

export async function startCardCharge(input: {
  plan: BillingPlan;
  card_number: string;
  cvv: string;
  expiry_month: string;
  expiry_year: string;
  fullname: string;
  email?: string;
  phone?: string;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.functions.invoke("flutterwave-card-charge", {
    body: {
      plan_tier: input.plan,
      card_number: input.card_number,
      cvv: input.cvv,
      expiry_month: input.expiry_month,
      expiry_year: input.expiry_year,
      fullname: input.fullname,
      email: input.email,
      phone: input.phone,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as {
    success?: boolean;
    status: string;
    payment_id?: string;
    reference?: string;
    flw_ref?: string;
    redirect_url?: string;
    message?: string;
    current_period_end?: string;
  };
}

export async function validateCardAuth(input: {
  reference: string;
  mode: "otp" | "pin";
  otp?: string;
  pin?: string;
  flw_ref?: string;
  email?: string;
  fullname?: string;
  card?: {
    card_number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
  };
}) {
  const sb = getSupabase();
  const { data, error } = await sb.functions.invoke("flutterwave-card-validate", {
    body: input,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as {
    status: string;
    redirect_url?: string;
    current_period_end?: string;
    message?: string;
  };
}

export async function verifyFlutterwavePayment(reference: string) {
  const sb = getSupabase();
  const { data, error } = await sb.functions.invoke("flutterwave-payment-verify", {
    body: { reference },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { status: string; current_period_end?: string };
}

export async function submitManualPayment(input: {
  plan: BillingPlan;
  method: "momo_manual" | "bank_transfer" | "airtel_manual";
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

  // airtel_manual stored as momo_manual until DB constraint includes it — use momo_manual + notes via reference prefix
  const method =
    input.method === "airtel_manual" ? "momo_manual" : input.method;
  const referenceId =
    input.method === "airtel_manual"
      ? `AIRTEL:${input.referenceId.trim()}`
      : input.referenceId.trim();

  const { data, error } = await sb
    .from("subscription_payments")
    .insert({
      user_id: userData.user.id,
      amount: planAmount(input.plan),
      currency: "RWF",
      plan_tier: input.plan,
      payment_method: method,
      reference_id: referenceId,
      proof_image_url: proofUrl,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function startAppleIap(_plan: BillingPlan) {
  throw new Error(
    "Apple In-App Purchase is configured for TestFlight builds. Use Manage Subscription on iOS, or pay via MoMo/card on the website."
  );
}

export async function deleteAccountRemote() {
  const sb = getSupabase();
  const { data, error } = await sb.functions.invoke("delete-account", { body: {} });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

/** Poll subscription refresh after STK / card redirect. */
export async function pollUntilActive(
  refresh: () => Promise<unknown>,
  opts?: { attempts?: number; intervalMs?: number }
) {
  const attempts = opts?.attempts ?? 10;
  const intervalMs = opts?.intervalMs ?? 3500;
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    await refresh();
  }
}
