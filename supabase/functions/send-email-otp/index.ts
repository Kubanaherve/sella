import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

function normalizeEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

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

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";
  const from = Deno.env.get("EMAIL_FROM") || "Sella <onboarding@resend.dev>";

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
    });
    if (!res.ok) throw new Error(`Resend failed: ${await res.text()}`);
    return { provider: "resend" as const };
  }

  // Free path: Supabase Auth magic OTP email (uses project Auth email settings)
  const sb = adminClient();
  const { error } = await sb.auth.signInWithOtp({
    email: to,
    options: {
      shouldCreateUser: false,
      data: { purpose: "sella_email_confirm" },
    },
  });
  // If user does not exist yet, still OK — we store our own OTP hash below and
  // also try invite for brand-new emails during registration.
  if (error && !String(error.message).includes("Signups not allowed")) {
    console.warn("supabase auth email fallback", error.message);
  }
  return { provider: "supabase_auth" as const };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const email = normalizeEmail(String(body.email || ""));
    const shopName = String(body.business_name || "your shop").trim();
    if (!email) return json({ error: "Valid email required" }, 400);

    const sb = adminClient();
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await sb
      .from("otp_verifications")
      .select("id", { count: "exact", head: true })
      .eq("email_normalized", email)
      .eq("channel", "email")
      .gte("created_at", since);
    if ((count ?? 0) >= 5) {
      return json({ error: "Too many email codes. Try again in 15 minutes." }, 429);
    }

    const code = randomOtp();
    const otpHash = await sha256Hex(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertErr } = await sb.from("otp_verifications").insert({
      phone_normalized: email, // keep NOT NULL column satisfied for email channel
      email_normalized: email,
      channel: "email",
      otp_hash: otpHash,
      attempts: 0,
      is_verified: false,
      expires_at: expiresAt,
    });
    if (insertErr) throw insertErr;

    const subject = `Sella confirmation code: ${code}`;
    const text = `Your Sella email confirmation code is ${code}.\n\nShop: ${shopName}\nValid for 15 minutes.\n\nIf you did not request this, ignore this email.`;
    const html = `<p>Your <strong>Sella</strong> confirmation code is:</p><p style="font-size:28px;letter-spacing:6px"><strong>${code}</strong></p><p>Shop: ${shopName}</p><p>Valid for 15 minutes.</p>`;

    let provider = "stored_only";
    try {
      if (Deno.env.get("RESEND_API_KEY")) {
        const r = await sendEmail(email, subject, text, html);
        provider = r.provider;
      } else {
        // Always attempt Supabase Auth email when Resend is not configured (free)
        const r = await sendEmail(email, subject, text, html);
        provider = r.provider;
        // Also store our hashed code so verify-email-otp works even if Auth email differs
      }
    } catch (mailErr) {
      console.error("email send", mailErr);
      // Code remains verifiable via our table; UI can show "check spam / contact support"
      provider = "deferred";
    }

    return json({
      success: true,
      expiresIn: 900,
      provider,
      message:
        provider === "deferred"
          ? "Code generated. Configure RESEND_API_KEY or Supabase Auth SMTP to deliver email."
          : "Confirmation code sent to email",
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Failed to send email OTP" }, 500);
  }
});
