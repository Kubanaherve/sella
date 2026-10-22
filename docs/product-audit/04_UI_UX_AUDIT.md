# 04 — UI/UX Design Audit

**Audit date:** 2026-11-12  
**Scope:** All primary screens under `src/pages` + modals/shell (code + design system inspection; not pixel QA on every device size).

## Design system findings

| Token/area | Observation |
|------------|-------------|
| Brand | Electric blue `#1A6FFF` / `#0B4FD9` emerging |
| Type | Plus Jakarta Sans via `@fontsource` — good non-default |
| Traffic-light | `uiTheme.ts` stock/payment tones |
| Risk | Still some dashboard density; multiple radii (14/16/24) |
| Cards | Debts customer card improved; Inventory still card-heavy |

## Screen-by-screen (condensed)

| Screen | Hierarchy | Clarity | Issues |
|--------|-----------|---------|--------|
| Auth / PIN | Strong | High | Forgot-password is informational only |
| Dashboard | Medium | Medium | Multiple metrics compete; needs one hero |
| Inventory | Medium | Medium | Pastels help; add/edit density |
| AddDebt / POS | Medium | Medium | Multi-step confirmations — watch literacy |
| Debts | Improved | High | Primary WA CTA good |
| Sales | Medium | Medium | Report naming cash vs accrual confusing |
| Subscribe | Medium | Medium | Merchant placeholders if env missing |
| Account | OK | High | Destructive actions present |
| Assistant | Medium | Medium | Chat UI vs form preference |
| Legal | OK | High | Long text; fine for compliance |

## Defects to fix (design)

- Inconsistent icon button sizes (12 vs 14 squircles).  
- Secondary actions still compete with primary debt CTA (improved).  
- Empty states uneven across Inventory/Clients.  
- Loading skeletons not universal.  
- PDF preview vs real PDF drift risk.  
- Avoid decorative card sprawl on dashboard.

## Target Sella design principles

1. One job per screen.  
2. One primary CTA.  
3. Money numbers largest.  
4. Kinyarwanda first, English secondary.  
5. Touch targets ≥ 48px.  
6. Confirm irreversible money actions.  
7. No technical jargon (PDF/files/share hidden behind statuses).
