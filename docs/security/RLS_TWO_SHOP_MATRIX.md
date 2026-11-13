# SELLA live RLS two-shop matrix

**Ran:** 2026-11-13T09:04:27.012Z  
**Project:** `ixihbqubatyfulnurpco`  
**Shops:** Demo Jewel Kigali (A) vs Demo Fashion Remera (B)  
**Rule:** No feature is complete until expected behavior is tested and verified.

## Summary

| PASS | FAIL | Total |
|------|------|-------|
| 16 | 0 | 16 |

**Overall:** ✅ PASS

## Results

| ID | Test | Expected | Result | Detail |
|----|------|----------|--------|--------|
| P0 | Anonymous client cannot list inventory | empty / denied | **PASS** | empty |
| A1 | Shop A reads own product | 1 row | **PASS** |  |
| B1 | Shop B reads own product | 1 row | **PASS** |  |
| X1 | Shop A cannot read Shop B product | 0 rows | **PASS** | rows=0 |
| X2 | Shop A cannot read Shop B customer | 0 rows | **PASS** | rows=0 |
| X3 | Shop A cannot read Shop B sale | 0 rows | **PASS** | rows=0 |
| X4 | Shop A cannot read Shop B debt | 0 rows | **PASS** | rows=0 |
| X5 | Shop A cannot modify Shop B product | 0 rows | **PASS** | updated=0 |
| X6 | Shop A cannot delete Shop B sale | 0 deleted; B still sees sale | **PASS** | deleted=0 still=1 |
| X7 | Shop A cannot insert client owned by Shop B | error or forced to A | **PASS** | new row violates row-level security policy for table "clients" |
| X8 | Shop A cannot list other shops' subscription_payments | 0 rows | **PASS** | rows=0 |
| R1 | RPC create_sale_order as A cannot sell B inventory | denied + B stock unchanged | **PASS** | Igicuruzwa ntabwo kibonetse |
| S1 | Shop A upload to own receipts path | ok | **PASS** |  |
| S2 | Shop B cannot download Shop A receipt | denied | **PASS** | {} |
| X9 | Shop A cannot self-promote to superadmin | still false | **PASS** | is_superadmin=undefined |
| X10 | Shop A subscription_payments only own rows | no foreign user_id | **PASS** | own=1 foreign=0 |

## How to re-run

```bash
node scripts/rls-two-shop-matrix.mjs
```

Demo credentials: see `SELLA_TESTING_GUIDE.md` (0780000001/1111 and 0780000002/2222).
