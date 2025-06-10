import { corsHeaders, json } from "../_shared/cors.ts";
import {
  normalizePhoneE164,
  phoneDigitsOnly,
  REVIEWER_OTP,
  isReviewerPhone,
} from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!e) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

function normalizeNationalId(raw: string): string | null {
  const n = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return n.length >= 5 ? n : null;
}

async function sendShopWelcomeEmail(
  to: string,
  shopCode: string,
  businessName: string,
  ownerName: string
) {
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";
  const from = Deno.env.get("EMAIL_FROM") || "Sella <onboarding@resend.dev>";
  const subject = `Your Sella shop code: ${shopCode}`;
  const text = `Muraho ${ownerName || ""}!\n\nYour shop "${businessName}" is registered on Sella.\n\nSHOP CODE (keep this): ${shopCode}\n\nThis code uniquely identifies your shop even if another business uses the same name.\n\n— Sella`;
  const html = `<p>Muraho <strong>${ownerName || ""}</strong>!</p><p>Your shop <strong>${businessName}</strong> is registered on Sella.</p><p style="font-size:22px">Shop code: <strong>${shopCode}</strong></p><p>This code uniquely identifies your shop even if another business uses the same name.</p>`;

  if (!resendKey) {
    console.log("RESEND_API_KEY missing — shop code emailed only when configured", { to, shopCode });
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  if (!res.ok) {
    console.error("welcome email failed", await res.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const phone = normalizePhoneE164(String(body.phone || ""));
    const otpCode = String(body.otp_code || body.otp || "").trim();
    const pin = String(body.pin || body.password || "").trim();
    const businessName = String(body.business_name || "My Shop").trim() || "My Shop";
    const ownerName = String(body.owner_name || body.display_name || "").trim();
    const emailNorm = normalizeEmail(String(body.email || ""));
    const nationalId = normalizeNationalId(String(body.national_id || ""));
    const emailOtpVerified = Boolean(body.email_otp_verified);

    if (!phone) return json({ error: "Invalid phone" }, 400);
    if (!emailNorm) return json({ error: "Valid email required to identify your shop owner" }, 400);
    if (!/^\d{6}$/.test(otpCode)) return json({ error: "OTP must be 6 digits" }, 400);
    if (pin.length < 4 || pin.length > 6) {
      return json({ error: "PIN must be 4–6 digits" }, 400);
    }

    const sb = adminClient();
    const isReviewer = isReviewerPhone(phone) && otpCode === REVIEWER_OTP;

    // Require email confirmation code unless already verified in this flow
    if (!emailOtpVerified && !isReviewer) {
      const { data: emailRows } = await sb
        .from("otp_verifications")
        .select("*")
        .eq("email_normalized", emailNorm)
        .eq("channel", "email")
        .eq("is_verified", true)
        .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1);
      if (!emailRows?.[0]) {
        return json({
          error: "Confirm your email first with the 6-digit code we sent",
          need_email_otp: true,
        }, 400);
      }
    }

    const { data: rows, error: otpErr } = await sb
      .from("otp_verifications")
      .select("*")
      .eq("phone_normalized", phone)
      .eq("is_verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (otpErr) throw otpErr;
    const row = rows?.[0];
    if (!row && !isReviewer) return json({ error: "No valid OTP. Request a new code." }, 400);
    if (row && row.attempts >= 5) {
      return json({ error: "Too many attempts. Request a new code." }, 400);
    }

    if (!isReviewer && row) {
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
    } else if (row) {
      await sb.from("otp_verifications").update({ is_verified: true }).eq("id", row.id);
    }

    // Uniqueness: email / national ID identify people; shop_code identifies shops
    const { data: emailClash } = await sb
      .from("profiles")
      .select("user_id, shop_code, business_name")
      .eq("email_normalized", emailNorm)
      .maybeSingle();

    const digits = phoneDigitsOnly(phone);
    const authEmail = emailNorm; // real email — not synthetic
    const password = `sella_${pin}_${digits.slice(-4)}`;

    if (nationalId) {
      const { data: nidClash } = await sb
        .from("profiles")
        .select("user_id, shop_code")
        .eq("national_id_normalized", nationalId)
        .maybeSingle();
      if (nidClash && (!emailClash || nidClash.user_id !== emailClash.user_id)) {
        // Allow same person re-login; block if ID belongs to another account
        const { data: listedCheck } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingByEmail = listedCheck?.users?.find((u) => u.email === authEmail);
        if (!existingByEmail || existingByEmail.id !== nidClash.user_id) {
          return json({
            error: "This national ID is already linked to another Sella account",
            shop_code: nidClash.shop_code,
          }, 409);
        }
      }
    }

    const { data: listed } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let user = listed?.users?.find(
      (u) =>
        u.email === authEmail ||
        u.phone === phone ||
        u.user_metadata?.phone_normalized === phone ||
        u.user_metadata?.email_normalized === emailNorm
    );

    if (emailClash && user && emailClash.user_id !== user.id) {
      return json({ error: "This email already belongs to another shop account" }, 409);
    }
    if (emailClash && !user) {
      // Recover: email on profile but find auth user by id
      const { data: byId } = await sb.auth.admin.getUserById(emailClash.user_id);
      user = byId.user ?? undefined;
    }

    if (!user) {
      const { data: created, error: createErr } = await sb.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
        phone,
        phone_confirm: true,
        user_metadata: {
          phone,
          phone_normalized: phone,
          email: emailNorm,
          email_normalized: emailNorm,
          business_name: businessName,
          owner_name: ownerName,
          national_id: nationalId,
          pin_length: pin.length,
        },
      });
      if (createErr) throw createErr;
      user = created.user;
    } else {
      await sb.auth.admin.updateUserById(user.id, {
        email: authEmail,
        password,
        email_confirm: true,
        user_metadata: {
          ...user.user_metadata,
          phone,
          phone_normalized: phone,
          email: emailNorm,
          email_normalized: emailNorm,
          business_name: businessName || user.user_metadata?.business_name,
          owner_name: ownerName || user.user_metadata?.owner_name,
          national_id: nationalId || user.user_metadata?.national_id,
          pin_length: pin.length,
        },
      });
    }

    if (!user) throw new Error("User bootstrap failed");

    const { data: existingProfile } = await sb
      .from("profiles")
      .select("shop_code")
      .eq("user_id", user.id)
      .maybeSingle();

    let shopCode = existingProfile?.shop_code || emailClash?.shop_code || null;
    if (!shopCode) {
      const { data: codeRow } = await sb.rpc("generate_shop_code");
      shopCode =
        (typeof codeRow === "string" && codeRow) ||
        `SEL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    const profilePayload: Record<string, unknown> = {
      user_id: user.id,
      business_name: businessName,
      owner_name: ownerName,
      phone,
      phone_normalized: phone,
      email: emailNorm,
      email_normalized: emailNorm,
      email_verified: true,
      national_id: nationalId,
      national_id_normalized: nationalId,
      updated_at: new Date().toISOString(),
    };
    if (!existingProfile?.shop_code) {
      profilePayload.shop_code = shopCode;
    }

    await sb.from("profiles").upsert(profilePayload, { onConflict: "user_id" });

    await sb.from("user_subscriptions").upsert(
      {
        user_id: user.id,
        plan_tier: "trial",
        status: "trialing",
        trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        current_period_end: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

    const { data: sessionData, error: signErr } = await sb.auth.signInWithPassword({
      email: authEmail,
      password,
    });
    if (signErr) throw signErr;

    const { data: profile } = await sb
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const finalCode = profile?.shop_code || shopCode;
    let emailSent = false;
    try {
      emailSent = await sendShopWelcomeEmail(emailNorm, finalCode, businessName, ownerName);
    } catch (e) {
      console.warn(e);
    }

    const { data: subscription } = await sb
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return json({
      success: true,
      access_token: sessionData.session?.access_token,
      refresh_token: sessionData.session?.refresh_token,
      user: sessionData.user,
      profile,
      subscription,
      shop_code: finalCode,
      welcome_email_sent: emailSent,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Verification failed" }, 500);
  }
});
