/**
 * Sella motion system — shared timings & easing.
 * Prefer transform/opacity only. Respect prefers-reduced-motion at call sites.
 */

export const MOTION_EASE = "cubic-bezier(0.22, 1, 0.36, 1)" as const;

/** Target durations (ms) */
export const MOTION = {
  micro: 150,
  button: 140,
  nav: 220,
  card: 240,
  modal: 200,
  splashMax: 2800,
  splashExit: 360,
} as const;

export const MOTION_CSS = {
  ease: MOTION_EASE,
  micro: `${MOTION.micro}ms`,
  button: `${MOTION.button}ms`,
  nav: `${MOTION.nav}ms`,
  card: `${MOTION.card}ms`,
  modal: `${MOTION.modal}ms`,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Splash sequence (ms from mount):
 * write sella → bar → fade word → logo in → bar fade → out
 */
export const SPLASH_TIMING = {
  writeStart: 180,
  writeEnd: 1350,
  barDone: 1700,
  wordOut: 1550,
  logoIn: 1680,
  barFade: 2100,
  tagline: 2200,
  exitStart: 2450,
  done: 2780,
} as const;
