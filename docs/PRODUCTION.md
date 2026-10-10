# Sella — Production runbook

## What works today (verified in CI-like local runs)

| Area | Status |
|---|---|
| Web production build | `npm run build` |
| Typecheck / lint / unit tests | `npm run verify` |
| Local offline SaaS (Dexie) | Register → thank-you → PIN unlock → CRUD |
| Cloud code paths | Edge functions + migrations in repo |
| Capacitor Android/iOS projects | Present (`com.sella.app`) |
| Security hardening migration | `20261112040000_production_security_hardening.sql` |

## External blockers (you must supply)

1. **Supabase login + real anon/service keys** — `.env` still has placeholders until you paste keys.
2. **`supabase login` / `SUPABASE_ACCESS_TOKEN`** — required to deploy functions & push SQL.
3. **Resend** `RESEND_API_KEY` for welcome emails.
4. **Paypack** credentials + webhook secret.
5. **Android upload keystore** for Play release signing.
6. **Apple Developer** account for TestFlight / IAP (MoMo web billing is the B2B path).

## Fresh Supabase project (recommended)

Apply **only** these SQL files in order (SQL Editor):

1. `supabase/migrations/20261112010000_multitenant_saas_auth_payments.sql`
2. `supabase/migrations/20261112020000_shop_codes_email_identity.sql`
3. `supabase/migrations/20261112030000_unique_shop_names.sql`
4. `supabase/migrations/20261112040000_production_security_hardening.sql`

Do **not** apply Jan-2026 open-RLS migrations or the workspace billing migration on a new project.

Then:

```bash
supabase login
export SUPABASE_PROJECT_REF=your_ref
npm run backend:activate
# set secrets listed by the script
```

App `.env`:

```bash
VITE_DATA_MODE=cloud
VITE_SUPABASE_URL=https://YOUR_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Promote one admin:

```sql
UPDATE public.profiles SET is_superadmin = true
WHERE phone_normalized = '+2507XXXXXXXX';
```

## Run locally (offline / local mode)

```bash
cd /Users/friendkh/Projects/Mom_app_Bijoux/sella
npm i
# keep VITE_DATA_MODE=local for offline demo
npm run dev
```

## Android device install (debug)

```bash
npm run android:apk
# APK: android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Or open Android Studio:

```bash
npm run android:sync
```

## iPhone install (debug)

Requirements: macOS + Xcode + Apple team.

```bash
npm run ios:sync
# In Xcode: select your Team, device, Run
```

## Critical user flows to verify on device

1. Register shop (unique name) → thank-you → Start  
2. Kill app → reopen → PIN dial pad only  
3. Add inventory → add debt → record payment  
4. Sales report updates  
5. Account → change PIN  
6. Cloud only: Subscribe MoMo / manual receipt → admin approve  

## Security notes (implemented in repo)

- Client never receives service-role key  
- Users cannot UPDATE `user_subscriptions` status (billing activation is server-side)  
- Payment inserts restricted to `pending`  
- `pin-login` rate-limited via `check_auth_rate_limit`  
- Paypack webhook rejects when secret missing / invalid  
- Reviewer OTP bypass off unless `ENABLE_REVIEWER_BYPASS=true`  
