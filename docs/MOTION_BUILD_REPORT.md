# Motion upgrade — build & test report

**Date:** 2026-11-13

## Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npm test` (vitest) | PASS — 10 files / 31 tests |
| `npm run build` | PASS (~3.9s) |

## Splash performance notes

| Metric | Before | After |
|--------|--------|-------|
| React splash hold | ~4200 ms + exit | ≤ ~2500 ms (`MOTION.splashMax`) |
| Signature | PNG glass script fade | SVG stroke-dash write |
| Foundation art | Abstract glass JPG | Mission-led local JPG (~218 KB) |
| Native → React | 220 ms then 420 fade | 160 ms then 280 fade; shared `#040816` hold |

## Assets added

- `src/components/SellaSignature.tsx`
- `src/assets/brand/sella-signature.svg`
- `src/assets/brand/sella-splash-foundation.jpg` (+ public copy)
- Concepts B/C archived under `src/assets/brand/sella-splash-concept-*.jpg`
- `src/lib/motion.ts`

## Brand preservation

Primary/secondary colours unchanged (`#0B3FCC`, `#1A6FFF`, `#5AC8FA`). Official `BrandMark` / icon assets untouched; signature is splash-only animation art.

## Android demonstration build

| Item | Result |
|------|--------|
| `npx cap sync android` | PASS |
| `./gradlew assembleDebug` (JBR 21) | PASS |
| APK | `android/app/build/outputs/apk/debug/app-debug.apk` |

Note: system Temurin 26 is incompatible with this Gradle; build used Android Studio JBR 21.

## Docs

- `docs/MOTION_AUDIT.md` — Phase 1 audit
- `docs/MOTION_ART_SELECTION.md` — artwork concepts A/B/C
- `docs/MOTION_BUILD_REPORT.md` — this file
