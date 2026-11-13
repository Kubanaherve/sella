/**
 * Official Sella glass + solid SVG pack (public/brand/sella-brand).
 * Pick finish from the surface behind the artwork, not only device theme.
 */

export type SellaBrandKind =
  | "horizontal"
  | "stacked"
  | "mark"
  | "wordmark"
  | "signature"
  | "tile"
  | "micro";

export type SellaBrandFinish =
  | "glass-light"
  | "glass-dark"
  | "black"
  | "white"
  | "current";

const BASE = "/brand/sella-brand/assets";

const FILE: Record<string, string> = {
  "horizontal-glass-light": "sella-horizontal-glass-light.svg",
  "horizontal-glass-dark": "sella-horizontal-glass-dark.svg",
  "horizontal-black": "sella-horizontal-black.svg",
  "horizontal-white": "sella-horizontal-white.svg",
  "stacked-glass-light": "sella-stacked-glass-light.svg",
  "stacked-glass-dark": "sella-stacked-glass-dark.svg",
  "stacked-black": "sella-stacked-black.svg",
  "stacked-white": "sella-stacked-white.svg",
  "mark-glass-light": "sella-mark-glass-light.svg",
  "mark-glass-dark": "sella-mark-glass-dark.svg",
  "mark-black": "sella-mark-black.svg",
  "mark-white": "sella-mark-white.svg",
  "wordmark-glass-light": "sella-wordmark-glass-light.svg",
  "wordmark-glass-dark": "sella-wordmark-glass-dark.svg",
  "wordmark-black": "sella-wordmark-black.svg",
  "wordmark-white": "sella-wordmark-white.svg",
  "signature-glass-light": "sella-signature-glass-light.svg",
  "signature-glass-dark": "sella-signature-glass-dark.svg",
  "signature-black": "sella-signature-black.svg",
  "signature-white": "sella-signature-white.svg",
  "tile-glass-light": "sella-tile-glass-light.svg",
  "tile-glass-dark": "sella-tile-glass-dark.svg",
  "tile-black": "sella-tile-black.svg",
  "tile-white": "sella-tile-white.svg",
  "micro-black": "sella-micro-black.svg",
  "micro-white": "sella-micro-white.svg",
  "micro-current": "sella-micro-current.svg",
};

export function sellaBrandSrc(
  kind: SellaBrandKind,
  finish: SellaBrandFinish = "glass-light"
): string {
  if (kind === "micro") {
    const key =
      finish === "white"
        ? "micro-white"
        : finish === "current"
          ? "micro-current"
          : "micro-black";
    return `${BASE}/${FILE[key]}`;
  }
  const key = `${kind}-${finish}` as keyof typeof FILE;
  const file = FILE[key] ?? FILE[`${kind}-glass-light`];
  return `${BASE}/${file}`;
}

/** Prefer glass-light on pale/blue surfaces; glass-dark on midnight. */
export function sellaGlassFinish(surface: "light" | "dark"): "glass-light" | "glass-dark" {
  return surface === "dark" ? "glass-dark" : "glass-light";
}
