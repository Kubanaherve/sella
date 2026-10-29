# 08 — Mobile Readiness

**Audit date:** 2026-11-12

## Architecture implication

Sella is a **Capacitor WebView app** (not native UIKit/Jetpack Compose UI).  
Implications: faster shared codebase; Apple 4.2 scrutiny; performance depends on WebView + JS bundle size; native plugins required for share/filesystem/haptics (present).

## Android (verified in repo)

| Item | Value |
|------|-------|
| applicationId | `com.sella.app` |
| minSdk | 24 |
| targetSdk / compileSdk | **36** |
| Permissions | INTERNET, CAMERA, READ_EXTERNAL_STORAGE, READ_MEDIA_IMAGES |
| Plugins | App, Filesystem, Haptics, Keyboard, Share, SplashScreen, StatusBar |

**Play API 36:** Meets Google policy effective 2026-08-31 for new apps/updates ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/11926878), consulted 2026-11-12).

## iOS (verified in repo)

| Item | Value |
|------|-------|
| Bundle ID | `com.sella.app` |
| Privacy strings | Camera / Photo Library (receipts) |
| Signing | Requires developer account (not auditable in repo) |

## Gaps / risks

- Physical device matrix not run in this audit.  
- Back button Android behavior not automated.  
- Keyboard avoiding layouts — Capacitor Keyboard present; unverified on small screens.  
- WhatsApp share with PDF+text — platform-dependent; fallback UI exists.  
- Feels-native score: **medium** (custom shell helps; still SPA).  

## Bundle / performance snapshot

- `dist` ~5.8 MB; main chunk ~1.33 MB JS.  
- Risk on low-end Android: slow TTI → negative reviews.
