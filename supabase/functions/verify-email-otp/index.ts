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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const email = normalizeEmail(String(body.email || ""));
    const otpCode = String(body.otp_code || body.otp || "").trim();
    if (!email) return json({ error: "Valid email required" }, 400);
    if (!/^\d{6}$/.test(otpCode)) return json({ error: "OTP must be 6 digits" }, 400);

    const sb = adminClient();
    const { data: rows, error } = await sb
      .from("otp_verifications")
      .select("*")
      .eq("email_normalized", email)
      .eq("channel", "email")
      .eq("is_verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = rows?.[0];
    if (!row) return json({ error: "No valid email code. Request a new one." }, 400);
    if (row.attempts >= 5) return json({ error: "Too many attempts" }, 400);

    const hash = await sha256Hex(otpCode);
    if (hash !== row.otp_hash) {
      await sb
        .from("otp_verifications")
        .update({ attempts: (row.attempts || 0) + 1 })
        .eq("id", row.id);
      return json({ error: "Incorrect code" }, 401);
    }

    await sb
      .from("otp_verifications")
      .update({ is_verified: true, attempts: (row.attempts || 0) + 1 })
      .eq("id", row.id);

    // Mark profile email verified when logged-in user matches
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const { data: userData } = await sb.auth.getUser(authHeader.slice(7));
      if (userData.user) {
        await sb
          .from("profiles")
          .update({
            email,
            email_normalized: email,
            email_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userData.user.id);
      }
    }

    return json({ success: true, email, email_verified: true });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Verify failed" }, 500);
  }
});
