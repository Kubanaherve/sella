-- ---------------------------------------------------------------------------
-- Shop Staff Management & Cashier PIN Assignment
-- Allows store owners to add cashiers, review sales, revoke sessions, and reset PINs.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.shop_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_code TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_normalized TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('cashier', 'manager')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  pin_hash TEXT,
  last_active_at TIMESTAMPTZ,
  session_revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_code, phone_normalized)
);

CREATE INDEX IF NOT EXISTS shop_staff_shop_code_idx ON public.shop_staff (shop_code);
CREATE INDEX IF NOT EXISTS shop_staff_owner_id_idx ON public.shop_staff (owner_id);
CREATE INDEX IF NOT EXISTS shop_staff_phone_idx ON public.shop_staff (phone_normalized);

ALTER TABLE public.shop_staff ENABLE ROW LEVEL SECURITY;

-- 1. Store Owners have full access to manage their shop staff
DROP POLICY IF EXISTS shop_staff_owner_all ON public.shop_staff;
CREATE POLICY shop_staff_owner_all ON public.shop_staff
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 2. Staff members can view their own profile by phone_normalized
DROP POLICY IF EXISTS shop_staff_select_self ON public.shop_staff;
CREATE POLICY shop_staff_select_self ON public.shop_staff
  FOR SELECT
  USING (
    phone_normalized IN (
      SELECT p.phone_normalized FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Helper RPC: Lookup Shop Info by Shop Code (Anon / Authenticated)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_shop_info_by_code(p_shop_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT := upper(trim(p_shop_code));
  v_res JSONB;
BEGIN
  SELECT jsonb_build_object(
    'shop_code', p.shop_code,
    'business_name', p.business_name,
    'owner_name', COALESCE(NULLIF(p.owner_name, ''), p.business_name),
    'owner_id', p.user_id,
    'has_write_access', public.user_has_write_access(p.user_id)
  ) INTO v_res
  FROM public.profiles p
  WHERE upper(trim(p.shop_code)) = v_clean
  LIMIT 1;

  IF v_res IS NULL THEN
    RAISE EXCEPTION 'Shop Code "%" ntibonetse', p_shop_code;
  END IF;

  RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shop_info_by_code(TEXT) TO anon, authenticated, service_role;
