# 09 — Google Play Publication Audit

**Audit date:** 2026-11-12  
**Policy source:** https://support.google.com/googleplay/android-developer/answer/11926878 (consulted 2026-11-12)

## Target API

| Requirement | Sella | Pass? |
|-------------|-------|-------|
| New apps/updates target API 36 from 2026-08-31 | `targetSdkVersion = 36` in `android/variables.gradle` | **YES (config)** |

## Checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Target API | Pass (36) |
| 2 | AAB generation | Not verified in this audit (Gradle assemble not run for release) |
| 3 | Signing | Unknown (keystore not in repo — correct) |
| 4 | applicationId | `com.sella.app` |
| 5 | Privacy policy | In-app `/privacy`; **hosted public URL for Play Console not confirmed** |
| 6 | Data Safety | Form not filled in repo |
| 7 | Permissions | Camera/storage — must justify in Console |
| 8 | Account deletion | In-app present |
| 9 | Subscriptions disclosure | Manual MoMo/Paypack; Play Billing not used — declare accurately |
| 10 | Content rating | Not prepared |
| 11–16 | Listing/icon/screenshots/feature graphic | Checklist only (`docs/store/PLAY_ASSETS.md`) |
| 17 | Support contact | Not confirmed |
| 18 | Reviewer access | Documented demo phone pattern |
| 19–21 | Testing/stability/devices | Incomplete |
| 22 | SDK compliance | Capacitor + Supabase OK if disclosed |

## Blockers to submission

1. Complete store listing assets.  
2. Hosted privacy policy URL.  
3. Data Safety questionnaire.  
4. Release-signed AAB + internal testing proof.  
5. Ensure billing messaging matches actual payment location (website vs app) to avoid misleading disclosures.

**Verdict:** Not ready to submit for production review today.
