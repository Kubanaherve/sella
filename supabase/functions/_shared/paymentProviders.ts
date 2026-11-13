/**
 * Payment provider adapters — ready for live credentials.
 * Modes: test | paypack | airtel_open_api | mtn_momo
 *
 * test mode never moves real money; it records pending payments and
 * only completes when a signed test webhook / admin approve arrives.
 */

export type ProviderId = "paypack" | "airtel_open_api" | "mtn_momo" | "test";

export type CollectInput = {
  phoneE164: string;
  amountRwf: number;
  reference: string;
  network: "mtn" | "airtel";
  currency?: string;
  country?: string;
};

export type CollectResult = {
  provider: ProviderId;
  accepted: boolean;
  externalRef: string | null;
  raw: Record<string, unknown>;
  message: string;
  /** true only when provider already confirmed success (rare for STK) */
  alreadyPaid: boolean;
};

export type StatusResult = {
  status: "pending" | "successful" | "failed" | "cancelled" | "unknown";
  raw: Record<string, unknown>;
};

function envMode(): "test" | "live" {
  return (Deno.env.get("PAYMENT_MODE") || "live").toLowerCase() === "test"
    ? "test"
    : "live";
}

/**
 * Choose collector for STK cash-in.
 * Live mode prefers Paypack (has webhook → activateFromPayment).
 * Direct MTN/Airtel Open API keys are ignored until dedicated webhook
 * edge functions exist — otherwise payments stay pending forever.
 * Live with no Paypack credentials fails closed (never silent test).
 */
export function resolveCollector(network: "mtn" | "airtel"): ProviderId {
  if (envMode() === "test") return "test";
  if (Deno.env.get("PAYPACK_CLIENT_ID") && Deno.env.get("PAYPACK_CLIENT_SECRET")) {
    return "paypack";
  }
  throw new Error(
    `Live MoMo (${network}) is not configured. Set PAYPACK_CLIENT_ID and PAYPACK_CLIENT_SECRET, or use PAYMENT_MODE=test for sandbox.`
  );
}

export async function collectPayment(input: CollectInput): Promise<CollectResult> {
  const provider = resolveCollector(input.network);
  switch (provider) {
    case "test":
      return collectTest(input);
    case "airtel_open_api":
      return collectAirtel(input);
    case "mtn_momo":
      return collectMtn(input);
    case "paypack":
    default:
      return collectPaypack(input);
  }
}

async function collectTest(input: CollectInput): Promise<CollectResult> {
  const externalRef = `test_${input.reference}`;
  return {
    provider: "test",
    accepted: true,
    externalRef,
    alreadyPaid: false,
    message:
      "TEST MODE: no real money collected. Complete via test webhook or Admin → Approve.",
    raw: {
      mode: "test",
      reference: input.reference,
      amount: input.amountRwf,
      phone: input.phoneE164,
      network: input.network,
    },
  };
}

async function collectPaypack(input: CollectInput): Promise<CollectResult> {
  const clientId = Deno.env.get("PAYPACK_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("PAYPACK_CLIENT_SECRET") || "";
  const authRes = await fetch("https://payments.paypack.rw/api/auth/agents/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });
  if (!authRes.ok) {
    return {
      provider: "paypack",
      accepted: false,
      externalRef: null,
      alreadyPaid: false,
      message: `Paypack auth failed: ${await authRes.text()}`,
      raw: {},
    };
  }
  const authJson = await authRes.json();
  const token = authJson.access || authJson.access_token || authJson.token;
  const cashinRes = await fetch("https://payments.paypack.rw/api/transactions/cashin", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      number: input.phoneE164.replace("+", ""),
      amount: input.amountRwf,
      environment: Deno.env.get("PAYPACK_ENV") || "production",
    }),
  });
  const raw = await cashinRes.json().catch(() => ({}));
  const externalRef = String(raw.ref || raw.reference || raw.transaction_id || "") || null;
  return {
    provider: "paypack",
    accepted: cashinRes.ok,
    externalRef,
    alreadyPaid: false,
    message: cashinRes.ok
      ? "Approve the MoMo / Airtel prompt on your phone"
      : `Paypack cashin failed: ${JSON.stringify(raw).slice(0, 200)}`,
    raw: raw as Record<string, unknown>,
  };
}

