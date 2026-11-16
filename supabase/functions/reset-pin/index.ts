/**
 * Forgot-PIN reset: email OTP must already be verified in otp_verifications,
 * then set a new 4-digit PIN (Auth password = sella_${pin}_${last4}).
 */
import { corsHeaders, json } from "../_shared/cors.ts";
import { normalizePhoneE164, phoneDigitsOnly } from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

function normalizeEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const email = normalizeEmail(String(body.email || ""));
    const phone = normalizePhoneE164(String(body.phone || ""));
    const newPin = String(body.new_pin || body.pin || "").trim();

    if (!email) return json({ error: "Valid email required" }, 400);
    if (!phone) return json({ error: "Valid Rwanda phone required" }, 400);
    if (!/^\d{4}$/.test(newPin)) return json({ error: "PIN must be exactly 4 digits" }, 400);

    const sb = adminClient();

    const bucket = `reset-pin:${phone}`;
    const { data: rateRows, error: rateErr } = await sb.rpc("check_auth_rate_limit", {
      p_bucket: bucket,
      p_max_attempts: 5,
      p_window_seconds: 900,
      p_lock_seconds: 900,
    });
    if (rateErr) {
      console.error("rate limit rpc", rateErr);
      return json({ error: "Reset temporarily unavailable. Try again shortly." }, 503);
    }
    const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
    if (rate && rate.allowed === false) {
      return json(
        {
          error: "Too many reset attempts. Try again later.",
          retry_after_seconds: rate.retry_after_seconds || 900,
        },
        429
      );
    }

    const { data: emailRows } = await sb
      .from("otp_verifications")
      .select("id")
      .eq("email_normalized", email)
      .eq("channel", "email")
      .eq("is_verified", true)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);
    if (!emailRows?.[0]) {
      return json(
        {
          error: "Confirm your email first with the 6-digit code we sent",
          need_email_otp: true,
        },
        400
      );
    }

    const { data: profile, error: profErr } = await sb
      .from("profiles")
      .select("user_id, email, phone_normalized, email_normalized")
      .eq("phone_normalized", phone)
      .maybeSingle();
    if (profErr) throw profErr;
    if (!profile?.user_id || !profile.email) {
      return json({ error: "No account for this phone." }, 404);
    }
    if (String(profile.email_normalized || profile.email).toLowerCase() !== email) {
      return json({ error: "Email does not match this phone's shop account." }, 403);
    }

    const digits = phoneDigitsOnly(phone);
    const newPassword = `sella_${newPin}_${digits.slice(-4)}`;
    const { error: updErr } = await sb.auth.admin.updateUserById(profile.user_id, {
      password: newPassword,
    });
    if (updErr) throw updErr;

    // Invalidate the OTP so it cannot be reused
    await sb
      .from("otp_verifications")
      .update({ is_verified: false, attempts: 99 })
      .eq("id", emailRows[0].id);

    // Clear reset rate-limit and any login lockout so user can log in immediately
    await sb
      .from("auth_rate_limits")
      .delete()
      .in("bucket_key", [bucket, `pin:${phone}`]);

    return json({ success: true, phone, email });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Reset failed" }, 500);
  }
});
