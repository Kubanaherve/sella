import { useEffect } from "react";
import { COMPANY } from "@/lib/company";
import { canonicalUrl, SITE } from "@/lib/site";
import { getAppLanguage, isRTL } from "@/lib/appLanguage";

type SeoProps = {
  title: string;
  description: string;
  path: string;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function Seo({ title, description, path }: SeoProps) {
  useEffect(() => {
    const url = canonicalUrl(path);
    const activeLang = getAppLanguage();
    document.title = title;
    document.documentElement.lang = activeLang === "zh" ? "zh-Hans" : activeLang;
    document.documentElement.dir = isRTL(activeLang) ? "rtl" : "ltr";
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:site_name", `${SITE.name} · ${COMPANY.legalName}`);
    upsertMeta("name", "twitter:card", "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);

    const verification = String(import.meta.env.VITE_GSC_VERIFICATION || "").trim();
    if (/^[A-Za-z0-9_-]{8,128}$/.test(verification)) {
      upsertMeta("name", "google-site-verification", verification);
    }

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    const scriptId = "sella-jsonld";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url,
      isPartOf: {
        "@type": "WebSite",
        name: SITE.name,
        url: canonicalUrl("/"),
        publisher: {
          "@type": "Organization",
          name: COMPANY.legalName,
          email: COMPANY.businessEmail,
        },
      },
    });
    return () => {
      document.documentElement.lang = previousLang || "rw";
    };
  }, [title, description, path]);

  return null;
}
