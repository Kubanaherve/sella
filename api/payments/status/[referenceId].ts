import { handlePaymentStatus } from "../../../src/server/paymentsApi";

export default async function handler(
  req: { method?: string; query: { referenceId?: string }; headers: { authorization?: string } },
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const result = await handlePaymentStatus(String(req.query.referenceId || ""), req.headers.authorization || "");
  res.status(result.status).json(result.body);
}
