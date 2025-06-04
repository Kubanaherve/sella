import { corsHeaders, json } from "../_shared/cors.ts";
import { normalizePhoneE164, phoneDigitsOnly } from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

function normalizeEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

async function sendWelcomeEmail(input: {
  to: string;
  ownerName: string;
  businessName: string;
  phone: string;
  shopCode: string;
}) {
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";
  const from = Deno.env.get("EMAIL_FROM") || "Sella <onboarding@resend.dev>";
  const subject = `Sella — ${input.businessName} is ready (${input.shopCode})`;
  const text = [
    `Muraho ${input.ownerName || ""}!`,
    "",
    `Thank you for registering your shop on Sella.`,
    "",
    `Shop name: ${input.businessName}`,
    `Phone: ${input.phone}`,
    `Email: ${input.to}`,
    `Shop code: ${input.shopCode}`,
    "",
    `Next time, open Sella and sign in with your phone number + your 4-digit PIN only.`,
    "",
    `— Sella`,
  ].join("\n");
  const html = `
    <h2>Thank you for using Sella</h2>
    <p>Muraho <strong>${input.ownerName || ""}</strong>!</p>
    <p>Your shop is ready.</p>
    <ul>
      <li><strong>Shop name:</strong> ${input.businessName}</li>
      <li><strong>Phone:</strong> ${input.phone}</li>
      <li><strong>Email:</strong> ${input.to}</li>
      <li><strong>Shop code:</strong> <span style="font-size:20px;letter-spacing:2px">${input.shopCode}</span></li>
    </ul>
    <p>Next time sign in with <strong>phone + 4-digit PIN</strong> only.</p>
  `;

  if (!resendKey) {
    console.log("RESEND_API_KEY not set — welcome email skipped", input.to, input.shopCode);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [input.to], subject, text, html }),
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
    const businessName = String(body.business_name || "").trim();
    const ownerName = String(body.owner_name || "").trim();
    const email = normalizeEmail(String(body.email || ""));
    const phone = normalizePhoneE164(String(body.phone || ""));
    const pin = String(body.pin || "").trim();

    if (!businessName || businessName.length < 2) {
      return json({ error: "Shop name is required" }, 400);
    }
    if (!ownerName) return json({ error: "Owner name is required" }, 400);
    if (!email) return json({ error: "Valid email is required" }, 400);
    if (!phone) return json({ error: "Valid Rwanda phone is required" }, 400);
    if (!/^\d{4}$/.test(pin)) return json({ error: "PIN must be exactly 4 digits" }, 400);

    const sb = adminClient();

    // Shop name must be unique
    const { data: nameTaken } = await sb
      .from("profiles")
      .select("shop_code, business_name")
      .ilike("business_name", businessName)
      .limit(20);
    const clash = (nameTaken || []).find(
      (p) => String(p.business_name).trim().toLowerCase() === businessName.toLowerCase()
    );
    if (clash) {
      return json({
        error: "This shop name is already taken. Choose another name.",
        code: "SHOP_NAME_TAKEN",
      }, 409);
    }

    // Email / phone uniqueness
    const { data: emailClash } = await sb
      .from("profiles")
      .select("user_id")
      .eq("email_normalized", email)
      .maybeSingle();
    if (emailClash) {
      return json({ error: "This email is already registered. Sign in with phone + PIN." }, 409);
    }
    const { data: phoneClash } = await sb
      .from("profiles")
      .select("user_id")
      .eq("phone_normalized", phone)
      .maybeSingle();
    if (phoneClash) {
      return json({ error: "This phone is already registered. Sign in with phone + PIN." }, 409);
    }

    const digits = phoneDigitsOnly(phone);
    const password = `sella_${pin}_${digits.slice(-4)}`;

    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone,
      phone_confirm: true,
      user_metadata: {
        phone,
        phone_normalized: phone,
        email,
        email_normalized: email,
        business_name: businessName,
        owner_name: ownerName,
        pin_length: 4,
      },
    });
    if (createErr) throw createErr;
    const user = created.user;
    if (!user) throw new Error("User create failed");

    const { data: codeRow } = await sb.rpc("generate_shop_code");
    const shopCode =
      (typeof codeRow === "string" && codeRow) ||
      `SEL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { data: profile, error: profErr } = await sb
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          business_name: businessName,
          owner_name: ownerName,
          phone,
          phone_normalized: phone,
          email,
          email_normalized: email,
          email_verified: true,
          shop_code: shopCode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();
    if (profErr) throw profErr;

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

    const emailSent = await sendWelcomeEmail({
      to: email,
      ownerName,
      businessName,
      phone,
      shopCode: profile.shop_code || shopCode,
    });

    const { data: sessionData, error: signErr } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    if (signErr) throw signErr;

    return json({
      success: true,
      access_token: sessionData.session?.access_token,
      refresh_token: sessionData.session?.refresh_token,
      profile,
      shop_code: profile.shop_code || shopCode,
      phone,
      email,
      business_name: businessName,
      owner_name: ownerName,
      welcome_email_sent: emailSent,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Registration failed" }, 500);
  }
});
