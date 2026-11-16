const GA_ID = /^G-[A-Z0-9]+$/;

type Gtag = (...args: unknown[]) => void;

function gtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  const fn = (window as Window & { gtag?: Gtag }).gtag;
  return typeof fn === "function" ? fn : null;
}

/** Loads Google Analytics only when a real measurement ID is configured. */
export function installAnalytics(): void {
  if (typeof document === "undefined") return;
  const id = String(import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
  if (!GA_ID.test(id)) return;
  if (document.getElementById("sella-ga")) return;

  const loader = document.createElement("script");
  loader.id = "sella-ga";
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(loader);

  const inline = document.createElement("script");
  inline.id = "sella-ga-inline";
  inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`;
  document.head.appendChild(inline);
}

/** No-op until Analytics is installed. Does not invent a conversion. */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  const fn = gtag();
  if (!fn) return;
  fn("event", name, params || {});
}
