import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const name = String(body.business_name || "").trim();
    if (!name) return json({ available: false, error: "Name required" }, 400);

    const sb = adminClient();
    const { data } = await sb
      .from("profiles")
      .select("business_name, shop_code")
      .ilike("business_name", name)
      .limit(50);

    const taken = (data || []).some(
      (p) => String(p.business_name).trim().toLowerCase() === name.toLowerCase()
    );
    return json({ available: !taken, business_name: name });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Check failed" }, 500);
  }
});
