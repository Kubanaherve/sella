# Product ecosystem

Sella stays one product. KUBANA Friend TECHNOLOGIES owns it.

## What already existed

- React + Vite web app, including the shop workflows and a marketing homepage.
- Supabase for auth, shop data, and subscription rows.
- Capacitor 8 projects for Android and iOS (`com.sella.app`).
- Paypack, Flutterwave, and manual MoMo payments that activate a subscription only after a server check.
- Shared price and write-access helpers in `src/lib/entitlements.ts`.

## What this pass adds

- Public pages for features, benefits, how it works, pricing, download, about, contact, support, and FAQ.
- A download catalog that links out only for `https` URLs set in the environment. Empty values stay “coming soon”.
- One commercial plan list (trial, Pro monthly, Pro annual) used by marketing prices and the account screen.
- Account plan status and the shop’s own payment history.
- An Electron window (`desktop/`) for Mac and Windows that loads the same web app. It is not a second product and it is not published.

## Clients

| Platform | Client | Backend |
| --- | --- | --- |
| Web | This Vite app | Supabase |
| Android | Existing Capacitor project | Same |
| iOS | Existing Capacitor project | Same |
| macOS | `desktop/main.cjs` | Same |
| Windows | `desktop/main.cjs` | Same |

Phone apps stay on Capacitor because the native projects, share/filesystem plugins, and store IDs already exist. A Flutter rewrite would duplicate sales, money, and PIN logic.

Desktop uses Electron because the interface is already React and the repo does not carry a Rust toolchain. The shell does not reimplement billing. Tauri remains a later option if a Rust release pipeline is added.

## Payments

Rwanda settlement stays on Paypack, Flutterwave, and manual MoMo. The provider switch already lives in the Edge functions. Apple and Google purchases, when the store apps ship, must be verified on the server and written to `user_subscriptions`. They do not bypass the other platform’s store rules.

## Not done in this pass

- No store submission.
- No live payment credentials were turned on.
- No Mac or Windows installer was signed or published.
- No production deploy.
