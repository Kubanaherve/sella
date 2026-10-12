# Architecture Decision Record — Capacitor vs Flutter for Sella Mobile

**Status:** Proposed recommendation (not executed)  
**Date:** 2026-11-12  
**Author role:** Principal mobile architect assessment  
**Scope:** Mobile client only. Production Capacitor/React app remains untouched.  
**PoC:** `flutter_poc/` (mock data; no Supabase)

---

## 1. Current architecture (evidence)

| Layer | Reality | Evidence |
|-------|---------|----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind | `package.json`, `src/` (~94 TSX, ~48 TS) |
| Routing | React Router in `App.tsx` (~22 pages) | `src/App.tsx` |
| Mobile shell | **Capacitor 8** WebView | `capacitor.config.ts` `webDir: dist` |
| Native plugins | App, Filesystem, Haptics, Keyboard, Share, SplashScreen, StatusBar | `android/.../capacitor.plugins.json` |
| Local DB | Dexie IndexedDB | `src/db/localDb.ts` |
| Cloud | Supabase JS + Edge Functions | `src/db/cloudApi.ts`, `supabase/` |
| PDF | jsPDF in WebView | `src/lib/invoicePdf.ts` |
| WhatsApp | wa.me + Capacitor Share files | `src/lib/whatsappReminder.ts` |
| Auth | PIN + remembered shops; cloud pin-login | `AuthContext`, edge functions |
| Android | `com.sella.app`, min 24, **target 36** | `android/variables.gradle` |
| iOS | `com.sella.app` + camera/photo strings | `ios/` |
| Bundle | ~1.33 MB main JS; dist ~5.8 MB | product audit measurements |

### What works today

- Shared web + mobile codebase; fast feature iteration.
- Sale/credit/debt workflows already built and tested (unit).
- Capacitor Share + Filesystem can attach PDF without folder hunting.
- Brand, Kinyarwanda, MoMo-oriented flows exist.
- Store targetSdk already meets 2026 Play API 36 rule.

### What creates limitations

1. **WebView performance ceiling** — large JS bundle, GC jank on low-end Android common in Rwanda.
2. **Native feel gap** — scroll physics, transitions, keyboard, navigation back stack feel “web” unless heavily customized.
3. **Apple 4.2 risk** — reviewers may treat Capacitor apps as repackaged websites.
4. **Design consistency is not a framework failure alone** — audit found CSS/component inconsistency, density, competing CTAs. Those are fixable in React.
5. **Dual local/cloud modes + SPA complexity** — maintenance cost independent of Flutter.
6. **PDF + WhatsApp** — already workable via Share plugin; Flutter does not magically fix WhatsApp’s lack of official PDF+chat deep link with attachment.

---

## 2. Options compared

### A — Stay with Capacitor (status quo)

Ship as-is. Improve product quality inside WebView.

### B — Improve Capacitor + native integrations (recommended near-term)

Keep React UI; deepen native plugins; design system hardening; code-split; optional native splash/navigation polish; continue Share/Filesystem path.

### C — Full Flutter rewrite of mobile

Replace Capacitor app with Flutter; eventually deprecate WebView shell for stores.

### D — Flutter mobile + React web admin

Flutter for shopkeeper phones; keep React for web/PWA/admin/billing; shared Supabase backend.

### Evaluation matrix (1–5, higher better for Sella’s goals)

| Criterion | A Capacitor | B Improved Cap | C Flutter only | D Flutter + React web |
|-----------|------------:|---------------:|---------------:|----------------------:|
| Performance (low-end Android) | 2 | 3 | **5** | **5** |
| UI quality potential | 3 | **4** | **5** | **5** |
| Native experience | 2 | 3 | **5** | **5** |
| Dev cost (12 months) | **5** | **4** | 1 | 2 |
| Maintenance (one team) | **4** | **4** | 2 | 2 |
| Offline (local-first) | 3 | **4** | **4** | **4** |
| Device integrations | 3 | **4** | **5** | **5** |
| PDF sharing | 3 | **4** | **4** | **4** |
| WhatsApp integration | 3 | **4** | **4** | **4** |
| Security (client) | 3 | 3 | 3 | 3 |
| Testing maturity path | 3 | 3 | **4** | 3 |
| Scalability of features | 3 | 3 | 4 | **4** |
| Long-term speed (after rewrite) | 3 | 3 | 4 | 3 |
| Time-to-revenue risk | **5** | **5** | 1 | 2 |
| Store acceptance optics | 2 | 3 | **4** | **4** |

**Interpretation:** Flutter wins native feel/performance. Capacitor (especially B) wins cost, speed to commercial beta, and reuse of existing financial code.

---

## 3. Are design limits caused by the framework?

