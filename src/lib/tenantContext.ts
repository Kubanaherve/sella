import { getSupabase } from "@/integrations/supabase/client";
import { resolveTenantOwner } from "@/lib/tenantAccess";

type Cached = { actorId: string; ownerId: string };

let cached: Cached | null = null;

export function clearTenantContext() {
  cached = null;
}

/** Owner id that shop rows are stored under. Fails closed for a cashier if the server mapping is missing. */
export async function tenantOwnerId(): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) throw new Error("Not signed in");
  const actorId = data.user.id;
  if (cached?.actorId === actorId) return cached.ownerId;

  const rpc = await sb.rpc("sella_tenant_owner_id");
  const missing =
    !!rpc.error &&
    /could not find the function|schema cache|PGRST202/i.test(rpc.error.message || "");
  if (rpc.error && !missing) throw new Error(rpc.error.message);
  const appMeta = data.user.app_metadata as { role?: unknown } | undefined;
  const resolved = resolveTenantOwner({
    actorId,
    rpcOwnerId: missing ? null : (rpc.data as string | null),
    rpcMissing: missing,
    metadataRole:
      typeof data.user.user_metadata?.role === "string"
        ? data.user.user_metadata.role
        : null,
    appRole: typeof appMeta?.role === "string" ? appMeta.role : null,
    email: data.user.email ?? null,
  });
  if (resolved.ok === false) {
    if (resolved.reason === "cashier-server-not-ready") {
      throw new Error("Cashier access is not enabled on the server yet");
    }
    throw new Error("No shop access");
  }
  cached = { actorId, ownerId: resolved.ownerId };
  return resolved.ownerId;
}
