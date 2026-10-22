# 02 — Feature Audit

**Audit date:** 2026-11-12

Legend: **Works** = implemented with code path; **Partial** = UI or stub incomplete; **Fake** = placeholder; **Unverified** = needs device/live proof.

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Shop registration | Works | Auth + register-shop / signupLocal | Cloud needs edge deploy |
| PIN unlock | Works | PinDialPad, appUnlock | |
| Inventory CRUD | Works | Inventory.tsx + APIs | No images UI yet |
| POS catalog sale | Works | AddDebt `/new-sale` | |
| Credit sale | Works | createSaleOrder remaining>0 | Phone required paths |
| Split payments | Works | money.ts + tests | |
| Partial debt payment | Works | recordPayment + test | Cloud race remains |
| Dashboard stats | Works | getDashboardStats | Kigali day fixed |
| Customer list | Works | Clients.tsx | |
| Debt list + card | Works | Debts.tsx | |
| Invoice PDF | Works | invoicePdf.ts | Device open unverified |
| WhatsApp reminder | Partial | whatsappReminder.ts | Device QA pending |
| WABA auto-send | Fake | whatsappBusinessApi stub returns false | Optional by design |
| Receipts thermal UI | Works | ThermalReceipt | |
| ChatSella assistant | Works | shopAssistant.ts | Heuristic not LLM-proven |
| Import customers | Works | ImportCustomers.tsx | |
| Billing Paypack | Partial | edge functions | Needs live secrets |
| Apple IAP | Fake | startAppleIap throws | |
| Staff accounts | Missing | — | |
| Refunds UI | Missing | sale_refunds table only | |
| Offline sync queue | Missing | local ≠ cloud sync | |
| Multi-location | Missing | — | |
| Product barcodes | Missing | — | |
| Account deletion | Works | Account + delete-account | sale_refunds gap |
| Privacy/Terms | Works | in-app routes | Hosted URL for stores needed |

## Fake / incomplete checklist

- `src/lib/whatsappBusinessApi.ts` always fails closed.  
- `src/services/billing.ts` Apple IAP stub.  
- `src/test/example.test.ts` trivial assert.  
- `SELLA_DEVELOPMENT_REPORT.md` lists refunds, product images, offline sync as partial.
