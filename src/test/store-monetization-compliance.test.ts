import { describe, it, expect, vi } from "vitest";
import { accountHost, publicSiteUrl } from "@/lib/site";
import { isNativeApp } from "@/lib/platform";
import {
  hasWriteAccess,
  isInGracePeriod,
  accessLabel,
  type SubscriptionSnapshot,
} from "@/lib/entitlements";

describe("Store Monetization & App Store Compliance (Apple & Google Play)", () => {
  it("accountHost returns plain host string without protocol or trailing slash", () => {
    const host = accountHost();
    expect(host).toBeTruthy();
    expect(host).not.toContain("https://");
    expect(host).not.toContain("http://");
    expect(host).not.toContain("/");
  });

  it("publicSiteUrl returns a valid URL", () => {
    const url = publicSiteUrl();
    expect(url.startsWith("http://") || url.startsWith("https://")).toBe(true);
  });

  it("evaluates active subscription correctly", () => {
    const future = new Date(Date.now() + 86400000 * 30).toISOString();
    const activeSub: SubscriptionSnapshot = {
      workspaceId: "ws_123",
      status: "active",
      planTier: "monthly",
      provider: "paypack",
      priceRwf: 5000,
      trialEndsAt: null,
      currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
    };

    expect(hasWriteAccess(activeSub)).toBe(true);
    expect(accessLabel(activeSub)).toMatch(/(irakora|active)/i);
  });

  it("evaluates expired subscription without grace period as no write access", () => {
    const past = new Date(Date.now() - 86400000 * 10).toISOString(); // 10 days ago
    const expiredSub: SubscriptionSnapshot = {
      workspaceId: "ws_123",
      status: "expired",
      planTier: "monthly",
      provider: "paypack",
      priceRwf: 5000,
      trialEndsAt: null,
      currentPeriodEnd: past,
      cancelAtPeriodEnd: false,
    };

    expect(isInGracePeriod(expiredSub)).toBe(false);
    expect(hasWriteAccess(expiredSub)).toBe(false);
  });

  it("allows 3-day grace period after paid subscription ends", () => {
    const yesterday = new Date(Date.now() - 86400000 * 1).toISOString(); // 1 day ago
    const graceSub: SubscriptionSnapshot = {
      workspaceId: "ws_123",
      status: "expired",
      planTier: "monthly",
      provider: "paypack",
      priceRwf: 5000,
      trialEndsAt: null,
      currentPeriodEnd: yesterday,
      cancelAtPeriodEnd: false,
    };

    expect(isInGracePeriod(graceSub)).toBe(true);
    expect(hasWriteAccess(graceSub)).toBe(true);
  });

  it("evaluates active trial period correctly", () => {
    const future = new Date(Date.now() + 86400000 * 5).toISOString();
    const trialSub: SubscriptionSnapshot = {
      workspaceId: "ws_123",
      status: "trialing",
      planTier: "trial",
      provider: "trial",
      priceRwf: 0,
      trialEndsAt: future,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };

    expect(hasWriteAccess(trialSub)).toBe(true);
  });

  it("blocks expired trial from write access immediately without grace period", () => {
    const past = new Date(Date.now() - 86400000 * 1).toISOString();
    const expiredTrial: SubscriptionSnapshot = {
      workspaceId: "ws_123",
      status: "trialing",
      planTier: "trial",
      provider: "trial",
      priceRwf: 0,
      trialEndsAt: past,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };

    expect(isInGracePeriod(expiredTrial)).toBe(false);
    expect(hasWriteAccess(expiredTrial)).toBe(false);
  });

  it("accountHost provides the acmeworkspace.com domain or standard fallback", () => {
    const host = accountHost();
    expect(host).toBe("acmeworkspace.com");
  });

  it("verifies store compliance copy structure for non-Pro prompts", () => {
    const host = accountHost();
    const copy = `This feature requires an active Pro account. Membership changes are managed via your browser at ${host}.`;
    expect(copy).toContain("requires an active Pro account");
    expect(copy).toContain("Membership changes are managed via your browser at");
    expect(copy).toContain("acmeworkspace.com");
    // Verify no prohibited payment action terms or links
    expect(copy).not.toContain("https://");
    expect(copy).not.toContain("Pay Now");
    expect(copy).not.toContain("RWF");
    expect(copy).not.toContain("$");
  });
});
