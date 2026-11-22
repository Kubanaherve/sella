import { handlePaymentInitiate } from "../../src/server/paymentsApi";

export default async function handler(req: { method?: string; body?: unknown; headers: { authorization?: string } }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const result = await handlePaymentInitiate(
    (req.body || {}) as Record<string, unknown>,
    req.headers.authorization || ""
  );
  res.status(result.status).json(result.body);
}
