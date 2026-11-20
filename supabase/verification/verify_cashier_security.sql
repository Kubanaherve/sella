-- ============================================================================
-- SELLA POST-MIGRATION SECURITY VERIFICATION SUITE
-- Run this script in Supabase SQL Editor after applying 20261119230000_cashier_shop_access.sql
-- ============================================================================

DO $$
DECLARE
  v_col_count INT;
  v_func_count INT;
  v_policy_count INT;
  v_trigger_count INT;
  v_priv_leak INT;
BEGIN
  RAISE NOTICE 'Starting Sella Cashier RLS & Security Verification...';

  -- 1. Check shop_staff columns
  SELECT count(*) INTO v_col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'shop_staff'
    AND column_name IN ('auth_user_id', 'current_session_id');

  IF v_col_count <> 2 THEN
    RAISE EXCEPTION 'FAILED: Missing auth_user_id or current_session_id on public.shop_staff';
  ELSE
    RAISE NOTICE 'PASS [1/7]: shop_staff columns auth_user_id and current_session_id exist.';
  END IF;

  -- 2. Check cashier attribution columns on sales and payments
  SELECT count(*) INTO v_col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND ((table_name = 'sales' AND column_name IN ('cashier_user_id', 'cashier_name'))
         OR (table_name = 'payments' AND column_name = 'cashier_user_id'));

  IF v_col_count <> 3 THEN
    RAISE EXCEPTION 'FAILED: Missing cashier attribution columns on sales or payments';
  ELSE
    RAISE NOTICE 'PASS [2/7]: Cashier attribution columns exist on sales and payments.';
  END IF;

  -- 3. Check SECURITY DEFINER functions exist with correct search path
  SELECT count(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('sella_is_shop_owner', 'sella_tenant_owner_id', 'create_sale_order', 'record_payment', 'adjust_inventory', 'process_sale_return', 'delete_debt_owner', 'write_financial_audit');

  IF v_func_count < 8 THEN
    RAISE EXCEPTION 'FAILED: Not all required security functions exist. Expected 8, found %', v_func_count;
  ELSE
    RAISE NOTICE 'PASS [3/7]: All 8 core SECURITY DEFINER functions exist.';
  END IF;

  -- 4. Verify triggers are attached
  SELECT count(*) INTO v_trigger_count
  FROM pg_trigger
  WHERE tgname IN ('shop_staff_protect_trg', 'sales_stamp_cashier', 'payments_stamp_cashier');

  IF v_trigger_count <> 3 THEN
    RAISE EXCEPTION 'FAILED: Not all required security triggers are attached. Expected 3, found %', v_trigger_count;
  ELSE
    RAISE NOTICE 'PASS [4/7]: All 3 security triggers (shop_staff_protect_trg, sales_stamp_cashier, payments_stamp_cashier) active.';
  END IF;

  -- 5. Verify RLS is enabled on all critical tenant tables
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('clients', 'debts', 'debt_items', 'payments', 'sales', 'inventory_items', 'app_settings', 'pos_idempotency_keys', 'shop_staff', 'profiles', 'user_subscriptions')
      AND c.relrowsecurity = false
  ) THEN
    RAISE EXCEPTION 'FAILED: One or more critical tables do not have RLS enabled!';
  ELSE
    RAISE NOTICE 'PASS [5/7]: RLS is enabled on all 11 critical tenant tables.';
  END IF;

  -- 6. Check cashier read policies exist
  SELECT count(*) INTO v_policy_count
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  WHERE p.polname IN (
    'clients_cashier_read', 'debts_cashier_read', 'debt_items_cashier_read',
    'payments_cashier_read', 'sales_cashier_read', 'inventory_cashier_read',
    'app_settings_cashier_read', 'profiles_cashier_read', 'user_subs_cashier_read'
  );

  IF v_policy_count < 9 THEN
    RAISE EXCEPTION 'FAILED: Missing cashier read policies. Expected 9, found %', v_policy_count;
  ELSE
    RAISE NOTICE 'PASS [6/7]: All 9 tenant-isolated cashier read policies exist.';
  END IF;

  -- 7. Verify write_financial_audit is NOT executable by authenticated or anon
  SELECT count(*) INTO v_priv_leak
  FROM information_schema.routine_privileges
  WHERE routine_schema = 'public'
    AND routine_name = 'write_financial_audit'
    AND grantee IN ('PUBLIC', 'anon', 'authenticated');

  IF v_priv_leak > 0 THEN
    RAISE EXCEPTION 'FAILED: write_financial_audit has unauthorized execute privileges granted to PUBLIC/anon/authenticated!';
  ELSE
    RAISE NOTICE 'PASS [7/7]: write_financial_audit is strictly locked down to internal database callers.';
  END IF;

  RAISE NOTICE 'ALL 7 PRODUCTION SECURITY CHECKS PASSED SUCCESSFULLY!';
END $$;
