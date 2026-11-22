import { FlutterwaveProvider } from "./flutterwaveProvider";
import { MomoProvider, momoConfigFromEnv } from "./momoProvider";
import type { PaymentProvider } from "./types";

/** Server-side only. Do not import this from a React page. */
export function getPaymentProvider(env: Record<string, string | undefined>): PaymentProvider {
  const name = String(env.PAYMENT_PROVIDER || "mtn_momo").toLowerCase();
  if (name === "flutterwave") return new FlutterwaveProvider();
  return new MomoProvider(momoConfigFromEnv(env));
}
