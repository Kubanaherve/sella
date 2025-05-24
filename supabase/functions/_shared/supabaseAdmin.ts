import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("SB_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
