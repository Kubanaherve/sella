# Sella production readiness

**Date:** 20 November 2026  
**Verdict:** NOT READY — CRITICAL ISSUES REMAIN

Sella is a multi-tenant shop operating system for Rwandan businesses: register, sales, credit, inventory, staff, and subscription billing. It is not a public consumer mall. A clothing shop, grocery, quincaillerie, supermarket, wholesaler, or other legitimate business uses the same register. Customers are served at the counter or by the shop's cashier. There is no public cart, public product search across other shops, review system, or delivery marketplace.

## 1. Architecture

- Web app: Vite, React 18, TypeScript, Tailwind.
- Offline shop data: Dexie / IndexedDB when `VITE_DATA_MODE=local`.
- Cloud shop data: Supabase Postgres, Auth, Row Level Security, and Edge Functions when `VITE_DATA_MODE=cloud`.
- Phone apps: Capacitor project `com.sella.app` for Android and iOS. Those native binaries are not published.
- Desktop: Electron shell.
- Installable web app: `public/manifest.webmanifest` and a generated service worker (`vite-plugin-pwa`).
- Money is stored as integer RWF. Dates for shop documents use Africa/Kigali.

## 2. Completed functionality

- Owner registration with shop name, email, phone, 4-digit PIN, and a business type.
- Business types include clothing, shoes, grocery, supermarket, mini-market, hardware, construction materials, electronics, beauty, furniture, household goods, agriculture, restaurants, stationery, wholesale, retail, informal market trade, and other lawful businesses.
- Products support units such as piece, kilogram, gram, tonne, litre, metre, square metre, bag, box, roll, pair, packet, bottle, can, bundle, portion, and set.
- A product can store an optional size, color, or pack note, and an optional wholesale minimum quantity.
- Inventory, sales, partial payments, debts, receipts, clients, staff, cashier PIN login, and owner PIN gates exist in the current codebase.
- All Debts PDF uses the shop's own name and payment number. Invoices and receipts stay on the existing glass document.
- Subscription billing can use Paypack, Flutterwave, or a manual Mobile Money / bank receipt. An order or subscription is not marked paid from a browser-only confirmation. Paypack and Flutterwave webhooks check their secrets before activation.

## 3. Database status

The repo contains additive migrations through `20261120150000_universal_trade_catalog.sql`, including cashier shop access in `20261119230000_cashier_shop_access.sql`.

Checked live on 20 November 2026 against project `ixihbqubatyfulnurpco`:

- `create_sale_order` and `record_payment` are exposed.
- `sella_tenant_owner_id` is not exposed. The cashier access migration is not on production.
- Edge functions `lookup-shop-code`, `cashier-pin-login`, and `cashier-join-and-set-pin` respond.
- `owner-reset-cashier-pin` returns 404. It is not deployed.
- `profiles.business_category` and the new inventory columns are not applied on production. Cloud registration and inventory writes retry without those columns so the current production database does not reject the request.

Do not replay the whole `supabase/migrations` folder onto production. Older January 2026 files conflict with the current SaaS schema. Production needs a backup, then only the migrations that are not already recorded, then the matching Edge Functions, then the frontend.

Staging project `nyfwfdpmuwlhzjachdyh` received the cashier migration in an earlier session. That does not change production.

## 4. Security

- Shop data is isolated by the signed-in owner. Cashiers are not given the service key.
- The service key is read from the server environment. It is not a `VITE_` variable.
- `.env` and `.env.*` are gitignored. `.env.example` contains placeholders.
- On 20 November 2026 the production service key in the local environment still authenticated `GET /auth/v1/admin/users` (HTTP 200). A fake key and the anon key both returned 401. That key has not been rotated. Rotation has to happen in the Supabase dashboard, then in every server secret, with proof that the old key returns 401. This session did not rotate it.
- Paypack rejects webhooks when `PAYPACK_WEBHOOK_SECRET` is missing or wrong. Flutterwave checks `verif-hash`.

## 5. Payment integration status

Code is ready for credentials. Live collection is not active from this repo alone.

| Provider | What the code does | What is still external |
|---|---|---|
| Paypack | Cash-in plus webhook for subscription activation | `PAYPACK_CLIENT_ID`, `PAYPACK_CLIENT_SECRET`, `PAYPACK_WEBHOOK_SECRET` |
| MTN MoMo Open API | Sandbox/production base URL and API user settings in `.env.example` | Developer approval, subscription key, API user, API key |
| Airtel Open API | Sandbox base `https://openapiuat.airtel.africa` | Rwanda app, Collection product, client id and secret |
| Flutterwave | Webhook verification for card or MoMo | Public key, secret, encryption key, verif-hash |
| Manual MoMo / bank | Shows the merchant name and number configured in env | Official merchant code and the number you want customers to pay |

