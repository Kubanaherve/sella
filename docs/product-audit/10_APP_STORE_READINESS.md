# 10 — Apple App Store Publication Audit

**Audit date:** 2026-11-12  
**Policy sources:**  
- https://developer.apple.com/app-store/review/guidelines/  
- https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/  

## High-risk guidelines

| Guideline | Risk | Notes |
|-----------|------|-------|
| 4.2 Minimum Functionality | **High** | Capacitor web shell must demonstrate lasting native utility |
| 5.1.1(v) Account deletion | Medium→Low | In-app deletion implemented |
| 3.1 Payments / IAP | **High** | `startAppleIap` stub; digital subscription likely needs IAP |
| 2.1 App Completeness | High | Placeholders / env fallbacks / incomplete billing |
| Privacy Nutrition / Manifest | Medium | Not audited as complete |
| Demo account | Medium | Documented reviewer patterns exist |

## Checklist

| Item | Status |
|------|--------|
| Bundle ID | `com.sella.app` |
| Account creation + deletion | Present |
| Privacy policy | In-app; need public URL |
| Permission strings | Present in Info.plist |
| Sign in with Apple | N/A if not using 3rd-party social login |
| Subscriptions | Incomplete |
| Screenshots/metadata | Incomplete |
| Backend availability for review | Depends on deployed Supabase |

## Rejection likelihood (qualitative)

**Elevated** until IAP/subscription story resolved and native polish proven on TestFlight.

**Verdict:** Do not submit today.
