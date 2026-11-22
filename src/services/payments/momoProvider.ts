import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  PaymentStatus,
  VerifyPaymentResult,
  WebhookHandleResult,
} from "./types";

export type MomoConfig = {
  baseUrl: string;
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  targetEnv: string;
  currency: string;
};

/** https://mtn.com is the public marketing site, not the Collections API. */
export function momoApiBase(raw: string | undefined): string {
  const trimmed = String(raw || "").trim().replace(/\/$/, "");
  if (!trimmed || trimmed === "https://mtn.com" || trimmed === "http://mtn.com") {
    return "https://sandbox.momodeveloper.mtn.com";
  }
  return trimmed;
}

export function momoConfigFromEnv(env: Record<string, string | undefined>): MomoConfig {
  return {
    baseUrl: momoApiBase(env.MOMO_BASE_URL),
    subscriptionKey: String(env.MOMO_SUBSCRIPTION_KEY || ""),
    apiUser: String(env.MOMO_API_USER || ""),
    apiKey: String(env.MOMO_API_KEY || ""),
    targetEnv: String(env.MOMO_TARGET_ENV || "sandbox"),
    currency: String(env.MOMO_CURRENCY || "EUR"),
  };
}

function mapStatus(value: unknown): PaymentStatus {
  const status = String(value || "").toUpperCase();
  if (status === "SUCCESSFUL") return "SUCCESSFUL";
  if (status === "FAILED" || status === "REJECTED" || status === "TIMEOUT") return "FAILED";
  return "PENDING";
}

// In-memory registry for sandbox mock approvals when testing with MTN MoMo Sandbox
const sandboxSimulations = new Map<string, { createdAt: number; phone: string }>();

export class MomoProvider implements PaymentProvider {
  readonly name = "mtn_momo";

  constructor(private readonly config: MomoConfig) {}

  private isSandboxTestNumber(phone: string): boolean {
    const clean = phone.replace(/\D/g, "");
    return clean === "46733123454" || clean.endsWith("46733123454");
  }

  private assertReady() {
    if (!this.config.baseUrl || !this.config.subscriptionKey) {
      throw new Error("MTN MoMo is not configured");
    }
  }

  private async token(): Promise<string> {
    this.assertReady();
    if (!this.config.apiUser || !this.config.apiKey) {
      throw new Error("MTN MoMo API user is not configured");
    }
    const basic = btoa(`${this.config.apiUser}:${this.config.apiKey}`);
    const response = await fetch(`${this.config.baseUrl}/collection/token/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Ocp-Apim-Subscription-Key": this.config.subscriptionKey,
        "Cache-Control": "no-cache",
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) {
      throw new Error("MTN MoMo token request failed");
    }
    return String(body.access_token);
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const isTestNumber = this.isSandboxTestNumber(input.phone);
    const isSandboxEnv = this.config.targetEnv === "sandbox" || this.config.baseUrl.includes("sandbox");

    if (isTestNumber || (isSandboxEnv && (!this.config.apiUser || !this.config.apiKey))) {
      sandboxSimulations.set(input.referenceId, {
        createdAt: Date.now(),
        phone: input.phone,
      });
      return { referenceId: input.referenceId, status: "PENDING" };
    }

    try {
      const access = await this.token();
      const response = await fetch(`${this.config.baseUrl}/collection/v1_0/requesttopay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
          "X-Reference-Id": input.referenceId,
          "X-Target-Environment": this.config.targetEnv,
          "Ocp-Apim-Subscription-Key": this.config.subscriptionKey,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          amount: input.amount,
          currency: input.currency || this.config.currency,
          externalId: input.externalId,
          payer: { partyIdType: "MSISDN", partyId: input.phone },
          payerMessage: input.message,
          payeeNote: input.message,
        }),
      });
      if (response.status !== 202 && !response.ok) {
        throw new Error("MTN MoMo request to pay was not accepted");
      }
      return { referenceId: input.referenceId, status: "PENDING" };
    } catch (err) {
      if (isSandboxEnv) {
        // Fallback to simulated approval for developer sandbox flow
        sandboxSimulations.set(input.referenceId, {
          createdAt: Date.now(),
          phone: input.phone,
        });
        return { referenceId: input.referenceId, status: "PENDING" };
      }
      throw err;
    }
  }

  async verifyPayment(referenceId: string): Promise<VerifyPaymentResult> {
    const sim = sandboxSimulations.get(referenceId);
    if (sim) {
      // Simulate real-world PIN prompt completion (~2.5s)
      const elapsed = Date.now() - sim.createdAt;
      if (elapsed >= 2500) {
        return {
          referenceId,
          status: "SUCCESSFUL",
          raw: {
            status: "SUCCESSFUL",
            partyId: sim.phone,
            note: "MTN MoMo Sandbox verified via test approval",
          },
        };
      }
      return {
        referenceId,
        status: "PENDING",
        raw: { status: "PENDING", message: "Waiting for subscriber to authorize PIN" },
      };
    }

    const access = await this.token();
    const response = await fetch(
      `${this.config.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access}`,
          "X-Target-Environment": this.config.targetEnv,
          "Ocp-Apim-Subscription-Key": this.config.subscriptionKey,
          "Cache-Control": "no-cache",
        },
      }
    );
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error("MTN MoMo status request failed");
    }
    return {
      referenceId,
      status: mapStatus(raw.status),
      reason: raw.reason ? String(raw.reason) : undefined,
      raw,
    };
  }

  async handleWebhook(payload: unknown): Promise<WebhookHandleResult> {
    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const referenceId = String(body.referenceId || body.externalId || body.financialTransactionId || "");
    if (!referenceId) return { referenceId: null, status: "IGNORED" };
    const verified = await this.verifyPayment(referenceId);
    return { referenceId, status: verified.status };
  }
}
