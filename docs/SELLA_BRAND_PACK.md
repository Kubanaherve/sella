# Sella glass + solid SVG pack

Source: `Sella-Glass-and-Solid-SVGs.zip` → `public/brand/sella-brand/`.

## Usage map

| Surface | Asset |
|---------|--------|
| Splash logo (blue/light) | `mark-glass-light` via `SellaLogoMark` |
| Splash write | `signature-glass-light` paths in `SellaSignature` |
| Auth / framed app icon | Existing squircle PNG tile |
| Unframed marks | `mark-glass-light` |
| Headers / lockups | `horizontal-glass-light` / `horizontal-glass-dark` |
| Compact nav 16–24px | `micro-*` |
| Word only | `wordmark-glass-*` |

Helper: `src/lib/sellaBrand.ts` → `sellaBrandSrc(kind, finish)`.

Keep glassy finishes on pale/blue panels; use solid black/white only for dense/print contrast.
