import { corsHeaders, json } from "../_shared/cors.ts";
import { normalizePhoneE164, phoneDigitsOnly } from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const phone = normalizePhoneE164(String(body.phone || ""));
    const pin = String(body.pin || "").trim();
    if (!phone) return json({ error: "Valid phone required" }, 400);
    if (!/^\d{4}$/.test(pin)) return json({ error: "PIN must be 4 digits" }, 400);

    const sb = adminClient();
    const bucket = `pin:${phone}`;
    const { data: rateRows, error: rateErr } = await sb.rpc("check_auth_rate_limit", {
      p_bucket: bucket,
      p_max_attempts: 8,
      p_window_seconds: 900,
      p_lock_seconds: 900,
    });
    if (rateErr) {
      console.error("rate limit rpc", rateErr);
      // Fail closed: do not allow unlimited PIN brute-force if rate limiting is broken.
      return json(
        { error: "Login temporarily unavailable. Try again shortly." },
        503
      );
    }
    const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
    if (rate && rate.allowed === false) {
      return json(
        {
          error: "Too many PIN attempts. Try again later.",
          retry_after_seconds: rate.retry_after_seconds || 900,
        },
        429
      );
    }

    const { data: profile, error } = await sb
      .from("profiles")
      .select("*")
      .eq("phone_normalized", phone)
      .maybeSingle();
    if (error) throw error;
    if (!profile?.email) {
      return json({ error: "No account for this phone. Register your shop first." }, 404);
    }

    const digits = phoneDigitsOnly(phone);
    const password = `sella_${pin}_${digits.slice(-4)}`;

    const { data: sessionData, error: signErr } = await sb.auth.signInWithPassword({
      email: profile.email,
      password,
    });
    if (signErr) {
      return json({ error: "Phone or PIN is incorrect" }, 401);
    }

    const { data: subscription } = await sb
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    return json({
      success: true,
      access_token: sessionData.session?.access_token,
      refresh_token: sessionData.session?.refresh_token,
      profile,
      subscription,
      shop_code: profile.shop_code,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Login failed" }, 500);
  }
});
