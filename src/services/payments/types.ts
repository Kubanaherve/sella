export type PaymentProduct = "normal" | "pro";
export type PaymentInterval = "monthly" | "annual";

export type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

export type InitiatePaymentInput = {
  referenceId: string;
  phone: string;
  amount: string;
  currency: string;
  externalId: string;
  message: string;
};

export type InitiatePaymentResult = {
  referenceId: string;
  status: PaymentStatus;
};

export type VerifyPaymentResult = {
  referenceId: string;
  status: PaymentStatus;
  reason?: string;
  raw: Record<string, unknown>;
};

export type WebhookHandleResult = {
  referenceId: string | null;
  status: PaymentStatus | "IGNORED";
};

/**
 * Provider boundary. The UI calls our own /api/payments routes.
 * Swapping MTN for Flutterwave means changing getPaymentProvider(), not the checkout.
 */
export interface PaymentProvider {
  readonly name: string;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verifyPayment(referenceId: string): Promise<VerifyPaymentResult>;
  handleWebhook(payload: unknown): Promise<WebhookHandleResult>;
}
