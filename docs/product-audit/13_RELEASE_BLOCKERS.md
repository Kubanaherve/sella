# 13 — Release Blocker Register

**Audit date:** 2026-11-12

| ID | Severity | Description | Evidence | Effort | Blocks Play | Blocks Apple | Blocks commercial |
|----|----------|-------------|----------|--------|-------------|--------------|-------------------|
| RB-01 | P0 | Legacy open-RLS migrations risk if mis-applied | `supabase/migrations/20260130*` | Ops diligence | Yes | Yes | Yes |
| RB-02 | P0 | Superadmin self-grant (pre-migration) | profiles_update policy | Apply `20261112160000_*` | Yes | Yes | Yes |
| RB-03 | P0 | Paypack empty-ref activation | was webhook | Fixed in repo; redeploy | Yes | Yes | Yes |
| RB-04 | P1 | Cloud POS non-atomic | cloudApi createSaleOrder | L | Yes* | Yes* | Yes |
| RB-05 | P1 | Concurrent stock races | cloud inventory RMW | L | Soft | Soft | Yes |
| RB-06 | P1 | Apple IAP / payment compliance | billing.ts stub | L | No | **Yes** | Yes |
| RB-07 | P1 | Hosted privacy + Data Safety / ASC privacy | missing ops | M | **Yes** | **Yes** | Soft |
| RB-08 | P1 | Store listing assets incomplete | PLAY_ASSETS.md | M | **Yes** | **Yes** | Soft |
| RB-09 | P1 | Device QA WhatsApp/PDF | unverified | M | Soft | Soft | Yes |
| RB-10 | P1 | npm audit critical transitive | npm audit | S/M | Soft | Soft | Soft |
| RB-11 | P2 | No staff permissions | product gap | L | No | No | Soft |
| RB-12 | P2 | No offline sync queue | architecture | L | No | No | Soft |
| RB-13 | P2 | Bundle size / low-end perf | build output | M | Soft | Soft | Soft |
| RB-14 | P2 | Onboarding guided tour missing | UX | M | No | Soft (4.2) | Soft |
| RB-15 | P3 | WABA automation | stub | L | No | No | No |
| RB-16 | P3 | Advanced BI | missing | L | No | No | No |

\* Financial integrity issues are **commercial/trust blockers** even if stores accept the binary.

## Policy vs quality

- **Actual policy risks:** Apple 3.1/4.2, Play Data Safety incomplete, privacy URL.  
- **Technical blockers:** RB-01–05.  
- **Quality/competitive:** RB-11–16.
