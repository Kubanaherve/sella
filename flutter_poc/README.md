# Sella Flutter PoC (experimental)

Isolated proof-of-concept for evaluating Flutter vs Capacitor for Sella mobile UX.

## Scope

Three screens with **mock data only**:

1. Dashboard (hero cash + debt preview)
2. Customer profile with dated credit history
3. Invoice preview + native share sheet (PDF + Kinyarwanda message)

## Non-goals

- Does **not** connect to Supabase or Dexie
- Does **not** replace the Capacitor production app
- Does **not** change database schemas

## Run

```bash
cd flutter_poc
flutter pub get
flutter run
```

See ADR: `../docs/architecture/FLUTTER_VS_CAPACITOR_ADR.md`
