# Sella — Shop POS Register, Stock & Customer Credit Book for Rwanda

Multi-tenant digital marketplace, POS register, and retail management platform built for Rwandan commercial businesses: clothing shops, shoe boutiques, hardware stores (quincailleries), electronics and gadget suppliers, supermarkets, mini-markets, pharmacies, beauty & cosmetics, restaurants & food businesses, construction materials, agricultural produce, furniture, wholesale warehouses, and informal market traders.

---

## 🌟 Core Platform Features

1. **Universal Rwandan Trader Support (20 Commercial Sectors)**:
   - Full bilingual support (Kinyarwanda & English).
   - Category-specific variation handling (Clothing & shoe sizes/colors, hardware dimensions & materials, electronics specifications & warranty, food portions & packaging).
   - Rich units: `pcs`, `kg`, `g`, `tonne`, `litre`, `ml`, `metre`, `sqm`, `box`, `bag`, `roll`, `pair`, `portion`, `pack`, `can`, `bundle`, `set`.

2. **Digital Marketplace & Store Discovery**:
   - Customer-facing digital marketplace (`/marketplace`) with real-time search across products and shops.
   - Filter by all 20 business categories, price ranges in RWF, and stock availability.
   - Dedicated merchant storefronts (`/store/:shopCode`) with custom banners, logo, business information, and direct WhatsApp / call order actions.
   - Interactive shopping cart with variation selection and real-time total in RWF.
   - Streamlined Rwandan checkout supporting Store Pickup (*Kwidurira mu iduka*) and Home/Stall Delivery (*Kukugezaho*).
   - Order tracking portal (`/orders` & `/orders/:orderId`) with real-time fulfillment timeline.

3. **Merchant POS & Store Management**:
   - Fast cash, MoMo, Airtel Money, and credit/debt (*Ideni*) checkout.
   - Barcode scanning & receipt generation.
   - Seller order management dashboard (`/orders-manage`) with one-tap status updates (`pending` → `confirmed` → `preparing` → `ready` → `completed` / `cancelled`).
   - Automatic stock reservation and inventory concurrency control.
   - Multi-user staff accounts (Owner, Manager, Cashier) with fast 4-digit PIN authentication.

4. **Multi-Platform Support**:
   - **Web Progressive Web App (PWA)**: Offline-first with IndexedDB (Dexie), background outbox sync, and service worker precaching.
   - **Desktop (macOS & Windows)**: Electron application (`npm run desktop`) with hardware keyboard shortcuts, command palette, and thermal printing.
   - **Mobile (Android & iOS)**: Capacitor native builds with Gradle and Xcode toolchains.

5. **Rwandan Payment Integration**:
   - MTN Mobile Money (`*182*8*1#`) & Airtel Money (`*500*1#`).
   - Integrated STK push collections via Paypack, MTN MoMo Collection API, and Airtel Africa Open API.
   - Verification flow, webhook event logging, idempotency key protection, and anti-duplicate guards.

---

## 🚀 Quick Start & Verification

### Prerequisites
- Node.js 18+ (tested on Node v20/v26)
- npm or yarn

### Installation & Local Run
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Run full verification suite (Typecheck + Lint + 206 Unit & Integration Tests + Production Build)
npm run verify
```

### Individual Check Commands
```bash
# TypeScript compiler check
npm run typecheck

# Code formatting and linting
npm run lint

# Automated test suite (Vitest)
npm test

# Production Vite PWA build
npm run build
```

---

## 🛠 Multi-Platform Build Commands

- **Desktop (Electron)**:
  ```bash
  npm run desktop
  ```
- **Android (Capacitor / Gradle)**:
  ```bash
  npm run android:sync
  npm run android:apk
  ```
- **iOS (Capacitor / Xcode)**:
  ```bash
  npm run ios:sync
  ```

---

## 🔐 Authentication & Security

- **PIN Authentication**: 4-digit PIN hashed via PBKDF2 with unique salts.
- **Shop Code Identity**: Deterministic collision-proof shop code format (`SEL-XXXXXX`).
- **Row-Level Security (RLS)**: Enforced across all Supabase tables (`profiles`, `inventory_items`, `debts`, `sales`, `marketplace_orders`, `marketplace_order_items`, `shop_staff`).
- **Rate Limiting**: Brute-force lockout protection (8 attempts per 15-minute window).

---

## 📋 Key Routes

| Route | Purpose | Target Audience |
|---|---|---|
| `/` | Landing page, platform showcase, download center | Public visitors |
| `/marketplace` | Universal digital marketplace & product discovery | Shoppers & Customers |
| `/store/:shopCode` | Merchant storefront, catalog, and contact buttons | Store Customers |
| `/orders` | Order tracking and fulfillment timeline | Customers |
| `/dashboard` | Daily sales, debt alerts, and quick POS actions | Store Owners & Cashiers |
| `/new-sale` | Fast register checkout (Cash, MoMo, Split, Debt) | Cashiers & Owners |
| `/inventory` | Multi-unit stock, pricing, and variation editor | Store Owners |
| `/orders-manage` | Seller marketplace order lifecycle manager | Store Owners |
| `/staff` | Cashier management, PIN reset, and session control | Store Owners |
| `/subscribe` | Normal (27,000 RWF/month or 270,000 RWF/year) and Pro (48,500 RWF/month or 485,000 RWF/year) | Store Owners |
| `/account` | Store profile, category, TIN, and security settings | Store Owners |
| `/admin` | Superadmin controls, rate-limit clears, audit logs | Platform Admins |

---

## Plans

A new shop gets 7 days of full access. After that:

| Plan | Month | Year (2 months free) | Limits |
| --- | --- | --- | --- |
| Normal | 27,000 RWF | 270,000 RWF | 1 shop, 1 cashier |
| Pro | 48,500 RWF | 485,000 RWF | 3 shops, 5 cashiers, import, assistant, marketplace tools |

Paypack charges those exact amounts. Apply `supabase/migrations/20261121120000_normal_pro_plans.sql` before taking live payments. Set Paypack, Supabase, and merchant payout values in the host environment. Names are listed in `.env.example`. Do not commit `.env`.

## 📄 License & Ownership
Copyright © 2026 KUBANA Friend TECHNOLOGIES. All rights reserved.
