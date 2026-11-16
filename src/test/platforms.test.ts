import { describe, expect, it } from "vitest";
import {
  detectVisitorPlatform,
  officialHttpsUrl,
  resolvePlatformCatalog,
} from "@/lib/platforms";
import { MARKETING_PATHS, isMarketingPath } from "@/lib/site";

describe("platform catalog", () => {
  it("rejects missing, insecure, and script URLs", () => {
    expect(officialHttpsUrl("")).toBeNull();
    expect(officialHttpsUrl("http://apps.apple.com/app/id1")).toBeNull();
    expect(officialHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(officialHttpsUrl("https://user:pass@apps.apple.com/app")).toBeNull();
    expect(officialHttpsUrl("https://apps.apple.com/app/sella")).toBe("https://apps.apple.com/app/sella");
  });

  it("keeps unpublished native apps in a coming-soon state", () => {
    const offers = resolvePlatformCatalog({}, "android");
    const android = offers.find((offer) => offer.id === "android");
    const web = offers.find((offer) => offer.id === "web");
    expect(android).toMatchObject({ status: "coming_soon", href: null, recommended: true });
    expect(web).toMatchObject({ status: "available", href: "/login", recommended: false });
    expect(offers.filter((offer) => offer.id !== "web").every((offer) => offer.href === null)).toBe(true);
  });

  it("publishes only the platform with an official https link", () => {
    const offers = resolvePlatformCatalog(
      { ios: "https://apps.apple.com/app/id123", android: "not a url" },
      "ios"
    );
    expect(offers.find((offer) => offer.id === "ios")).toMatchObject({
      status: "available",
      href: "https://apps.apple.com/app/id123",
      recommended: true,
    });
    expect(offers.find((offer) => offer.id === "android")?.status).toBe("coming_soon");
  });

  it("detects the visitor platform without hiding the other choices", () => {
    expect(detectVisitorPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe("ios");
    expect(detectVisitorPlatform("Mozilla/5.0 (Linux; Android 14)")).toBe("android");
    expect(detectVisitorPlatform("Mozilla/5.0 (Windows NT 10.0)")).toBe("windows");
    expect(detectVisitorPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe("macos");
    expect(detectVisitorPlatform("Mozilla/5.0 (X11; Linux x86_64)")).toBe("web");
    expect(resolvePlatformCatalog({}, "macos")).toHaveLength(5);
  });
});

describe("marketing routes", () => {
  it("lists the public commercial pages", () => {
    expect(MARKETING_PATHS).toEqual([
      "/features",
      "/benefits",
      "/how-it-works",
      "/pricing",
      "/download",
      "/about",
      "/contact",
      "/support",
      "/faq",
    ]);
    expect(isMarketingPath("/download")).toBe(true);
    expect(isMarketingPath("/dashboard")).toBe(false);
  });
});
