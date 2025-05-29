import { corsHeaders, json } from "../_shared/cors.ts";
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

    const userId = userData.user.id;
    const sb = adminClient();

    const tables = [
      "debt_items",
      "payments",
      "sales",
      "debts",
      "clients",
      "inventory_items",
      "app_settings",
      "subscription_payments",
      "user_subscriptions",
      "profiles",
    ];

    for (const table of tables) {
      await sb.from(table).delete().eq("user_id", userId);
    }

    // storage receipts
    try {
      const { data: files } = await sb.storage.from("receipts").list(userId);
      if (files?.length) {
        await sb.storage
          .from("receipts")
          .remove(files.map((f) => `${userId}/${f.name}`));
      }
    } catch (e) {
      console.warn("receipt cleanup", e);
    }

    const { error: delErr } = await sb.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return json({ success: true, message: "Account and all data deleted" });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Delete failed" }, 500);
  }
});
