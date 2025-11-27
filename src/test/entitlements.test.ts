import { describe, expect, it } from "vitest";
import { computeNextPeriodEnd, hasWriteAccess, type SubscriptionSnapshot } from "@/lib/entitlements";

const base: SubscriptionSnapshot = {
  workspaceId: "w1",
  status: "trialing",
  provider: "trial",
  priceRwf: 50000,
  trialEndsAt: "2099-01-01T00:00:00.000Z",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

describe("entitlements", () => {
  it("allows write during active trial", () => {
    expect(hasWriteAccess(base)).toBe(true);
  });

  it("denies write after trial expiry but snapshot still readable", () => {
    const expired = { ...base, trialEndsAt: "2020-01-01T00:00:00.000Z", status: "expired" as const };
    expect(hasWriteAccess(expired)).toBe(false);
  });

  it("preserves unused paid time on early renewal", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    const end = computeNextPeriodEnd({
      now,
      currentPeriodEnd: "2026-01-20T00:00:00.000Z",
      months: 1,
    });
    expect(end.toISOString().startsWith("2026-02-20")).toBe(true);
  });

  it("starts paid month from payment date when expired", () => {
    const now = new Date("2026-02-01T00:00:00.000Z");
    const end = computeNextPeriodEnd({
      now,
      currentPeriodEnd: "2026-01-01T00:00:00.000Z",
      months: 1,
    });
    expect(end.toISOString().startsWith("2026-03-01")).toBe(true);
  });
});
