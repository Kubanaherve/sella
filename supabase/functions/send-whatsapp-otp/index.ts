import { corsHeaders, json } from "../_shared/cors.ts";
import { normalizePhoneE164, REVIEWER_OTP, isReviewerPhone } from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

async function sendWhatsApp(phoneE164: string, code: string): Promise<void> {
  const provider = (Deno.env.get("WHATSAPP_PROVIDER") || "meta").toLowerCase();
  const bodyText = `Sella verification code: ${code}. Valid for 10 minutes. Do not share this code.`;

  if (provider === "twilio") {
    const sid = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
    const token = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
    const from = Deno.env.get("TWILIO_WHATSAPP_FROM") || "";
    if (!sid || !token || !from) throw new Error("Twilio WhatsApp env incomplete");
    const auth = btoa(`${sid}:${token}`);
    const form = new URLSearchParams({
      From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      To: `whatsapp:${phoneE164}`,
      Body: bodyText,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      }
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Twilio WhatsApp failed: ${t}`);
    }
    return;
  }

  // Meta WhatsApp Cloud API (default)
  const token = Deno.env.get("WHATSAPP_API_TOKEN") || "";
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
  const templateName = Deno.env.get("WHATSAPP_OTP_TEMPLATE") || "";
  if (!token || !phoneNumberId) throw new Error("Meta WhatsApp env incomplete");

  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to: phoneE164.replace("+", ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: Deno.env.get("WHATSAPP_TEMPLATE_LANG") || "en" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: code }],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to: phoneE164.replace("+", ""),
        type: "text",
        text: { body: bodyText },
      };

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Meta WhatsApp failed: ${t}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const phone = normalizePhoneE164(String(body.phone || ""));
    if (!phone) return json({ error: "Invalid Rwanda phone number" }, 400);

    const sb = adminClient();
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await sb
      .from("otp_verifications")
      .select("id", { count: "exact", head: true })
      .eq("phone_normalized", phone)
      .gte("created_at", since);

    if ((count ?? 0) >= 3) {
      return json({ error: "Too many OTP requests. Try again in 15 minutes." }, 429);
    }

    const isReviewer = isReviewerPhone(phone);
    const code = isReviewer ? REVIEWER_OTP : randomOtp();
    const otpHash = await sha256Hex(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertErr } = await sb.from("otp_verifications").insert({
      phone_normalized: phone,
      otp_hash: otpHash,
      attempts: 0,
      is_verified: false,
      expires_at: expiresAt,
    });
    if (insertErr) throw insertErr;

    if (isReviewer) {
      return json({
        success: true,
        message: "Reviewer demo code sent",
        expiresIn: 600,
        reviewerHint: true,
      });
    }

    await sendWhatsApp(phone, code);
    return json({ success: true, expiresIn: 600 });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Failed to send OTP" }, 500);
  }
});
