import { corsHeaders, json } from "../_shared/cors.ts";
import { normalizePhoneE164 } from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return json({ error: "Unauthorized" }, 401);

    const sb = adminClient();
    const { data: profile } = await sb
      .from("profiles")
      .select("is_superadmin")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!profile?.is_superadmin) return json({ error: "Forbidden: Superadmin only" }, 403);

    const body = await req.json();
    const phone = normalizePhoneE164(String(body.phone || ""));
    if (!phone) return json({ error: "Valid phone required" }, 400);

    const { error: delErr } = await sb
      .from("auth_rate_limits")
      .delete()
      .in("bucket_key", [`pin:${phone}`, `reset-pin:${phone}`]);

    if (delErr) throw delErr;

    return json({ success: true, message: `Rate limits cleared for ${phone}` });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Failed to clear rate limit" }, 500);
  }
});
