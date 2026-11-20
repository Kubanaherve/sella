import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertCashierMayLogin,
  assertCashierMaySetPin,
  sessionIdFromAccessToken,
} from "../../supabase/functions/_shared/cashierJoinGuard";

const owner = "owner-a";

describe("cashier roster guard", () => {
  it("refuses to create a cashier from a shop code alone", () => {
    const result = assertCashierMaySetPin(null, owner);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.status).toBe(403);
  });

  it("refuses to reactivate a deactivated cashier or reset an existing PIN", () => {
    const deactivated = assertCashierMaySetPin(
      { id: "s1", status: "deactivated", auth_user_id: null, owner_id: owner },
      owner
    );
    expect(deactivated.ok).toBe(false);

    const alreadyBound = assertCashierMaySetPin(
      { id: "s1", status: "active", auth_user_id: "user-1", owner_id: owner },
      owner
    );
    expect(alreadyBound.ok).toBe(false);
    if (alreadyBound.ok === false) expect(alreadyBound.status).toBe(409);
  });

  it("allows the first PIN only for an active roster row in that shop", () => {
    expect(
      assertCashierMaySetPin(
        { id: "s1", status: "active", auth_user_id: null, owner_id: owner },
        owner
      )
    ).toEqual({ ok: true });
    const otherShop = assertCashierMaySetPin(
      { id: "s1", status: "active", auth_user_id: null, owner_id: "owner-b" },
      owner
    );
    expect(otherShop.ok).toBe(false);
  });

  it("rejects login when the cashier is missing or deactivated", () => {
    expect(assertCashierMayLogin(null, owner).ok).toBe(false);
    expect(
      assertCashierMayLogin(
        { id: "s1", status: "deactivated", owner_id: owner },
        owner
      ).ok
    ).toBe(false);
  });

  it("reads only a real session id from an access token", () => {
    const payload = btoa(JSON.stringify({ session_id: "sess-1" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    expect(sessionIdFromAccessToken(`aaa.${payload}.sig`)).toBe("sess-1");
    expect(sessionIdFromAccessToken("not-a-token")).toBeNull();
    expect(sessionIdFromAccessToken(null)).toBeNull();
  });
});

describe("cashier authorization migration", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20261119230000_cashier_shop_access.sql"),
    "utf8"
  );

  it("does not give cashiers direct write policies", () => {
    expect(sql).not.toMatch(/FOR ALL[\s\S]{0,80}sella_tenant_owner_id/);
    expect(sql).toMatch(/CREATE POLICY debts_cashier_read/);
    expect(sql).not.toMatch(/CREATE POLICY debts_delete/);
    expect(sql).not.toMatch(/phone_normalized IN/);
    expect(sql).not.toMatch(/cashier_name', ''/);
  });

  it("binds access to the current auth session and a real auth user", () => {
    expect(sql).toMatch(/current_session_id/);
    expect(sql).toMatch(/session_id/);
    expect(sql).toMatch(/EXISTS \(SELECT 1 FROM auth\.users/);
    expect(sql).not.toMatch(/to_timestamp/);
    expect(sql).toMatch(/SET search_path = pg_catalog, public, pg_temp/);
  });

  it("keeps cashier prices and names on the server", () => {
    expect(sql).toMatch(/IF v_cashier IS NOT NULL THEN\s+v_discount := 0;/);
    expect(sql).toMatch(/cashier_user_id, created_at/);
    expect(sql).toMatch(/FOR UPDATE;/);
  });
});
