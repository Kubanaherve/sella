# Sella premium motion — technical audit (Phase 1)

**Date:** 2026-11-13  
**Constraint:** Preserve existing blue glass brand (`#0B3FCC` / `#1A6FFF` / `#5AC8FA`). No palette redesign.

## Existing assets & theme

| Item | Location | Notes |
|------|----------|--------|
| CSS tokens | `src/index.css` `:root` | Blue glass already defined |
| Brand icon | `src/assets/brand/sella-icon.png` | Official S-bag — keep as official mark |
| Glass ambient | `src/assets/brand/sella-glass-ambient.jpg` | Soft field under splash |
| BrandMark | `src/components/BrandMark.tsx` | Icon + optional GlassWordmark |
| GlassWordmark | `src/components/GlassWordmark.tsx` | PNG script / CSS write class |
| React splash | `src/components/SellaSplash.tsx` | ~4.2s; write → fade → logo → out |
| Native splash | `capacitor.config.ts` | `#040816`, autoHide false |
| Page enter | `PageTransition` + `.sella-page-enter` | Opacity-only (good — avoids fixed UI traps) |
| Reduced motion | `@media (prefers-reduced-motion)` | Partial coverage |

## Problems found

1. **Splash too long** (`minMs=4200`) — exceeds 2–2.6s target; feels slow on warm starts.
2. **Script animation is PNG/CSS**, not true stroke-dash SVG — less “handwritten” fidelity.
3. **Ambient photo** is abstract glass, not mission-led (shopkeeper / commerce empowerment).
4. **Native `#040816` vs app blue glass** — possible flash mismatch before React splash.
5. **Inconsistent micro-timing** — mix of `duration-300`, `duration-500`, `320ms` page enter.
6. **Decorative `animate-float` / pulse** on some marks — can feel cheap if overused.
7. **No shared motion tokens** — hard to keep POS snappy vs splash cinematic.

## Implementation plan

1. Generate original splash foundation artwork (3 concepts → pick one) in brand blues.
2. Add `SellaSignature.svg` stroke-write animation (CSS dashoffset).
3. Rebuild `SellaSplash` ≤ ~2.5s, skip-ready if auth ready, respect reduced-motion.
4. Align Capacitor splash background to brand navy/blue glass.
5. Add `src/lib/motion.ts` + CSS variables for micro / nav / modal timings.
6. Light Dashboard/POS feedback polish (active scales already exist — unify easing).
7. Test: `tsc`, `vitest`, `build`.
