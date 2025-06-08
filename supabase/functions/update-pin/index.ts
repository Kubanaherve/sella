import { corsHeaders, json } from "../_shared/cors.ts";
import { phoneDigitsOnly } from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const auth = req.headers.get("Authorization") || "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const oldPin = String(body.old_pin || "").trim();
    const newPin = String(body.new_pin || "").trim();
    if (!/^\d{4}$/.test(oldPin) || !/^\d{4}$/.test(newPin)) {
      return json({ error: "PIN must be 4 digits" }, 400);
    }

    const sb = adminClient();
    const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { data: profile, error: profErr } = await sb
      .from("profiles")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (profErr) throw profErr;
    if (!profile?.email || !profile.phone_normalized) {
      return json({ error: "Profile incomplete" }, 400);
    }

    const digits = phoneDigitsOnly(profile.phone_normalized);
    const oldPassword = `sella_${oldPin}_${digits.slice(-4)}`;
    const newPassword = `sella_${newPin}_${digits.slice(-4)}`;

    const { error: signErr } = await sb.auth.signInWithPassword({
      email: profile.email,
      password: oldPassword,
    });
    if (signErr) return json({ error: "Current PIN is incorrect" }, 401);

    const { error: updErr } = await sb.auth.admin.updateUserById(userData.user.id, {
      password: newPassword,
    });
    if (updErr) throw updErr;

    return json({ success: true });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Update failed" }, 500);
  }
});