| Cause | Contribution | Notes |
|-------|--------------|-------|
| WebView limitations | Medium | Scroll/keyboard/60fps on weak devices; not the main reason for cluttered dashboards |
| Poor component / design system consistency | **High** | Multiple radii, competing CTAs, density — fixable in React |
| CSS / Tailwind sprawl | **High** | No single component library discipline |
| Navigation architecture | Medium | AppShell tabs OK; deep flows need clearer hierarchy |
| Animations under-invested | Medium | Capacitor can do Framer/CSS; Flutter makes motion easier |
| Framework absolute ceiling | Low–Medium | Premium UI **is achievable** in Capacitor if designed like Revolut (hierarchy, one hero number, progressive disclosure) |

**Conclusion:** Do **not** migrate to Flutter *because screens look prettier in demos*. The PoC proves Flutter can look premium quickly; the same visual language can be ported back into React/Capacitor at far lower risk.

---

## 4. Migration cost estimate (option C or D)

### Screens / modules to redevelop

~22 routes + modals (PaymentModal, sale complete, PIN, subscribe, admin…). Estimate **35–50 Flutter screens/flows** including edge cases.

### Reusable conceptually (not code)

- Brand tokens (`brand.ts` → Dart theme) — done in PoC  
- Money rules (`money.ts`) — must reimplement + retest in Dart  
- Phone normalization, entitlements, reporting semantics  
- Supabase schema, RLS, Edge Functions — **unchanged**  
- PDF layout rules — rewrite with `pdf` package  
- WhatsApp message copy — reuse strings  

### Cannot reuse as-is

- All React components / Tailwind  
- Dexie local DB → would become Drift/Hive/Isar or sqlite  
- jsPDF paths  
- Capacitor plugin wiring  

### Effort (single senior+mid team)

| Phase | Effort |
|-------|--------|
| Parity rewrite (POS, inventory, debts, auth, billing UI) | **4–7 months** |
| Local offline parity + sync strategy | +1–2 months |
| Hardening, device QA, store resubmission | +1–2 months |
| **Total to replace Capacitor in stores** | **~6–11 months** |

Option D adds ongoing dual-UI maintenance (~15–25% permanent tax).

### Financial regression risks (critical)

Rewriting `createSaleOrder` / `recordPayment` / dashboard aggregations in Dart risks:

- Off-by-one RWF rounding  
- Split payment bugs  
- Stock double-decrement  
- Tenant isolation mistakes  

These are **P0 commercial risks**. Any Flutter migration must port tests first (`money`, sale-order, isolation) into Dart before UI polish.

---

## 5. Flutter PoC results

Location: `flutter_poc/`

Demonstrates:

1. Dashboard with Sella brand + hero cash  
2. Customer credit history with dated lines + Hero transition  
3. Statement preview + PDF generation + native share sheet  

Run: `cd flutter_poc && flutter run`

**Not connected to production.**

---

## 6. Recommendation

### Decision: **B — Improve Capacitor and native integrations** (primary)

**Optional later:** revisit **D** only if (a) low-end Android performance remains unacceptable after Capacitor optimization, **and** (b) Apple repeatedly rejects on 4.2 after native polish, **and** (c) team can fund a parallel Flutter client without pausing SaaS hardening.

### Why not C/D now

1. Existing app has real financial workflows + recent security/isolation fixes — rewrite freezes feature velocity during the highest-risk commercialization window.  
2. Design gaps are mostly system/discipline, not WebView destiny.  
3. WhatsApp/PDF path already uses native Share; Flutter is not a silver bullet.  
4. Product audit still lists cloud atomic POS, store assets, IAP as blockers — framework migration does not solve those.  
5. Dual stack (D) doubles UI work for a small team.

### Why B

1. Protects working code and audit fixes.  
2. Improves perceived quality via design system + code-split + Capacitor plugins.  
3. Buys time to validate Rwanda beta demand.  
4. Keeps one language (TypeScript) across web/PWA/mobile.  
5. PoC remains a **benchmark** for visual quality to match in React.

### If choosing B — concrete next steps (no rewrite)

1. Extract a strict design system (spacing, type, one primary CTA).  
2. Code-split routes; shrink main chunk.  
3. Invest in motion (page transitions, haptics already present).  
4. Device lab QA on WhatsApp PDF share.  
5. Keep `flutter_poc` as visual north-star; do not expand into production features without explicit approval.

---

## 7. Protection statement

This ADR and `flutter_poc/` intentionally:

- Do **not** delete Capacitor/React production code  
- Do **not** alter Supabase migrations for Flutter  
- Do **not** begin full migration  

Full Flutter migration requires explicit founder approval after reviewing this ADR + running the PoC.
