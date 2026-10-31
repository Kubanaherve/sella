# 11 — Rwanda & African Market Readiness

**Audit date:** 2026-11-12

## Fit strengths

- RWF formatting (`formatCurrency`).  
- Rwanda phone normalization (+2507…).  
- Kinyarwanda labels throughout.  
- WhatsApp-centric customer communication.  
- Mobile-first Capacitor.  
- Credit/debt culture support (ideni).  
- MoMo/Airtel **payment number display** on invoices.  
- Local Dexie mode for poor connectivity (device-local).  

## Payment integration honesty

| Claim | Reality |
|-------|---------|
| Show shop MoMo number on PDF | **Yes** |
| Customer pays manually | **Yes** (human process) |
| Verified automatic MoMo reconciliation for customer debts | **No** (not implemented) |
| Subscription Paypack/Flutterwave paths | Partial — needs live credentials |
| MTN/Airtel Business API auto-match | Not present |

## Commercially realistic next integrations

1. Manual MoMo + reference entry (already).  
2. Paypack/Flutterwave for **Sella subscription** only.  
3. Later: optional payment SMS parsers / MoMo confirmation codes — not core v1.  

## Differentiation vs generic international POS

Sella wins when the shop’s life is: stock phone → credit notebook → WhatsApp chase → MoMo. Square/Shopify win when card hardware + omnichannel matter.