No merchant code was invented. Sandbox and production stay separate through `MTN_MOMO_ENV`, `AIRTEL_ENV`, `PAYPACK_ENV`, and `PAYMENT_MODE`.

## 6. Testing results

Command: `npx vitest run` on 20 November 2026.

- 29 files passed.
- 188 tests passed.
- 4 tests failed in `src/test/shop-code-and-cashier-auth.test.ts`. They call the live production shop-code lookup. In this run the host `ixihbqubatyfulnurpco.supabase.co` could not be resolved (`ENOTFOUND`), so the lookup returned 500 instead of the shop or a 404. Those four tests are live-network checks, not a logic failure in the new catalog.

Catalog tests in `src/test/business-categories.test.ts`: 3 passed. A hardware shop stored category `hardware_quincaillerie`, and a cement line stored unit `bag`, variant `50kg`, and minimum order 10.

`npx tsc -p tsconfig.app.json --noEmit` does not pass. Failures that were already in the tree include missing optional UI packages (`recharts`, `cmdk`, `vaul`, and several Radix packages) that the production bundle does not import, plus cashier and sale-screen type errors. `npm run typecheck` uses `tsc --noEmit` with an empty `files` list, so it does not typecheck the app.

## 7. Build results

`npm run build` succeeded on 20 November 2026 outside the sandbox. Vite emitted `dist/` and the PWA service worker (`dist/sw.js`, 99 precache entries, about 3.9 MB precache).

The PDF libraries make a chunk larger than 600 kB (`vendor-pdf` about 624 kB minified, 185 kB gzip). That is the main weight on a slow connection. The service worker can cache it after the first successful load.

`node:fs` is referenced by the PDF logo loader and is externalized in the browser. The browser path uses `fetch`. Node tests read the PNG from disk.

## 8. Platform compatibility

| Surface | Status |
|---|---|
| Modern mobile and desktop browsers | Responsive web app. Production build and PWA manifest exist. |
| Android and iOS binaries | Capacitor projects exist. They are not submitted to Play or the App Store. |
| Windows and macOS desktop | Electron shell exists. Installers are not published. Download URLs in `.env.example` are blank on purpose. |

## 9. Environment variables

Copy `.env.example` to `.env`. Required for cloud mode:

- `VITE_DATA_MODE=cloud`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` on the server only

Payments, email, and WhatsApp stay empty until the provider issues them. See `.env.example`.

## 10. Deployment instructions

These steps were not run against production in this session.

1. Back up the production database.
2. Apply only the unapplied SaaS migrations, including `20261119230000_cashier_shop_access.sql` and `20261120150000_universal_trade_catalog.sql`. Do not run a blind `supabase db push` of the full folder.
3. Deploy Edge Functions, including `owner-reset-cashier-pin` and the updated `register-shop`.
4. Rotate the service key. Update Edge Function secrets and the server env. Confirm the old key returns 401.
5. Build with `npm run build` and host `dist/` over HTTPS. Point the domain at that host.
6. Set `VITE_PUBLIC_SITE_URL` and `APP_URL` to the real HTTPS origin and rebuild.

## 11. Domain

Buy and point the domain with DNS to the host. HTTPS is required for the installed web app, camera or barcode use, and payment return URLs. No domain was purchased here.

## 12. Mobile Money activation

1. MTN MoMo: approved developer account, collection subscription, API user, API key, target environment.
2. Airtel Money: Rwanda Collection app and production keys after sandbox.
3. Or Paypack: client id, secret, and webhook secret, with the webhook URL `https://<project-ref>.supabase.co/functions/v1/paypack-webhook`.
4. Put secrets in the host environment. Do not commit them.

## 13. Remaining external approvals

- Production database migration and function deploy, after a backup.
- Service-key rotation.
- Domain, DNS, and HTTPS hosting.
- MTN, Airtel, or Paypack merchant approval.
- Google Play and Apple review, including a hosted privacy URL, store listing assets, and a demo account. Apple in-app purchase of the digital subscription is not a finished StoreKit implementation.
- Android upload keystore and Apple Developer account.

## 14. Known limitations

- Shops do not publish a public storefront. Other people cannot browse every shop's stock, add it to a shared cart, or leave reviews. Doing that would publish private stock, cost, and customer data. The seller workflow is the register, inventory, credit, and staff tools.
- Product variations are one optional label on the item, not a matrix of separate stock rows per size and color.
- Logo and cover upload for a public store page are not part of this product.
- The production database is behind the code until the migrations above are applied.
- The PDF chunk is heavy on the first download.
- Four live shop-code tests need a reachable production network to pass.

## Verdict

**NOT READY — CRITICAL ISSUES REMAIN**

The codebase builds, and a shop can record sales across many kinds of trade. Production is still the older database, the service key still works, the PIN-reset function is not deployed, live Mobile Money credentials are not in place, and the app is not published to a domain or an app store.
