import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudMode = () =>
  (import.meta.env.VITE_DATA_MODE || "local") === "cloud";

export const hasSupabaseConfig = () =>
  Boolean(
    url &&
      anon &&
      !url.includes("YOUR_PROJECT") &&
      !anon.includes("YOUR_SUPABASE") &&
      anon.length > 20
  );

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, and VITE_DATA_MODE=cloud."
    );
  }
  if (!client) {
    client = createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
      },
    });
  }
  return client;
}

/** Legacy import path — prefer getSupabase() in new code. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const c = getSupabase();
    const value = (c as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(c) : value;
  },
});