/** Airtel Africa Open API — Collection (Rwanda). Docs: developers.airtel.africa */
async function collectAirtel(input: CollectInput): Promise<CollectResult> {
  const base =
    Deno.env.get("AIRTEL_API_BASE") ||
    (Deno.env.get("AIRTEL_ENV") === "production"
      ? "https://openapi.airtel.africa"
      : "https://openapiuat.airtel.africa");
  const clientId = Deno.env.get("AIRTEL_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("AIRTEL_CLIENT_SECRET") || "";

  const tokenRes = await fetch(`${base}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!tokenRes.ok) {
    return {
      provider: "airtel_open_api",
      accepted: false,
      externalRef: null,
      alreadyPaid: false,
      message: `Airtel OAuth failed: ${await tokenRes.text()}`,
      raw: {},
    };
  }
  const tokenJson = await tokenRes.json();
  const access = tokenJson.access_token;
  // MSISDN without country code for Airtel RW often 7XXXXXXXX (drop +250)
  let msisdn = input.phoneE164.replace(/\D/g, "");
  if (msisdn.startsWith("250")) msisdn = msisdn.slice(3);

  const payRes = await fetch(`${base}/merchant/v1/payments/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-Country": input.country || "RW",
      "X-Currency": input.currency || "RWF",
    },
    body: JSON.stringify({
      reference: input.reference,
      subscriber: { country: "RW", currency: "RWF", msisdn },
      transaction: {
        amount: input.amountRwf,
        country: "RW",
        currency: "RWF",
        id: input.reference,
      },
    }),
  });
  const raw = await payRes.json().catch(() => ({}));
  const ok = payRes.ok && (raw.status?.success === true || raw.status?.code === "200");
  const externalRef =
    String(raw.data?.transaction?.id || raw.data?.transaction?.airtel_money_id || "") ||
    input.reference;
  return {
    provider: "airtel_open_api",
    accepted: !!ok,
    externalRef,
    alreadyPaid: false,
    message: ok
      ? "Approve the Airtel Money prompt on your phone"
      : `Airtel collect failed: ${JSON.stringify(raw).slice(0, 240)}`,
    raw: raw as Record<string, unknown>,
  };
}

/** MTN MoMo Collection API — ready when subscription key + API user arrive. */
async function collectMtn(input: CollectInput): Promise<CollectResult> {
  const base =
    Deno.env.get("MTN_MOMO_BASE") ||
    (Deno.env.get("MTN_MOMO_ENV") === "production"
      ? "https://proxy.momoapi.mtn.com"
      : "https://sandbox.momodeveloper.mtn.com");
  const subKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY") || "";
  const apiUser = Deno.env.get("MTN_MOMO_API_USER") || "";
  const apiKey = Deno.env.get("MTN_MOMO_API_KEY") || "";
  const targetEnv = Deno.env.get("MTN_MOMO_TARGET_ENV") || "sandbox";

  const basic = btoa(`${apiUser}:${apiKey}`);
  const tokenRes = await fetch(`${base}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Ocp-Apim-Subscription-Key": subKey,
    },
  });
  if (!tokenRes.ok) {
    return {
      provider: "mtn_momo",
      accepted: false,
      externalRef: null,
      alreadyPaid: false,
      message: `MTN MoMo token failed: ${await tokenRes.text()}`,
      raw: {},
    };
  }
  const { access_token } = await tokenRes.json();
  const externalId = crypto.randomUUID();
  const payRes = await fetch(`${base}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "X-Reference-Id": externalId,
      "X-Target-Environment": targetEnv,
      "Ocp-Apim-Subscription-Key": subKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(input.amountRwf),
      currency: input.currency || "RWF",
      externalId: input.reference,
      payer: {
        partyIdType: "MSISDN",
        partyId: input.phoneE164.replace("+", ""),
      },
      payerMessage: "SELLA subscription",
      payeeNote: input.reference,
    }),
  });
  const text = await payRes.text();
  return {
    provider: "mtn_momo",
    accepted: payRes.status === 202 || payRes.ok,
    externalRef: externalId,
    alreadyPaid: false,
    message: payRes.status === 202
      ? "Approve the MTN MoMo prompt on your phone"
      : `MTN requestToPay failed: ${text.slice(0, 200)}`,
    raw: { status: payRes.status, body: text, reference: input.reference },
  };
}

export async function logWebhook(
  // deno-lint-ignore no-explicit-any
  sb: any,
  row: {
    provider: string;
    event_type?: string;
    external_ref?: string | null;
    payment_id?: string | null;
    signature_valid?: boolean | null;
    payload: Record<string, unknown>;
    processed?: boolean;
    process_error?: string | null;
  }
) {
  try {
    await sb.from("payment_webhooks").insert({
      provider: row.provider,
      event_type: row.event_type || null,
      external_ref: row.external_ref || null,
      payment_id: row.payment_id || null,
      signature_valid: row.signature_valid ?? null,
      payload: row.payload,
      processed: row.processed ?? false,
      process_error: row.process_error || null,
    });
  } catch (e) {
    console.error("payment_webhooks insert failed", e);
  }
}
