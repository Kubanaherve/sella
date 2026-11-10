-- Sella Phase 1 — Cross-tenant isolation verification (manual)
-- DO NOT run against production with destructive statements beyond SELECTs.
-- Preconditions:
--   1. Two real auth users exist (Shop A and Shop B), each with their own profile.
--   2. You have JWTs / SQL editor sessions for each user (or use SET request.jwt.claim.sub).
--
-- Success = every unauthorized SELECT/INSERT/UPDATE/DELETE fails (0 rows or RLS error).

-- ---------------------------------------------------------------------------
-- A) Confirm RLS is enabled on tenant tables
-- ---------------------------------------------------------------------------
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'clients','inventory_items','debts','debt_items','payments','sales',
    'app_settings','sale_refunds','pos_idempotency_keys','financial_audit_log',
    'profiles','user_subscriptions','subscription_payments','otp_verifications'
  )
ORDER BY 1;

-- Expect rls_enabled = true for all listed business tables.

-- ---------------------------------------------------------------------------
-- B) Confirm open policies from legacy migrations are NOT present
-- ---------------------------------------------------------------------------
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual ILIKE '%true%'
    OR with_check ILIKE '%true%'
  )
ORDER BY tablename, policyname;

-- Review any USING (true) / WITH CHECK (true) carefully.
-- otp_deny_all with false is OK. Tenant policies should use auth.uid() = user_id.

-- ---------------------------------------------------------------------------
-- C) Superadmin protection trigger exists
-- ---------------------------------------------------------------------------
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname = 'trg_protect_profiles_superadmin';

-- ---------------------------------------------------------------------------
-- D) Atomic POS RPCs exist
-- ---------------------------------------------------------------------------
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'create_sale_order','record_payment','record_credit_transaction',
    'adjust_inventory','process_sale_return','write_financial_audit'
  )
ORDER BY 1;

-- ---------------------------------------------------------------------------
-- E) Manual cross-shop probe (run as Shop A JWT in SQL editor / client)
-- Replace :shop_b_user_id with Shop B's auth.users id
-- ---------------------------------------------------------------------------
-- SELECT count(*) FROM public.clients WHERE user_id = :shop_b_user_id;
-- Expect: 0 (RLS hides rows) when authenticated as Shop A.
--
-- INSERT INTO public.clients (user_id, name)
-- VALUES (:shop_b_user_id, 'HACK');
-- Expect: failure or user_id forced to auth.uid() by trigger — never Shop B ownership.
--
-- UPDATE public.inventory_items SET quantity = 0
-- WHERE user_id = :shop_b_user_id;
-- Expect: 0 rows updated.
--
-- DELETE FROM public.debts WHERE user_id = :shop_b_user_id;
-- Expect: 0 rows deleted.
--
-- UPDATE public.profiles SET is_superadmin = true WHERE user_id = auth.uid();
-- Expect: exception from trg_protect_profiles_superadmin (unless already superadmin / bootstrap).

-- ---------------------------------------------------------------------------
-- F) Document results
-- ---------------------------------------------------------------------------
-- Record date, project ref, who ran the test, and pass/fail per step in
-- docs/implementation/PHASE1_VERIFICATION.md
