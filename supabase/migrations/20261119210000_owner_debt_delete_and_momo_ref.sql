-- NOT APPLIED by this change. Review on a staging database first.
-- Do not run this against production from the app or from CI.
--
-- Debt deletion: cashiers share the owner JWT, and profiles.role is unused.
-- A client flag cannot authorize a delete. This migration removes direct
-- DELETE and requires delete_debt_owner, which checks auth.uid(), the same
-- PIN password pin-login uses, and user_has_write_access.
--
-- MoMo references: a partial unique index is the concurrency authority.
-- The trigger takes an advisory lock so the error text stays explicit.
-- Empty references (including cash) are excluded.

-- Refuse delete until duplicate MoMo references are cleaned up.
DO $$
DECLARE
  v_dupes INT;
BEGIN
  SELECT COUNT(*) INTO v_dupes FROM (
    SELECT user_id, lower(trim(reference_number)) AS ref
    FROM public.payments
    WHERE payment_method = 'momo'
      AND reference_number IS NOT NULL
      AND length(trim(reference_number)) > 0
    GROUP BY 1, 2
    HAVING COUNT(*) > 1
  ) d;
  IF v_dupes > 0 THEN
    RAISE EXCEPTION
      'Cannot add MoMo reference uniqueness: % duplicate shop references exist. Resolve them before applying this migration.',
      v_dupes;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS payments_shop_momo_reference_uidx
  ON public.payments (user_id, lower(trim(reference_number)))
  WHERE payment_method = 'momo'
    AND reference_number IS NOT NULL
    AND length(trim(reference_number)) > 0;

CREATE OR REPLACE FUNCTION public.reject_duplicate_momo_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT;
BEGIN
  IF NEW.payment_method IS DISTINCT FROM 'momo' THEN
    RETURN NEW;
  END IF;
  v_ref := NULLIF(lower(trim(COALESCE(NEW.reference_number, ''))), '');
  IF v_ref IS NULL THEN
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text || ':momo-ref:' || v_ref));
  IF EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.user_id = NEW.user_id
      AND p.payment_method = 'momo'
      AND p.id IS DISTINCT FROM NEW.id
      AND p.reference_number IS NOT NULL
      AND length(trim(p.reference_number)) > 0
      AND lower(trim(p.reference_number)) = v_ref
  ) THEN
    RAISE EXCEPTION 'Iyi reference ya MoMo yamaze gukoreshwa muri iyi shop';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_momo_reference_unique ON public.payments;
CREATE TRIGGER payments_momo_reference_unique
  BEFORE INSERT OR UPDATE OF payment_method, reference_number, user_id
  ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_duplicate_momo_reference();

-- Direct deletes are no longer a policy. The RPC below is the only path.
DROP POLICY IF EXISTS debts_tenant ON public.debts;
DROP POLICY IF EXISTS debts_delete ON public.debts;
DROP POLICY IF EXISTS debts_select ON public.debts;
DROP POLICY IF EXISTS debts_insert ON public.debts;
DROP POLICY IF EXISTS debts_update ON public.debts;
CREATE POLICY debts_select ON public.debts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY debts_insert ON public.debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY debts_update ON public.debts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.delete_debt_owner(p_debt_id UUID, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_digits TEXT;
  v_password TEXT;
  v_hash TEXT;
  v_match BOOLEAN := false;
  v_allowed BOOLEAN;
  v_item RECORD;
  v_total NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'PIN y''umuyobozi sibyo';
  END IF;
  IF NOT public.user_has_write_access(v_uid) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Subscription expired — renew to create or edit records';
  END IF;

  SELECT allowed INTO v_allowed
  FROM public.check_auth_rate_limit('debt-delete:' || v_uid::text, 8, 900, 900);
  IF v_allowed IS NOT TRUE THEN
    RAISE EXCEPTION 'Too many PIN attempts. Try again later.';
  END IF;

  SELECT regexp_replace(COALESCE(phone_normalized, phone, ''), '\D', '', 'g')
    INTO v_digits
  FROM public.profiles
  WHERE user_id = v_uid;
  IF v_digits IS NULL OR length(v_digits) < 4 THEN
    RAISE EXCEPTION 'PIN y''umuyobozi sibyo';
  END IF;
  v_password := 'sella_' || p_pin || '_' || right(v_digits, 4);

  SELECT encrypted_password INTO v_hash FROM auth.users WHERE id = v_uid;
  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'PIN verification unavailable';
  END IF;
  BEGIN
    v_match := extensions.crypt(v_password, v_hash) = v_hash;
  EXCEPTION WHEN undefined_function THEN
    v_match := public.crypt(v_password, v_hash) = v_hash;
  END;
  IF NOT v_match THEN
    RAISE EXCEPTION 'PIN y''umuyobozi sibyo';
  END IF;

  DELETE FROM public.auth_rate_limits WHERE bucket_key = 'debt-delete:' || v_uid::text;

  SELECT total_amount INTO v_total
  FROM public.debts
  WHERE id = p_debt_id AND user_id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ideni ntiribonetse';
  END IF;

  FOR v_item IN
    SELECT inventory_item_id, quantity
    FROM public.debt_items
    WHERE debt_id = p_debt_id
      AND user_id = v_uid
      AND inventory_item_id IS NOT NULL
  LOOP
    UPDATE public.inventory_items
    SET quantity = quantity + v_item.quantity,
        updated_at = now()
    WHERE id = v_item.inventory_item_id
      AND user_id = v_uid;
  END LOOP;

  PERFORM public.write_financial_audit(
    'debt',
    p_debt_id,
    'delete_debt_owner',
    COALESCE(v_total, 0),
    jsonb_build_object('by', v_uid)
  );

  DELETE FROM public.payments WHERE debt_id = p_debt_id AND user_id = v_uid;
  DELETE FROM public.debt_items WHERE debt_id = p_debt_id AND user_id = v_uid;
  DELETE FROM public.sales WHERE debt_id = p_debt_id AND user_id = v_uid;
  DELETE FROM public.debts WHERE id = p_debt_id AND user_id = v_uid;

  RETURN jsonb_build_object('deleted', true);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_debt_owner(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_debt_owner(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_debt_owner(UUID, TEXT) TO authenticated;
