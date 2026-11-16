/**
 * One catalog for the download center.
 * A platform is downloadable only when an https URL is configured.
 * Empty, http, and script URLs stay "coming soon" — never a fake store link.
 */

export type PlatformId = "ios" | "android" | "macos" | "windows" | "web";

export type PlatformStatus = "available" | "coming_soon";

export type PlatformEnv = {
  ios?: string;
  android?: string;
  macos?: string;
  windows?: string;
};

export type PlatformOffer = {
  id: PlatformId;
  name: string;
  store: string;
  blurb: string;
  status: PlatformStatus;
  /** Official https URL, or the in-app web route. Null when unpublished. */
  href: string | null;
  action: string;
  recommended: boolean;
};

const ORDER: PlatformId[] = ["ios", "android", "macos", "windows", "web"];

const COPY: Record<PlatformId, { name: string; store: string; blurb: string; action: string }> = {
  ios: {
    name: "iPhone and iPad",
    store: "App Store",
    blurb: "Native shell for iPhone and iPad. Same Sella account as the web app.",
    action: "View on the App Store",
  },
  android: {
    name: "Android",
    store: "Google Play",
    blurb: "Android app for the counter. Same shop, PIN, and subscription.",
    action: "View on Google Play",
  },
  macos: {
    name: "macOS",
    store: "Download for Mac",
    blurb: "Desktop window for Mac. Installer published only after a signed build.",
    action: "Download for Mac",
  },
  windows: {
    name: "Windows",
    store: "Download for Windows",
    blurb: "Desktop window for Windows. Installer published only after a signed build.",
    action: "Download for Windows",
  },
  web: {
    name: "Web",
    store: "Open Web Application",
    blurb: "Use Sella in the browser on a computer, tablet, or phone. This build is live.",
    action: "Open Web Application",
  },
};

export function officialHttpsUrl(raw: string | undefined | null): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  return url.toString();
}

export function detectVisitorPlatform(userAgent: string, platform = ""): PlatformId {
  const haystack = `${userAgent} ${platform}`;
  if (/iPad|iPhone|iPod/.test(haystack)) return "ios";
  if (/Android/i.test(haystack)) return "android";
  if (/Windows|Win32|Win64/i.test(haystack)) return "windows";
  if (/Macintosh|Mac OS X/i.test(haystack)) return "macos";
  return "web";
}

export function resolvePlatformCatalog(env: PlatformEnv, visitor: PlatformId): PlatformOffer[] {
  const links: Record<Exclude<PlatformId, "web">, string | null> = {
    ios: officialHttpsUrl(env.ios),
    android: officialHttpsUrl(env.android),
    macos: officialHttpsUrl(env.macos),
    windows: officialHttpsUrl(env.windows),
  };

  return ORDER.map((id) => {
    const copy = COPY[id];
    if (id === "web") {
      return {
        id,
        ...copy,
        status: "available",
        href: "/login",
        recommended: visitor === "web",
      };
    }
    const href = links[id];
    return {
      id,
      ...copy,
      status: href ? "available" : "coming_soon",
      href,
      action: href ? copy.action : "Coming soon",
      recommended: visitor === id,
    };
  });
}

export function platformEnvFromImportMeta(env: {
  VITE_IOS_APP_STORE_URL?: string;
  VITE_ANDROID_PLAY_STORE_URL?: string;
  VITE_MACOS_DOWNLOAD_URL?: string;
  VITE_WINDOWS_DOWNLOAD_URL?: string;
}): PlatformEnv {
  return {
    ios: env.VITE_IOS_APP_STORE_URL,
    android: env.VITE_ANDROID_PLAY_STORE_URL,
    macos: env.VITE_MACOS_DOWNLOAD_URL,
    windows: env.VITE_WINDOWS_DOWNLOAD_URL,
  };
}
