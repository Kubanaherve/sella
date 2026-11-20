# Sella

Multi-tenant shop system for Rwanda: sales, credit, inventory, and staff. A clothing shop, grocery, quincaillerie, supermarket, wholesaler, or any other legitimate business uses the same register. The shop chooses a business type at registration. Products keep their own unit (piece, kg, litre, bag, packet, pair, carton), an optional size or color, and an optional wholesale minimum.

**Brand assets:** `src/assets/brand/` + `public/brand/` via `BrandMark`.

## Auth (daily use)

1. **Register** — shop name (unique), your name, email, phone, 4-digit PIN  
2. **Thank-you** — shows email, phone, shop code (also emailed when Resend is set)  
3. **Every return** — app remembers the shop and opens the **PIN dial pad only**

## Modes

| `VITE_DATA_MODE` | Behaviour |
|---|---|
| `local` | Dexie IndexedDB — full register + PIN remember (works offline today) |
| `cloud` | Supabase — `register-shop` / `pin-login` / `check-shop-name` + RLS + Paypack |

Copy `.env.example` → `.env`. Put real `VITE_SUPABASE_*` keys, set `VITE_DATA_MODE=cloud`.

## Run

```sh
npm i
npm run dev
npm test
npx tsc --noEmit
npm run build
npx cap sync
```

## Cloud activate

```sh
supabase login
npm run backend:activate
# then set Edge secrets: RESEND_API_KEY, PAYPACK_*, WHATSAPP_*
```

Migrations include unique shop names + shop codes. See [docs/STORE_LAUNCH.md](docs/STORE_LAUNCH.md).

## Demo & Testing Credentials (Dev)

- Demo shop phone: `+250788123456` (or `0788123456`)
- Demo PIN: **`1111`** *(Note: default demo PIN is 1111, not 1234)*
- Reviewer sandbox bypass: `+250780000000` / OTP `123456` (controlled by `ENABLE_REVIEWER_BYPASS`, disabled in production by default)
- Auth rate limit: 8 attempts / 15 minutes window (`auth_rate_limits`); returns 429 with countdown. Superadmins can clear phone lockouts from `/admin/dashboard`.

## Billing

- Trial: **7 days**
- Monthly: **RWF 5,000** · Annual: **RWF 50,000**
- Paypack MTN/Airtel · Manual MoMo · BK bank + receipt

## Key routes

`/`, `/dashboard`, `/subscribe`, `/account`, `/admin/payments`, `/terms`, `/privacy`
