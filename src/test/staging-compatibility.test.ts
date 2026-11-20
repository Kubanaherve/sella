import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { hasWriteAccess } from "@/lib/entitlements";
import {
  isCashierIdentity,
  profileFromShopLookup,
  subscriptionFromWriteAccess,
} from "@/lib/cashierShop";
import { deleteAuthUserSessions } from "../../supabase/functions/_shared/cashierPinRotation";

const oldColumns = [
  "id",
  "shop_code",
  "owner_id",
  "name",
  "phone",
  "phone_normalized",
  "role",
  "status",
  "pin_hash",
  "last_active_at",
  "session_revoked_at",
  "created_at",
  "updated_at",
];

const newColumns = [...oldColumns, "auth_user_id", "current_session_id"];
const newSelectable = newColumns.filter((column) => column !== "pin_hash");
const newInsertable = [
  "id",
  "owner_id",
  "shop_code",
  "name",
  "phone",
  "phone_normalized",
  "role",
  "status",
  "created_at",
  "updated_at",
];
const newUpdatable = [
  "name",
  "phone",
  "phone_normalized",
  "role",
  "status",
  "last_active_at",
  "session_revoked_at",
  "updated_at",
];

function queryResult(
  requested: string[] | "*",
  columns: string[],
  allowed: string[]
): "ok" | "missing-column" | "permission-denied" {
  const list = requested === "*" ? columns : requested;
  if (list.some((column) => !columns.includes(column))) return "missing-column";
  if (list.some((column) => !allowed.includes(column))) return "permission-denied";
  return "ok";
}

function staffSource() {
  return readFileSync(resolve(process.cwd(), "src/lib/staff.ts"), "utf8");
}

describe("shop_staff query compatibility", () => {
  const src = staffSource();
  const selectMatch = src.match(/from\("shop_staff"\)\s*\.select\(\s*"([^"]+)"/);
  const selectColumns = selectMatch?.[1].split(",").map((part) => part.trim()) ?? [];

  it("updated staff list uses only columns that exist before and after the migration", () => {
    expect(selectColumns.length).toBeGreaterThan(0);
    expect(selectColumns).not.toContain("pin_hash");
    expect(selectColumns).not.toContain("current_session_id");
    expect(selectColumns).not.toContain("auth_user_id");
    expect(queryResult(selectColumns, oldColumns, oldColumns)).toBe("ok");
    expect(queryResult(selectColumns, newColumns, newSelectable)).toBe("ok");
  });

  it("previous select * works on the old database and fails after pin_hash is hidden", () => {
    expect(queryResult("*", oldColumns, oldColumns)).toBe("ok");
    expect(queryResult("*", newColumns, newSelectable)).toBe("permission-denied");
  });

  it("owner writes from this frontend stay inside the new column grants and the old table", () => {
    const insertKeys = [
      "id",
      "shop_code",
      "owner_id",
      "name",
      "phone",
      "phone_normalized",
      "role",
      "status",
      "created_at",
      "updated_at",
    ];
    const updateKeys = ["status", "updated_at", "session_revoked_at"];
    expect(queryResult(insertKeys, oldColumns, newInsertable)).toBe("ok");
    expect(queryResult(updateKeys, oldColumns, newUpdatable)).toBe("ok");
    expect(src).not.toMatch(/from\("shop_staff"\)[\s\S]{0,180}pin_hash/);
  });
});

describe("cashier shop summary", () => {
  it("does not copy owner phone, email, or national id", () => {
    const profile = profileFromShopLookup(
      {
        business_name: "Demo Jewel",
        owner_name: "Owner A",
        owner_id: "owner-a",
        shop_code: "SEL-MXA8TT",
        has_write_access: true,
      },
      "SEL-MXA8TT",
      "cashier-a"
    );
    expect(profile.business_name).toBe("Demo Jewel");
    expect(profile.shop_code).toBe("SEL-MXA8TT");
    expect(profile.phone).toBe("");
    expect(profile).not.toHaveProperty("national_id");
    expect(profile).not.toHaveProperty("email");
    expect(isCashierIdentity({ email: "a@staff.sella.app", appRole: null })).toBe(true);
    expect(isCashierIdentity({ email: "owner@shop.rw", appRole: null })).toBe(false);
  });

  it("turns the public write flag into a subscription gate without billing dates from the table", () => {
    const now = new Date("2026-11-19T12:00:00.000Z");
    const open = subscriptionFromWriteAccess("owner-a", true, now);
    const closed = subscriptionFromWriteAccess("owner-a", false, now);
    expect(hasWriteAccess(open, now)).toBe(true);
    expect(hasWriteAccess(closed, now)).toBe(false);
    expect(open.priceRwf).toBe(0);
    expect(open.provider).toBe("manual");
  });
});

describe("GoTrue session revocation", () => {
  it("signs in as the cashier and logs out globally, and does not call a sessions admin route", async () => {
    const calls: { url: string; method: string; auth?: string }[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      calls.push({
        url,
        method: init?.method || "GET",
        auth: headers.get("Authorization") || undefined,
      });
      if (String(url).includes("/token?")) {
        return new Response(JSON.stringify({ access_token: "fresh-access" }), { status: 200 });
      }
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    await deleteAuthUserSessions(
      "https://example.supabase.co",
      "server-key",
      "staff.250788111222.selmxa8tt@staff.sella.app",
      "sella_staff_2222_1222",
      fetchImpl
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST https://example.supabase.co/auth/v1/token?grant_type=password",
      "POST https://example.supabase.co/auth/v1/logout?scope=global",
    ]);
    expect(calls[1].auth).toBe("Bearer fresh-access");
    expect(calls.some((call) => call.url.includes("/admin/users/"))).toBe(false);
  });

  it("does not report success when global logout is rejected", async () => {
    const fetchImpl = (async (url: string) => {
      if (String(url).includes("/token?")) {
        return new Response(JSON.stringify({ access_token: "fresh-access" }), { status: 200 });
      }
      return new Response("no", { status: 401 });
    }) as typeof fetch;
    await expect(
      deleteAuthUserSessions("https://example.supabase.co", "server-key", "a@staff.sella.app", "pw", fetchImpl)
    ).rejects.toThrow(/session revoke failed/);
  });
});
