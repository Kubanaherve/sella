/**
 * Shop data is stored under the owner's user id.
 * A cashier's own auth id is never that id. The database function
 * sella_tenant_owner_id() is the only mapping that counts.
 * Metadata is not trusted: a user can edit their own user_metadata.
 */
export type TenantResolution =
  | { ok: true; ownerId: string; kind: "owner" | "cashier" }
  | { ok: false; reason: "signed-out" | "no-shop-access" | "cashier-server-not-ready" };

export function isStaffIdentity(input: {
  metadataRole?: string | null;
  appRole?: string | null;
  email?: string | null;
}): boolean {
  if (input.metadataRole === "cashier" || input.appRole === "cashier") return true;
  return (input.email ?? "").toLowerCase().endsWith("@staff.sella.app");
}

export function resolveTenantOwner(input: {
  actorId: string | null;
  rpcOwnerId: string | null;
  rpcMissing: boolean;
  metadataRole?: string | null;
  appRole?: string | null;
  email?: string | null;
}): TenantResolution {
  if (!input.actorId) return { ok: false, reason: "signed-out" };
  if (input.rpcMissing) {
    // user_metadata.role can be edited by the user. The staff email and
    // app_metadata role cannot, so either one is enough to fail closed.
    if (isStaffIdentity(input)) {
      return { ok: false, reason: "cashier-server-not-ready" };
    }
    return { ok: true, ownerId: input.actorId, kind: "owner" };
  }
  if (!input.rpcOwnerId) return { ok: false, reason: "no-shop-access" };
  return {
    ok: true,
    ownerId: input.rpcOwnerId,
    kind: input.rpcOwnerId === input.actorId ? "owner" : "cashier",
  };
}
