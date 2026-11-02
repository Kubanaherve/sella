# 12 — Test Results

**Audit date:** 2026-11-12

## Commands actually run

| Command | Result |
|---------|--------|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (after fixes) |
| `npm test` | **23 passed / 8 files** (includes isolation + phone collision tests) |
| `npm run build` | PASS (chunk size warning) |
| `npm audit --omit=dev` | **16 vulns** (4 moderate, 11 high, 1 critical) — transitive `tar`/`ws`/`source-map-js` |
| Physical iOS/Android QA | **NOT RUN** |
| Live Supabase RLS pentest | **NOT RUN** |
| E2E Playwright/Cypress | **NONE in repo** |

## Unit tests present

- `money.test.ts`  
- `create-sale-order.test.ts`  
- `auth-local.test.ts`  
- `remembered-accounts.test.ts`  
- `entitlements.test.ts`  
- `whatsappReminder.test.ts`  
- `local-tenant-isolation.test.ts` **(added this audit)**  
- `example.test.ts` (trivial)

## Added during audit

- Local multi-shop isolation test.  
- Superadmin protection migration (SQL).  
- Security fixes covered by code review + webhook logic change.

## Performance snapshot

- Main bundle ≈ **1.33 MB** JS (minified).  
- PWA precache ≈ **5.1 MB**.  

## Do not claim

- “Works on real iPhone/Android” — not physically verified this pass.  
- “WhatsApp attaches PDF+message always” — OS-dependent; fallback exists.
