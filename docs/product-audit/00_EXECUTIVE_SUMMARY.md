# Sella Independent Product Audit — Executive Summary

**Audit date:** 2026-11-12  
**Auditor role:** Independent technology / product / security / store-readiness assessment  
**Codebase:** `/Users/friendkh/Projects/Mom_app_Bijoux/sella`  
**Method:** Source inspection, migrations/RLS review, unit tests, production build, policy research. Physical device QA and live Supabase RLS penetration tests were **not** fully executed in this pass.

---

## One-paragraph verdict

Sella is a **credible Rwanda-focused shop OS prototype** with real sale-first credit workflows, integer RWF money helpers, Capacitor mobile shells, Kinyarwanda UX signals, and WhatsApp reminder intent. It is **not** yet a finished commercial SaaS product ready for mass publication. Critical security and financial integrity gaps remain on the cloud path (non-atomic POS writes, concurrent stock races). Store submission is blocked by incomplete commercial/ops packaging (privacy hosting, Data Safety, Apple IAP, reviewer proof, screenshots) more than by “it doesn’t build.”

**Final verdict letters:** see `15_FINAL_RELEASE_VERDICT.md` → **C — READY FOR CONTROLLED BETA TESTING** (not D/E/F).

---

## Overall readiness score: **54 / 100**

| Dimension | Score | How calculated |
|-----------|------:|----------------|
| Product completeness | 58 | Core POS+debt+inventory exist; staff/multi-location/refunds/offline sync missing |
| User experience | 62 | Kinyarwanda + one-tap WA intent strong; onboarding/training still thin |
| Design quality | 55 | Brand blue emerging; density/inconsistency vs premium fintech |
| Backend quality | 60 | Edge functions + dual local/cloud; cloud POS not transactional |
| Database integrity | 57 | RLS intended; local isolation fixed in audit; legacy open-RLS migrations still in tree |
| Financial accuracy | 68 | `money.ts` + tests solid; cloud races / deleteDebt sales gaps |
| Security | 61 | Anon-only client OK; webhook/superadmin/PIN rate fixes shipped in audit; apply migration |
| Mobile readiness | 65 | Capacitor 8, targetSdk 36; still web-in-shell feel risk |
| Performance | 52 | Main JS ~1.33 MB; PWA precache ~5.1 MB |
| Google Play readiness | 55 | API 36 OK; listing/assets/Data Safety incomplete |
| Apple App Store readiness | 42 | 4.2 + IAP + polish risks high |
| Commercial readiness | 48 | Billing paths exist; ops secrets, KYC, support not proven |

**Weighted overall ≈ 54.** A 95 would require production RLS proof, atomic cloud POS, store assets complete, device QA green, and Apple subscription compliance.

---

## What Sella already does well

1. Sale-first orders with split/partial payments (local transactional).
2. Customer credit + remaining balances + dated line items.
3. RWF integer discipline in app layer (`src/lib/money.ts`).
4. Multi-tenant cloud design intent (`user_id` + RLS migrations).
5. PIN daily unlock + remembered shops (low-literacy friendly).
6. Invoice PDF with shop pay number + WhatsApp reminder pipeline.
7. Account deletion UI + `delete-account` edge function.
8. Capacitor Android `targetSdkVersion = 36` (meets Aug 2026 Play rule).
9. Kinyarwanda-first labels for Rwanda shops.
10. In-app Privacy/Terms routes.

## What would cause failure if launched tomorrow

1. Cloud checkout mid-failure leaving stock deducted without payments (P1).
2. Mis-applied legacy `USING (true)` RLS migrations (P0 operational).
3. Apple rejection for incomplete IAP / minimum functionality (policy risk).
4. Shop owners confused by dual local vs cloud modes and technical debt UI remnants.
5. Large JS bundle / low-end Android jank → 1★ reviews.
6. WhatsApp PDF+message not verified on real devices → broken core promise.
7. No staff roles → password sharing / audit gaps.
8. Subscription sold without clear store-compliant payment path on iOS.

## What was fixed during this audit (safe code changes)

- Local Dexie **per-shop `profile_id` isolation** + migration v3 + test.
- Paypack webhook **requires ref** + stronger secret compare.
- PIN login **fail-closed** if rate-limit RPC fails.
- Migration **`20261112160000_protect_is_superadmin.sql`** (must be applied to live DB).
- Local `recordPayment` transactional; `deleteDebt` removes linked sales.
- Kigali calendar-day reporting (`src/lib/dates.ts`).
- Phone normalize no longer truncates long locals into collisions.
- Lint issues in reminder/PDF paths cleaned.

## Direct answers (founder-facing)

1. **Technically ready?** Partially — local demo yes; cloud production POS not fully safe.  
2. **Secure enough for real business data?** Not until hardening migration applied + cloud atomic writes + live RLS verified.  
3. **Financially reliable?** Local path mostly; cloud concurrent writes risky.  
4. **Easy for ordinary shop owners?** Getting closer; still >15 minutes for full mastery; guided onboarding missing.  
5. **Design competitive with premium apps?** No — functional, not Revolut/Wise-tier.  
6. **Better than basic inventory apps?** Yes for **Rwanda credit + WhatsApp reminders**.  
7. **Differentiation?** Credit ledger + MoMo number on statements + Kinyarwanda + shop PIN.  
8. **Missing vs competitors?** Staff, offline sync queue, card payments, multi-location, returns UI, BI, hardware.  
9. **Submit Play today?** No.  
10. **Submit App Store today?** No.  
11. **Rejection causes?** Incomplete metadata, IAP, 4.2, crashes, demo account, privacy.  
12. **Before real businesses?** Apply security SQL, atomic cloud POS, device QA on WA/PDF, support channel.  
13. **Next 3 months?** See `14_RECOMMENDED_ROADMAP.md`.  
14. **Biggest long-term risk?** Trust loss from wrong balances / data leaks between shops.


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

