import { handlePaymentWebhook } from "../../src/server/paymentsApi";

export default async function handler(
  req: { method?: string; body?: unknown },
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const result = await handlePaymentWebhook(req.body || {});
  res.status(result.status).json(result.body);
}
