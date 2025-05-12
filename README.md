# Sella

Multi-tenant SaaS for Rwanda businesses: clients, credit sales, inventory, reports.

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

## Billing

- Trial: **7 days**
- Monthly: **RWF 5,000** · Annual: **RWF 50,000**
- Paypack MTN/Airtel · Manual MoMo · BK bank + receipt

## Key routes

`/`, `/dashboard`, `/subscribe`, `/account`, `/admin/payments`, `/terms`, `/privacy`
