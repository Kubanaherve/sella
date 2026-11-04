# 15 — Final Release Verdict

**Date:** 2026-11-12

## Platform verdicts

| Platform | Letter | Meaning |
|----------|--------|---------|
| Product overall | **C** | Ready for **controlled beta** with known limitations |
| Google Play | **Not D** | Do not submit for production review yet |
| Apple App Store | **Not E** | Do not submit yet |
| Commercial public launch | **Not F** | Invite only after P0/P1 register cleared |

### Letter definitions used

- **A** NOT READY — DO NOT PUBLISH  
- **B** Technically ready but needs product improvements  
- **C** Ready for controlled beta testing  
- **D** Ready for Google Play submission  
- **E** Ready for Apple App Store submission  
- **F** Ready for both stores and commercial launch  

**Assigned: C** (with Android internal testing possible after AAB + privacy URL + Data Safety draft).

## Why not D/E/F

Evidence-based blockers remain:

1. Cloud POS non-atomic (financial integrity risk).  
2. Store listing assets incomplete (`docs/store/PLAY_ASSETS.md` still checklist).  
3. Apple IAP stub (`startAppleIap` throws).  
4. Capacitor WebView UX risk vs Guideline **4.2 Minimum Functionality**.  
5. Live RLS / cross-tenant penetration not proven in this audit.  
6. WhatsApp PDF+message flow not physically verified on iOS+Android.  
7. npm audit reports critical/high transitive deps (tar/ws) — address before release packaging.  

## Conditions to upgrade to D (Play)

- [ ] Signed AAB with targetSdk 36 (already configured).  
- [ ] Hosted privacy policy URL (not only in-app route).  
- [ ] Data Safety form completed accurately.  
- [ ] Account deletion verified end-to-end on cloud.  
- [ ] Atomic `create_sale_order` / `record_payment` RPCs deployed.  
- [ ] Superadmin protection migration applied.  
- [ ] Internal test track green on 3 low-end Android devices.  
- [ ] Screenshots + feature graphic uploaded.  

## Conditions to upgrade to E (Apple)

All Play conditions plus:

- [ ] StoreKit 2 subscriptions OR remove in-app purchase of digital goods and comply with reader-app / external purchase rules carefully.  
- [ ] Privacy Nutrition Labels + Privacy Manifest.  
- [ ] Demo account for review.  
- [ ] Prove native utility beyond “website in a wrapper” (share, haptics, offline local already help).  

## Honest investor summary

Sella has a **real wedge** (credit + WhatsApp + Rwanda UX) that Square/Shopify do not prioritize for informal Rwandan retail. The engineering base is better than a typical weekend prototype. It is still **pre-scale SaaS**: harden money writes, prove isolation, finish store compliance, then grow.


## Sources consulted (with dates)

| Source | URL | Consulted |
|--------|-----|-----------|
| Google Play target API | https://support.google.com/googleplay/android-developer/answer/11926878 | 2026-11-12 |
| Android target SDK guide | https://developer.android.com/google/play/requirements/target-sdk | 2026-11-12 |
| Apple App Review Guidelines | https://developer.apple.com/app-store/review/guidelines/ | 2026-11-12 |
| Apple account deletion 5.1.1(v) | https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/ | 2026-11-12 |
| Shopify vs Square (public comparison) | https://www.stylefactoryproductions.com/blog/shopify-pos-vs-square-pos | 2026-11-12 |
| Best POS apps overview | https://fitsmallbusiness.com/best-pos-apps/ | 2026-11-12 |
| Offline POS comparison | https://bizness-book.com/blog/offline-pos-system | 2026-11-12 |
| Fintech UX (Revolut/Wise patterns) | https://blog.logrocket.com/ux-design/great-examples-fintech-ux/ | 2026-11-12 |
| Trusted fintech UI examples | https://www.eleken.co/blog-posts/trusted-fintech-ui-examples | 2026-11-12 |

