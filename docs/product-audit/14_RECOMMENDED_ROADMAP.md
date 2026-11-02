# 14 — Recommended Roadmap

**Audit date:** 2026-11-12

## Week 0–2 (stop the bleeding)

1. Apply `20261112160000_protect_is_superadmin.sql` + redeploy `paypack-webhook` + `pin-login`.  
2. Confirm production RLS is tenant-scoped (script two-shop test).  
3. Implement Postgres `create_sale_order` + `record_payment` RPCs.  
4. Physical QA matrix: Android mid-range + iPhone — WA reminder, PDF, payments.  
5. Host privacy/terms URLs; draft Play Data Safety.  

## Month 1

1. Guided first-run checklist (Kinyarwanda).  
2. Code-split main bundle; lazy routes.  
3. Refund/void sale UX (even simple).  
4. Dashboard: one hero cash number.  
5. Internal Play testing track.  

## Month 2–3

1. Offline mutation queue for cloud mode.  
2. Staff PIN roles (owner/cashier).  
3. Apple subscription compliance path.  
4. Support WhatsApp channel for shops.  
5. Closed beta with 10–30 Rwanda shops; measure debt recovery via reminders.  

## Explicit non-goals (next 90 days)

- Full Lightspeed-class multi-location.  
- Card hardware ecosystem.  
- Mandatory WABA.  
- AI inventory prediction.
