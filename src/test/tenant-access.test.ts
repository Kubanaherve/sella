import { describe, expect, it } from "vitest";
import { resolveTenantOwner } from "@/lib/tenantAccess";

describe("tenant owner resolution", () => {
  it("keeps an owner on their own id when the mapping function is not deployed", () => {
    const result = resolveTenantOwner({
      actorId: "owner-a",
      rpcOwnerId: null,
      rpcMissing: true,
      metadataRole: null,
    });
    expect(result).toEqual({ ok: true, ownerId: "owner-a", kind: "owner" });
  });

  it("fails closed for a staff email even after the editable role claim is removed", () => {
    const result = resolveTenantOwner({
      actorId: "cashier-a",
      rpcOwnerId: null,
      rpcMissing: true,
      metadataRole: null,
      email: "staff.250780000001.selmxa8tt@staff.sella.app",
    });
    expect(result).toEqual({ ok: false, reason: "cashier-server-not-ready" });
  });

  it("fails closed when the server role claim says cashier", () => {
    const result = resolveTenantOwner({
      actorId: "cashier-a",
      rpcOwnerId: null,
      rpcMissing: true,
      metadataRole: "owner",
      appRole: "cashier",
      email: "person@example.com",
    });
    expect(result).toEqual({ ok: false, reason: "cashier-server-not-ready" });
  });

  it("does not let a cashier guess a shop from metadata when the server function is missing", () => {
    const result = resolveTenantOwner({
      actorId: "cashier-a",
      rpcOwnerId: null,
      rpcMissing: true,
      metadataRole: "cashier",
    });
    expect(result).toEqual({ ok: false, reason: "cashier-server-not-ready" });
  });

  it("uses the server owner id for a cashier and ignores a different actor id", () => {
    const result = resolveTenantOwner({
      actorId: "cashier-a",
      rpcOwnerId: "owner-a",
      rpcMissing: false,
      metadataRole: "cashier",
    });
    expect(result).toEqual({ ok: true, ownerId: "owner-a", kind: "cashier" });
  });

  it("refuses a cashier when the server says they have no shop", () => {
    const result = resolveTenantOwner({
      actorId: "cashier-a",
      rpcOwnerId: null,
      rpcMissing: false,
    });
    expect(result).toEqual({ ok: false, reason: "no-shop-access" });
  });
});