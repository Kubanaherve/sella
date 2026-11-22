import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
  WebhookHandleResult,
} from "./types";

/**
 * Swap target. Set PAYMENT_PROVIDER=flutterwave when this provider is implemented.
 * The checkout keeps calling /api/payments and does not import this file.
 */
export class FlutterwaveProvider implements PaymentProvider {
  readonly name = "flutterwave";

  async initiatePayment(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    throw new Error("Flutterwave is not the active provider");
  }

  async verifyPayment(referenceId: string): Promise<VerifyPaymentResult> {
    return { referenceId, status: "FAILED", reason: "Flutterwave is not the active provider", raw: {} };
  }

  async handleWebhook(): Promise<WebhookHandleResult> {
    return { referenceId: null, status: "IGNORED" };
  }
}
