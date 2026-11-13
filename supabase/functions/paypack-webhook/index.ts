import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import {
  activateFromPayment,
  markPaymentFailed,
} from "../_shared/subscriptionActivate.ts";

function secretsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function extractProvidedSecret(req: Request): string {
  const sig = req.headers.get("x-paypack-signature");
  if (sig) return sig.trim();
  const wh = req.headers.get("x-webhook-secret");
  if (wh) return wh.trim();
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return auth.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const secret = Deno.env.get("PAYPACK_WEBHOOK_SECRET") || "";
    if (!secret) {
      console.error("PAYPACK_WEBHOOK_SECRET is not set — rejecting webhook");
      return json({ error: "Webhook not configured" }, 503);
    }
    const provided = extractProvidedSecret(req);
    if (!provided || !secretsEqual(provided, secret)) {
      return json({ error: "Invalid webhook signature" }, 401);
    }

    const payload = await req.json();
    const event = String(payload.event || payload.type || "");
    const data = payload.data || payload;
    const status = String(data.status || payload.status || "").toLowerCase();
    const ref = String(
      data.ref || data.reference || data.transaction_id || payload.ref || ""
    ).trim();
    const amount = data.amount != null ? Number(data.amount) : null;

    const failed =
      status === "failed" ||
      status === "cancelled" ||
      status === "canceled" ||
      event === "transaction:failed" ||
      event === "transaction:cancelled";

    const success =
      status === "successful" ||
      status === "success" ||
      event === "transaction:processed" ||
      event === "transaction:successful";

    if (!ref) {
      console.error("Paypack webhook without ref — refusing");
      return json({ error: "Missing payment reference" }, 400);
    }

    const sb = adminClient();
    const { data: payments } = await sb
      .from("subscription_payments")
      .select("*")
      .or(`external_transaction_id.eq.${ref},reference_id.eq.${ref}`)
      .order("created_at", { ascending: false })
      .limit(1);
    const payment = payments?.[0];
    if (!payment) {
      return json({ ok: true, message: "No matching payment", ref });
    }

    if (payment.status === "completed") {
      return json({ ok: true, idempotent: true, payment_id: payment.id });
    }

    if (failed) {
      await markPaymentFailed(
        sb,
        payment.id,
        `Paypack webhook ${status || event}`,
        status.includes("cancel") ? "cancelled" : "rejected"
      );
      return json({ ok: true, status: "failed", payment_id: payment.id });
    }

    if (!success) return json({ ok: true, ignored: true, status, event });

    // Optional amount check when Paypack includes amount
    if (amount != null && Number.isFinite(amount) && Number(payment.amount) !== amount) {
      console.error("Paypack amount mismatch", payment.amount, amount);
      return json({ error: "Amount mismatch" }, 400);
    }

    // Optional live re-verify against Paypack events API when configured
    const clientId = Deno.env.get("PAYPACK_CLIENT_ID") || "";
    const clientSecret = Deno.env.get("PAYPACK_CLIENT_SECRET") || "";
    if (clientId && clientSecret && Deno.env.get("PAYPACK_REVERIFY") === "true") {
      try {
        const authRes = await fetch(
          "https://payments.paypack.rw/api/auth/agents/authorize",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
          }
        );
        const authJson = await authRes.json();
        const token = authJson.access || authJson.access_token || authJson.token;
        if (token) {
          const evRes = await fetch(
            `https://payments.paypack.rw/api/transactions/events?ref=${encodeURIComponent(ref)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );
          if (evRes.ok) {
            const evJson = await evRes.json();
            const rows = Array.isArray(evJson) ? evJson : evJson?.transactions || evJson?.data || [];
            const okRow = (rows as { status?: string }[]).some((r) => {
              const s = String(r.status || "").toLowerCase();
              return s === "successful" || s === "success";
            });
            if (!okRow && Array.isArray(rows) && rows.length > 0) {
              return json({ error: "Paypack re-verify failed", detail: evJson }, 400);
            }
          }
        }
      } catch (e) {
        console.error("Paypack re-verify error", e);
      }
    }

    const result = await activateFromPayment(sb, payment, {
      externalId: ref,
      note: "Paypack webhook verified",
    });

    return json({
      ok: true,
      payment_id: payment.id,
      current_period_end: result.current_period_end,
      already: result.already || false,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Webhook failed" }, 500);
  }
});
