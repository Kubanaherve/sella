import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { planCashierSession } from "@/lib/cashierSession";

describe("cashier session plan", () => {
  it("applies a complete staff session", () => {
    expect(
      planCashierSession({ access_token: "a", refresh_token: "r" })
    ).toBe("apply-staff-session");
  });

  it("clears any previous cloud session when logging in offline", () => {
    expect(planCashierSession({})).toBe("offline-without-cloud-session");
  });

  it("rejects a half-issued session", () => {
    expect(() => planCashierSession({ access_token: "a" })).toThrow(
      /Incomplete staff session/
    );
  });

  it("cashier PIN rate limit fails closed in the edge function", () => {
    const src = readFileSync(
      resolve(process.cwd(), "supabase/functions/cashier-pin-login/index.ts"),
      "utf8"
    );
    expect(src).not.toMatch(/ignore rate limit rpc errors/);
    expect(src).toMatch(/if \(rateErr\)/);
    expect(src).toMatch(/503/);
  });
});