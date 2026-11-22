import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { planAmountRwf, type BillingInterval, type ProductPlan } from "../lib/planCatalog";
import { getPaymentProvider } from "../services/payments/getProvider";

type Json = Record<string, unknown>;

export type ApiResult = { status: number; body: Json };

function readDotEnv(): Record<string, string> {
  const file = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function serverEnv(): Record<string, string | undefined> {
  const file = readDotEnv();
  return new Proxy(file, {
    get(target, prop: string) {
      const fromProcess = process.env[prop];
      if (fromProcess) return fromProcess;
      return target[prop];
    },
  }) as Record<string, string | undefined>;
}

function admin(): SupabaseClient {
  const env = serverEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const key = env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Supabase service role is not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function userIdFromAuth(authorization: string): Promise<string | null> {
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const env = serverEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !anon) return null;
  const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

function digits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function sandboxChargeAmount(): string {
  return "100";
}

async function activateOnce(
  sb: SupabaseClient,
  payment: { id: string; user_id: string; plan_tier: string; product_plan: string; amount: number }
) {
  const product: ProductPlan = payment.product_plan === "pro" ? "pro" : "normal";
  const interval: BillingInterval = payment.plan_tier === "annual" ? "annual" : "monthly";
  if (Number(payment.amount) !== planAmountRwf(product, interval)) {
    throw new Error("Payment amount does not match the plan");
  }

  const { data: locked } = await sb
    .from("subscription_payments")
    .update({
      status: "completed",
      verified_at: new Date().toISOString(),
      admin_notes: "MTN MoMo SUCCESSFUL",
    })
    .eq("id", payment.id)
    .eq("status", "pending")
    .select("id");
  if (!locked?.length) return { already: true };

  const { data: existing } = await sb
    .from("user_subscriptions")
    .select("current_period_end")
    .eq("user_id", payment.user_id)
    .maybeSingle();
  const now = new Date();
  const current = existing?.current_period_end ? new Date(existing.current_period_end) : now;
  const startFrom = current.getTime() > now.getTime() ? current : now;
  const end = new Date(startFrom.getTime() + (interval === "annual" ? 365 : 30) * 86400000);

  await sb.from("user_subscriptions").upsert(
    {
      user_id: payment.user_id,
      plan_tier: interval,
      product_plan: product,
      is_pro: product === "pro",
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      auto_renew: true,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );
  const proFlag = await sb
    .from("user_subscriptions")
    .update({ is_pro: product === "pro" })
    .eq("user_id", payment.user_id);
  if (proFlag.error && !/is_pro/i.test(proFlag.error.message)) {
    throw new Error(proFlag.error.message);
  }
  return { already: false, current_period_end: end.toISOString() };
}

export async function handlePaymentInitiate(body: Json, authorization: string): Promise<ApiResult> {
  const userId = await userIdFromAuth(authorization);
  if (!userId) return { status: 401, body: { error: "Sign in required" } };

  const phone = digits(String(body.phone || ""));
  if (phone.length < 8 || phone.length > 15) {
    return { status: 400, body: { error: "Enter the phone number that will approve the payment" } };
  }
  const product: ProductPlan = body.product === "pro" ? "pro" : "normal";
  const interval: BillingInterval = body.interval === "annual" ? "annual" : "monthly";
  const amountRwf = planAmountRwf(product, interval);
  const referenceId = crypto.randomUUID();
  const sb = admin();
  const { error: insertError } = await sb.from("subscription_payments").insert({
    user_id: userId,
    amount: amountRwf,
    currency: "RWF",
    plan_tier: interval,
    product_plan: product,
    payment_method: "mtn_momo",
    reference_id: referenceId,
    status: "pending",
    admin_notes: "MTN MoMo pending",
  });
  if (insertError) return { status: 500, body: { error: "Could not record the payment" } };

  try {
    const provider = getPaymentProvider(serverEnv());
    await provider.initiatePayment({
      referenceId,
      phone,
      amount: sandboxChargeAmount(),
      currency: String(serverEnv().MOMO_CURRENCY || "EUR"),
      externalId: referenceId,
      message: product === "pro" ? "Sella Pro" : "Sella Normal",
    });
  } catch {
    await sb.from("subscription_payments").update({ status: "rejected" }).eq("reference_id", referenceId);
    return { status: 502, body: { error: "MTN MoMo did not accept the payment request" } };
  }

  return {
    status: 202,
    body: { referenceId, status: "PENDING", message: "Waiting for PIN approval" },
  };
}

export async function handlePaymentStatus(referenceId: string, authorization: string): Promise<ApiResult> {
  const userId = await userIdFromAuth(authorization);
  if (!userId) return { status: 401, body: { error: "Sign in required" } };
  const sb = admin();
  const { data: payment } = await sb
    .from("subscription_payments")
    .select("id, user_id, plan_tier, product_plan, amount, status, reference_id")
    .eq("reference_id", referenceId)
    .maybeSingle();
  if (!payment || payment.user_id !== userId) return { status: 404, body: { error: "Payment not found" } };
  if (payment.status === "completed") {
    return { status: 200, body: { referenceId, status: "SUCCESSFUL", already: true } };
  }
  if (payment.status === "rejected") {
    return { status: 200, body: { referenceId, status: "FAILED" } };
  }

  const provider = getPaymentProvider(serverEnv());
  const verified = await provider.verifyPayment(referenceId);
  if (verified.status === "SUCCESSFUL") {
    const result = await activateOnce(sb, payment);
    return { status: 200, body: { referenceId, status: "SUCCESSFUL", ...result } };
  }
  if (verified.status === "FAILED") {
    await sb.from("subscription_payments").update({ status: "rejected" }).eq("id", payment.id).eq("status", "pending");
    return { status: 200, body: { referenceId, status: "FAILED", reason: verified.reason || "" } };
  }
  return { status: 200, body: { referenceId, status: "PENDING", message: "Waiting for PIN approval" } };
}

export async function handlePaymentWebhook(payload: unknown): Promise<ApiResult> {
  const provider = getPaymentProvider(serverEnv());
  const event = await provider.handleWebhook(payload);
  if (!event.referenceId || event.status === "IGNORED") {
    return { status: 200, body: { ok: true, ignored: true } };
  }
  const sb = admin();
  const { data: payment } = await sb
    .from("subscription_payments")
    .select("id, user_id, plan_tier, product_plan, amount, status, reference_id")
    .eq("reference_id", event.referenceId)
    .maybeSingle();
  if (!payment) return { status: 200, body: { ok: true, missing: true } };
  if (payment.status === "completed") return { status: 200, body: { ok: true, already: true } };
  if (event.status !== "SUCCESSFUL") {
    if (event.status === "FAILED") {
      await sb.from("subscription_payments").update({ status: "rejected" }).eq("id", payment.id).eq("status", "pending");
    }
    return { status: 200, body: { ok: true, status: event.status } };
  }
  const result = await activateOnce(sb, payment);
  return { status: 200, body: { ok: true, status: "SUCCESSFUL", already: result.already } };
}
