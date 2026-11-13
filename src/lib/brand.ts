/** Single source of truth for product branding. */
export const BRAND = {
  name: "Sella",
  shortName: "Sella",
  legalName: "Sella",
  tagline: "Smarter. Faster. Together.",
  taglineRw: "Ubucuruzi bwawe — igurisha, stock n'ideni",
  /** Legacy product line used in marketing copy outside PDFs */
  taglineProduct: "Sales, stock & credit for your business",
  /** Block letter SVG used on glass PDFs */
  publicWordmark: "/brand/sella-wordmark.svg",
  /** Handwritten glass-bold script wordmark */
  publicGlassScript: "/brand/sella-glass-script.png",
  publicGlassScriptHero: "/brand/sella-glass-script-hero.jpg",
  publicGlassAmbient: "/brand/sella-glass-ambient.jpg",
  publicGlassLockup: "/brand/sella-glass-lockup.jpg",
  /** Mission-led splash foundation (local; generated for Sella) */
  publicSplashFoundation: "/brand/sella-splash-foundation.jpg",
  /** Liquid-glass cursive wordmark for splash write animation */
  publicLiquidGlassScript: "/brand/sella-liquid-glass-script.png",
  description: "Gukurikirana amadeni, igurisha n'ibicuruzwa bya business yawe",
  appId: "com.sella.app",
  bundleId: "com.sella.app",
  localDbName: "sella_local",
  storagePrefix: "sella_",
  /** In-app shop assistant nickname */
  assistantName: "ChatSella",
  assistantCta: "Ask ChatSella",
  /** Paths under /public/brand — exact official assets */
  publicIcon: "/brand/sella-icon.png",
  publicLogo: "/brand/sella-logo.png",
  colors: {
    /** Match glossy neon S-bag icon */
    blue: "#1A6FFF",
    blueDeep: "#0B3FCC",
    ink: "#040816",
    sand: "#F3F7FF",
    accent: "#3B82F6",
    neonCyan: "#5AC8FA",
    neonMagenta: "#D033FF",
    heroFrom: "#0B3FCC",
    heroTo: "#1A6FFF",
  },
} as const;
