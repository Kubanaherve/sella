-- ============================================================================
-- ROLLBACK SCRIPT FOR: 20261119230000_cashier_shop_access.sql
-- Use this script ONLY in case an emergency rollback of migration 20261119230000 is required.
-- ============================================================================

-- 1. Drop added triggers
DROP TRIGGER IF EXISTS shop_staff_protect_trg ON public.shop_staff;
DROP TRIGGER IF EXISTS sales_stamp_cashier ON public.sales;
DROP TRIGGER IF EXISTS payments_stamp_cashier ON public.payments;

-- 2. Drop functions created or replaced
DROP FUNCTION IF EXISTS public.shop_staff_protect();
DROP FUNCTION IF EXISTS public.sella_stamp_sale_actor();
DROP FUNCTION IF EXISTS public.sella_stamp_payment_actor();
DROP FUNCTION IF EXISTS public.sella_tenant_owner_id();
DROP FUNCTION IF EXISTS public.sella_is_shop_owner();

-- 3. Drop cashier-specific read policies
DROP POLICY IF EXISTS clients_cashier_read ON public.clients;
DROP POLICY IF EXISTS debts_cashier_read ON public.debts;
DROP POLICY IF EXISTS debt_items_cashier_read ON public.debt_items;
DROP POLICY IF EXISTS payments_cashier_read ON public.payments;
DROP POLICY IF EXISTS sales_cashier_read ON public.sales;
DROP POLICY IF EXISTS inventory_cashier_read ON public.inventory_items;
DROP POLICY IF EXISTS app_settings_cashier_read ON public.app_settings;
DROP POLICY IF EXISTS profiles_cashier_read ON public.profiles;
DROP POLICY IF EXISTS user_subs_cashier_read ON public.user_subscriptions;

-- 4. Restore owner policies to standard direct user_id check
DROP POLICY IF EXISTS shop_staff_select_self ON public.shop_staff;
CREATE POLICY shop_staff_select_self ON public.shop_staff
  FOR SELECT
  USING (
    phone_normalized IN (
      SELECT p.phone_normalized FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- 5. Note on table columns:
-- Columns added (auth_user_id, current_session_id on shop_staff; cashier_user_id, cashier_name on sales/payments)
-- can remain harmlessly as NULLable columns without affecting legacy behavior, or be dropped if desired:
-- ALTER TABLE public.shop_staff DROP COLUMN IF EXISTS auth_user_id;
-- ALTER TABLE public.shop_staff DROP COLUMN IF EXISTS current_session_id;
-- ALTER TABLE public.sales DROP COLUMN IF EXISTS cashier_user_id;
-- ALTER TABLE public.sales DROP COLUMN IF EXISTS cashier_name;
-- ALTER TABLE public.payments DROP COLUMN IF EXISTS cashier_user_id;
