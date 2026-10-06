# Sella Testing Guide

## Quick start

```bash
cd /Users/friendkh/Projects/Mom_app_Bijoux/sella
npm run dev -- --host 127.0.0.1 --port 5173
```

Open http://127.0.0.1:5173/

## Test accounts (cloud demo shops)

These are synthetic shops on the linked Supabase project:

| Role | Shop | Phone | PIN |
|------|------|-------|-----|
| Owner A | Demo Jewel Kigali | `0780000001` | `1111` |
| Owner B | Demo Fashion Remera | `0780000002` | `2222` |

Login: **Injira (telefone + PIN 4)** — no WhatsApp OTP for daily login.

**Isolation check:** A’s customers/debts must never appear when logged in as B.

## Core workflows to test

### 1) Full paid sale (cash)

1. FAB → **New sale** (or Home → New sale)  
2. Tap several products; adjust qty in **Checkout**  
3. Payment: Cash → **Rest** (fills total)  
4. Confirm → Sale completed  
5. Optional: Receipt / WhatsApp / Finish  
6. Sales tab: badge **PAID**; Dashboard **Collected today** increases  

### 2) Split payment (MoMo + cash)

1. Cart total e.g. 50,000  
2. Checkout → Payments → set MoMo 30,000 + **+ Split** Cash 20,000  
3. Confirm  
4. Completion screen shows both methods  
5. Remaining balance = 0  

### 3) Partial payment

1. Cart 100,000  
2. Pay Cash 40,000 only; enter customer name  
3. Confirm → status **PARTIALLY PAID**, balance 60,000  
4. Debts list shows the customer  
5. Record additional MoMo payment with Tx reference  
6. Balance updates; sales badge → PARTIAL then PAID  

### 4) Credit (pay later)

1. Checkout with 0 paid; customer name required  
2. Optional due date  
3. Lands in Debts; WhatsApp optional on later payment  

### 5) Overpayment / change

1. Pay more than total with Cash  
2. UI shows **Change due**  
3. Recorded payments equal order total (change is noted)  

### 6) Receipts (optional)

1. More → **Receipt preferences** — toggle PDF / WhatsApp / animation  
2. After sale → Receipt → thermal animation (or skip if reduced motion) → PDF downloads  
3. Disable receipts → sales still complete; receipt actions respect prefs  

### 7) WhatsApp

1. Sale complete → WhatsApp  
2. Message should include shop name, lines, total, payment breakdown, balance, receipt #  
3. You must confirm send in WhatsApp (platform rule)  

### 8) Stock safety

1. Try selling more than stock → blocked  
2. After sale, inventory quantity decreases  

## Android

```bash
npm run android:apk
# or
npm run android:sync
```

Install the debug APK on a phone; use the same demo PINs against cloud `.env`.

Play Store Internal / Closed testing: build a signed release only when you are ready — **do not publish without explicit approval**.

## Resetting test data

- Prefer creating a **new shop** with a unique name for a clean slate.  
- Do **not** run destructive SQL against production customer data.  
- Local mode (`VITE_DATA_MODE=local`) uses an empty Dexie DB per browser profile.

## Automated checks

```bash
npm test
npm run typecheck
npm run build
```

## Known limitations (honest)

- MoMo/Airtel amounts are **shopkeeper-recorded**, not bank-verified.  
- Refund UI is not finished (table exists).  
- Product photos not uploaded yet (letter tiles).  
- Offline sales are not queued for sync.
