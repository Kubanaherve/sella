-- NOT APPLIED. Review before any production run.
-- Independent cashier auth. Shop rows stay under the owner's user id.
-- A cashier reaches that shop only through an active shop_staff row whose
-- auth_user_id is their auth id and whose current_session_id is this JWT's
-- session. Refreshing a revoked session keeps the old session id, so it
-- does not become valid again.
-- Cashiers read shop rows. They write sales and payments only through
-- create_sale_order and record_payment. They cannot edit stock, settings,
-- debts, or another cashier's permissions.

ALTER TABLE public.shop_staff
  ADD COLUMN IF NOT EXISTS auth_user_id UUID;

ALTER TABLE public.shop_staff
  ADD COLUMN IF NOT EXISTS current_session_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS shop_staff_auth_user_id_idx
  ON public.shop_staff (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Bind only rows whose primary key is already an auth user. Owner-created
-- rows use a random id and stay unbound until the cashier logs in.
UPDATE public.shop_staff AS s
SET auth_user_id = s.id
WHERE s.auth_user_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users AS u WHERE u.id = s.id);

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS cashier_user_id UUID;
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS cashier_user_id UUID;

CREATE OR REPLACE FUNCTION public.sella_is_shop_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL
    AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IS DISTINCT FROM 'cashier'
    AND NOT EXISTS (
      SELECT 1 FROM public.shop_staff s WHERE s.auth_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.sella_tenant_owner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT COALESCE(
    (
      SELECT s.owner_id
      FROM public.shop_staff s
      WHERE s.auth_user_id = auth.uid()
        AND s.status = 'active'
        AND s.owner_id IS NOT NULL
        AND s.current_session_id IS NOT NULL
        AND lower(s.current_session_id::text) = lower(btrim(COALESCE(auth.jwt() ->> 'session_id', '')))
      ORDER BY s.created_at
      LIMIT 1
    ),
    CASE WHEN public.sella_is_shop_owner() THEN auth.uid() ELSE NULL END
  );
$$;

REVOKE ALL ON FUNCTION public.sella_is_shop_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sella_tenant_owner_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sella_is_shop_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sella_tenant_owner_id() TO authenticated;

-- Drop every policy on the business tables, including leftover "Allow public"
-- policies and debts_delete. Skip a table that is not in this database.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schemaname, c.relname AS tablename, p.polname AS policyname
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'clients', 'debts', 'debt_items', 'payments', 'sales',
        'inventory_items', 'app_settings', 'pos_idempotency_keys', 'customers'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  IF to_regclass('public.customers') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Owners keep direct access to their own rows. Cashiers get SELECT only.
-- user_id = auth.uid() never matches a cashier, so these policies do not
-- grant a cashier write access to the shop.
CREATE POLICY clients_owner ON public.clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY clients_cashier_read ON public.clients
  FOR SELECT USING (
    user_id = public.sella_tenant_owner_id() AND auth.uid() IS DISTINCT FROM user_id
  );

CREATE POLICY debts_owner_select ON public.debts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY debts_owner_insert ON public.debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY debts_owner_update ON public.debts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY debts_cashier_read ON public.debts
  FOR SELECT USING (
    user_id = public.sella_tenant_owner_id() AND auth.uid() IS DISTINCT FROM user_id
  );

CREATE POLICY debt_items_owner ON public.debt_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY debt_items_cashier_read ON public.debt_items
  FOR SELECT USING (
    user_id = public.sella_tenant_owner_id() AND auth.uid() IS DISTINCT FROM user_id
  );

CREATE POLICY payments_owner ON public.payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY payments_cashier_read ON public.payments
  FOR SELECT USING (
    user_id = public.sella_tenant_owner_id() AND auth.uid() IS DISTINCT FROM user_id
  );

CREATE POLICY sales_owner ON public.sales
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY sales_cashier_read ON public.sales
  FOR SELECT USING (
    user_id = public.sella_tenant_owner_id() AND auth.uid() IS DISTINCT FROM user_id
  );

CREATE POLICY inventory_owner ON public.inventory_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY inventory_cashier_read ON public.inventory_items
  FOR SELECT USING (
    user_id = public.sella_tenant_owner_id() AND auth.uid() IS DISTINCT FROM user_id
  );

CREATE POLICY app_settings_owner ON public.app_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY app_settings_cashier_read ON public.app_settings
  FOR SELECT USING (
    user_id = public.sella_tenant_owner_id() AND auth.uid() IS DISTINCT FROM user_id
  );

CREATE POLICY pos_idempotency_owner ON public.pos_idempotency_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS shop_staff_select_self ON public.shop_staff;
CREATE POLICY shop_staff_select_self ON public.shop_staff
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Owners can manage their own staff rows. The trigger below rejects
-- auth_user_id and current_session_id changes from a signed-in user, so an
-- owner cannot point a row at another shop's cashier.
DROP POLICY IF EXISTS shop_staff_owner_all ON public.shop_staff;
CREATE POLICY shop_staff_owner_all ON public.shop_staff
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());


CREATE OR REPLACE FUNCTION public.create_sale_order(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_uid UUID := public.sella_tenant_owner_id();
  v_cashier UUID;
  v_staff_name TEXT;
  v_key TEXT;
  v_cached JSONB;
  v_client_name TEXT;
  v_phone TEXT;
  v_due DATE;
  v_discount NUMERIC(12,2);
  v_change NUMERIC(12,2);
  v_items JSONB;
  v_pays JSONB;
  v_item JSONB;
  v_pay JSONB;
  v_inv public.inventory_items%ROWTYPE;
  v_qty INT;
  v_qty_num NUMERIC;
  v_already INT := 0;
  v_claimed JSONB := '{}'::jsonb;
  v_unit NUMERIC(12,2);
  v_line NUMERIC(12,2);
  v_merchandise NUMERIC(12,2) := 0;
  v_order_total NUMERIC(12,2);
  v_paid NUMERIC(12,2) := 0;
  v_slice_amt NUMERIC(12,2);
  v_remaining NUMERIC(12,2);
  v_client_id UUID;
  v_debt_id UUID;
  v_receipt TEXT;
  v_status TEXT;
  v_pay_status TEXT;
  v_primary_method TEXT;
  v_now TIMESTAMPTZ := now();
  v_sales JSONB := '[]'::jsonb;
  v_payments JSONB := '[]'::jsonb;
  v_debt JSONB;
  v_sale_id UUID;
  v_pay_id UUID;
  v_idx INT := 0;
  v_response JSONB;
BEGIN
  IF v_actor IS NULL OR v_uid IS NULL THEN
    RAISE EXCEPTION 'No shop access';
  END IF;
  v_cashier := CASE WHEN v_actor IS DISTINCT FROM v_uid THEN v_actor ELSE NULL END;
  IF v_cashier IS NOT NULL THEN
    SELECT s.name INTO v_staff_name
    FROM public.shop_staff s
    WHERE s.auth_user_id = v_cashier
      AND s.owner_id = v_uid
      AND s.status = 'active'
    LIMIT 1;
  END IF;
  IF NOT public.user_has_write_access(v_uid) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Subscription expired — renew to create or edit records';
  END IF;

  v_key := NULLIF(trim(COALESCE(p_payload->>'idempotency_key', '')), '');
  IF v_key IS NOT NULL THEN
    -- Serialize retries (two tabs / a lost response) before any stock movement.
    PERFORM pg_advisory_xact_lock(hashtext(v_uid::text || ':create_sale_order:' || v_key));
    SELECT response INTO v_cached
    FROM public.pos_idempotency_keys
    WHERE user_id = v_uid AND operation = 'create_sale_order' AND idempotency_key = v_key;
    IF v_cached IS NOT NULL THEN
      RETURN v_cached;
    END IF;
  END IF;

  v_items := COALESCE(p_payload->'items', '[]'::jsonb);
  IF jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Hitamo ibicuruzwa';
  END IF;

  v_client_name := NULLIF(trim(COALESCE(p_payload->>'client_name', '')), '');
  v_phone := NULLIF(trim(COALESCE(p_payload->>'phone', '')), '');
  v_discount := ROUND(COALESCE((p_payload->>'discount_amount')::NUMERIC, 0));
  IF v_cashier IS NOT NULL THEN
    v_discount := 0;
  END IF;
  v_change := ROUND(COALESCE((p_payload->>'change_given')::NUMERIC, 0));
  IF v_change < 0 THEN v_change := 0; END IF;
  IF NULLIF(p_payload->>'sold_at', '') IS NOT NULL THEN
    v_now := (p_payload->>'sold_at')::TIMESTAMPTZ;
    IF v_now > now() + interval '5 minutes' THEN
      RAISE EXCEPTION 'Ntushobora kwandika igurisha ry''ejo hazaza';
    END IF;
    IF v_cashier IS NOT NULL AND v_now < now() - interval '15 minutes' THEN
      RAISE EXCEPTION 'Ntushobora kwandika igurisha ryashize';
    END IF;
  END IF;
  IF (p_payload ? 'due_date') AND NULLIF(p_payload->>'due_date', '') IS NOT NULL THEN
    v_due := (p_payload->>'due_date')::DATE;
  ELSE
    v_due := NULL;
  END IF;
  v_pays := COALESCE(p_payload->'payments', '[]'::jsonb);

  -- Lock + validate stock; compute merchandise using inventory cost + sale price
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) AS t(value)
  LOOP
    v_qty_num := COALESCE(NULLIF(v_item->>'quantity', '')::NUMERIC, 0);
    IF v_qty_num < 1 THEN
      RAISE EXCEPTION 'Quantity must be at least 1';
    END IF;
    v_qty := FLOOR(v_qty_num)::INT;

    SELECT * INTO v_inv
    FROM public.inventory_items
    WHERE id = (v_item->>'inventory_item_id')::UUID
      AND user_id = v_uid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Igicuruzwa ntabwo kibonetse';
    END IF;
    v_already := COALESCE((v_claimed->>v_inv.id::text)::INT, 0);
    IF v_inv.quantity < v_qty + v_already THEN
      RAISE EXCEPTION 'Stock ya % ntihagije', v_inv.item_name;
    END IF;
    v_claimed := jsonb_set(v_claimed, ARRAY[v_inv.id::text], to_jsonb(v_already + v_qty), true);

    -- Cashiers pay the inventory price. Owners may still pass a unit price.
    IF v_cashier IS NOT NULL OR NOT (v_item ? 'unit_price' AND NULLIF(v_item->>'unit_price', '') IS NOT NULL) THEN
      v_unit := ROUND(GREATEST(0, COALESCE(v_inv.selling_price, 0)));
    ELSE
      v_unit := ROUND(GREATEST(0, (v_item->>'unit_price')::NUMERIC));
    END IF;
    v_line := v_unit * v_qty;
    v_merchandise := v_merchandise + v_line;
  END LOOP;

  IF v_discount < 0 THEN v_discount := 0; END IF;
  IF v_discount > v_merchandise THEN v_discount := v_merchandise; END IF;
  v_order_total := GREATEST(0, v_merchandise - v_discount);

  -- Normalize payments (cap total paid to order total)
  IF jsonb_typeof(v_pays) = 'array' THEN
    FOR v_pay IN SELECT value FROM jsonb_array_elements(v_pays) AS t(value)
    LOOP
      v_slice_amt := ROUND(GREATEST(0, COALESCE((v_pay->>'amount')::NUMERIC, 0)));
      v_paid := v_paid + v_slice_amt;
    END LOOP;
  END IF;
  IF v_paid > v_order_total THEN
    v_paid := v_order_total;
  END IF;
  v_remaining := v_order_total - v_paid;

  IF v_remaining > 0 AND (v_client_name IS NULL OR v_client_name = '') THEN
    RAISE EXCEPTION 'Izina ry''umukiriya rirakenewe ku ideni';
  END IF;
  IF v_client_name IS NULL OR v_client_name = '' THEN
    v_client_name := 'Walk-in';
  END IF;

  -- Client upsert (tenant-scoped)
  SELECT id INTO v_client_id
  FROM public.clients
  WHERE user_id = v_uid AND lower(name) = lower(v_client_name)
  LIMIT 1;

  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (user_id, name, phone, phone_normalized)
    VALUES (
      v_uid,
      v_client_name,
      v_phone,
      CASE WHEN v_phone IS NULL THEN NULL ELSE regexp_replace(v_phone, '\D', '', 'g') END
    )
    RETURNING id INTO v_client_id;
  ELSIF v_phone IS NOT NULL THEN
    UPDATE public.clients
    SET phone = COALESCE(phone, v_phone),
        phone_normalized = COALESCE(phone_normalized, regexp_replace(v_phone, '\D', '', 'g')),
        updated_at = v_now
    WHERE id = v_client_id AND user_id = v_uid;
  END IF;

  IF v_remaining <= 0 THEN
    v_status := 'paid';
    v_pay_status := 'paid';
  ELSIF v_paid > 0 THEN
    v_status := 'active';
    v_pay_status := 'partial';
  ELSE
    v_status := 'active';
    v_pay_status := 'credit';
  END IF;

  v_receipt := 'R-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_primary_method := NULL;
  IF jsonb_typeof(v_pays) = 'array' AND jsonb_array_length(v_pays) > 0 THEN
    v_primary_method := NULLIF(v_pays->0->>'method', '');
  END IF;

  INSERT INTO public.debts (
    user_id, client_id, total_amount, remaining_balance, due_date, status, paid_at,
    discount_amount, receipt_number, change_given, created_at, updated_at
  ) VALUES (
    v_uid, v_client_id, v_order_total, v_remaining, v_due, v_status,
    CASE WHEN v_remaining <= 0 THEN v_now ELSE NULL END,
    v_discount, v_receipt, v_change, v_now, v_now
  )
  RETURNING id INTO v_debt_id;

  -- Deduct stock + write debt_items + sales
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) AS t(value)
  LOOP
    v_qty_num := COALESCE(NULLIF(v_item->>'quantity', '')::NUMERIC, 0);
    IF v_qty_num < 1 THEN
      RAISE EXCEPTION 'Quantity must be at least 1';
    END IF;
    v_qty := FLOOR(v_qty_num)::INT;
    SELECT * INTO v_inv
    FROM public.inventory_items
    WHERE id = (v_item->>'inventory_item_id')::UUID AND user_id = v_uid
    FOR UPDATE;

    UPDATE public.inventory_items
    SET quantity = quantity - v_qty, updated_at = v_now
    WHERE id = v_inv.id AND user_id = v_uid AND quantity >= v_qty;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock ya % ntihagije', v_inv.item_name;
    END IF;

    IF v_cashier IS NOT NULL OR NOT (v_item ? 'unit_price' AND NULLIF(v_item->>'unit_price', '') IS NOT NULL) THEN
      v_unit := ROUND(GREATEST(0, COALESCE(v_inv.selling_price, 0)));
    ELSE
      v_unit := ROUND(GREATEST(0, (v_item->>'unit_price')::NUMERIC));
    END IF;

    INSERT INTO public.debt_items (
      user_id, debt_id, inventory_item_id, item_name, quantity, unit_price, created_at
    ) VALUES (
      v_uid, v_debt_id, v_inv.id, v_inv.item_name, v_qty, v_unit, v_now
    );

    INSERT INTO public.sales (
      user_id, client_id, inventory_item_id, item_name, quantity, cost_price, sale_price,
      payment_method, payment_status, debt_id, cashier_user_id, cashier_name, created_at
    ) VALUES (
      v_uid, v_client_id, v_inv.id, v_inv.item_name, v_qty,
      ROUND(COALESCE(v_inv.cost_price, 0)), v_unit,
      v_primary_method, v_pay_status, v_debt_id, v_cashier,
      CASE WHEN v_cashier IS NULL THEN NULL ELSE v_staff_name END,
      v_now
    )
    RETURNING id INTO v_sale_id;

    v_sales := v_sales || jsonb_build_array(jsonb_build_object(
      'id', v_sale_id,
      'item_name', v_inv.item_name,
      'quantity', v_qty,
      'sale_price', v_unit,
      'payment_status', v_pay_status,
      'debt_id', v_debt_id
    ));
  END LOOP;

  -- Payments (re-walk with running remaining to avoid overpay on split)
  v_paid := 0;
  IF jsonb_typeof(v_pays) = 'array' THEN
    FOR v_pay IN SELECT value FROM jsonb_array_elements(v_pays) AS t(value)
    LOOP
      v_slice_amt := ROUND(GREATEST(0, COALESCE((v_pay->>'amount')::NUMERIC, 0)));
      IF v_slice_amt <= 0 THEN CONTINUE; END IF;
      IF v_paid + v_slice_amt > v_order_total THEN
        v_slice_amt := v_order_total - v_paid;
      END IF;
      IF v_slice_amt <= 0 THEN CONTINUE; END IF;
      IF COALESCE(NULLIF(v_pay->>'method', ''), 'cash') NOT IN ('cash', 'momo', 'airtel', 'bank') THEN
        RAISE EXCEPTION 'Uburyo bwo kwishyura ntibwemewe';
      END IF;
      v_idx := v_idx + 1;
      INSERT INTO public.payments (
        user_id, debt_id, client_id, amount, payment_method, reference_number, notes, cashier_user_id, created_at
      ) VALUES (
        v_uid, v_debt_id, v_client_id, v_slice_amt,
        COALESCE(NULLIF(v_pay->>'method', ''), 'cash'),
        NULLIF(v_pay->>'reference_number', ''),
        CASE
          WHEN jsonb_array_length(v_pays) > 1 AND v_idx = 1 THEN 'Split payment at sale'
          WHEN v_remaining > 0 THEN 'Partial payment at sale'
          ELSE 'Payment at sale'
        END,
        v_cashier,
        v_now
      )
      RETURNING id INTO v_pay_id;
      v_paid := v_paid + v_slice_amt;
      v_payments := v_payments || jsonb_build_array(jsonb_build_object(
        'id', v_pay_id,
        'amount', v_slice_amt,
        'payment_method', COALESCE(NULLIF(v_pay->>'method', ''), 'cash')
      ));
    END LOOP;
  END IF;
  v_remaining := v_order_total - v_paid;

  SELECT to_jsonb(d.*) INTO v_debt FROM public.debts d WHERE d.id = v_debt_id;

  PERFORM public.write_financial_audit(
    'debt', v_debt_id, 'create_sale_order', v_order_total,
    jsonb_build_object(
      'paid', v_paid,
      'remaining', v_remaining,
      'receipt_number', v_receipt,
      'item_count', jsonb_array_length(v_items)
    )
  );

  v_response := jsonb_build_object(
    'debt', v_debt,
    'sales', v_sales,
    'payments', v_payments,
    'paid', v_paid,
    'remaining', v_remaining,
    'changeDue', v_change,
    'receiptNumber', v_receipt
  );

  IF v_key IS NOT NULL THEN
    INSERT INTO public.pos_idempotency_keys (user_id, idempotency_key, operation, response)
    VALUES (v_uid, v_key, 'create_sale_order', v_response)
    ON CONFLICT (user_id, operation, idempotency_key) DO NOTHING;
  END IF;

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_payment(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_uid UUID := public.sella_tenant_owner_id();
  v_cashier UUID;
  v_key TEXT;
  v_cached JSONB;
  v_debt_id UUID;
  v_amount NUMERIC(12,2);
  v_method TEXT;
  v_notes TEXT;
  v_ref TEXT;
  v_debt public.debts%ROWTYPE;
  v_remaining NUMERIC(12,2);
  v_pay_id UUID;
  v_now TIMESTAMPTZ := now();
  v_status TEXT;
  v_response JSONB;
BEGIN
  IF v_actor IS NULL OR v_uid IS NULL THEN RAISE EXCEPTION 'No shop access'; END IF;
  v_cashier := CASE WHEN v_actor IS DISTINCT FROM v_uid THEN v_actor ELSE NULL END;
  IF NOT public.user_has_write_access(v_uid) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Subscription expired — renew to create or edit records';
  END IF;

  v_key := NULLIF(trim(COALESCE(p_payload->>'idempotency_key', '')), '');
  IF v_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(v_uid::text || ':record_payment:' || v_key));
    SELECT response INTO v_cached
    FROM public.pos_idempotency_keys
    WHERE user_id = v_uid AND operation = 'record_payment' AND idempotency_key = v_key;
    IF v_cached IS NOT NULL THEN RETURN v_cached; END IF;
  END IF;

  v_debt_id := (p_payload->>'debt_id')::UUID;
  v_amount := ROUND(COALESCE((p_payload->>'amount')::NUMERIC, 0));
  v_method := COALESCE(NULLIF(p_payload->>'payment_method', ''), 'cash');
  IF v_method NOT IN ('cash', 'momo', 'airtel', 'bank') THEN
    RAISE EXCEPTION 'Uburyo bwo kwishyura ntibwemewe';
  END IF;
  v_notes := NULLIF(p_payload->>'notes', '');
  v_ref := NULLIF(trim(COALESCE(p_payload->>'reference_number', '')), '');

  IF v_amount <= 0 THEN RAISE EXCEPTION 'Amafaranga ntayemewe'; END IF;

  SELECT * INTO v_debt
  FROM public.debts
  WHERE id = v_debt_id AND user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ideni ntiribonetse'; END IF;
  IF v_amount > v_debt.remaining_balance THEN
    RAISE EXCEPTION 'Amafaranga arenza ideni';
  END IF;
  IF v_ref IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.user_id = v_uid
      AND p.debt_id = v_debt.id
      AND p.reference_number IS NOT NULL
      AND lower(trim(p.reference_number)) = lower(v_ref)
  ) THEN
    RAISE EXCEPTION 'Iyi reference yamaze gukoreshwa kuri iri deni';
  END IF;
  IF v_method = 'momo' AND v_ref IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(v_uid::text || ':momo-ref:' || lower(v_ref)));
    IF EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.user_id = v_uid
        AND p.debt_id IS DISTINCT FROM v_debt.id
        AND p.payment_method = 'momo'
        AND p.reference_number IS NOT NULL
        AND length(trim(p.reference_number)) > 0
        AND lower(trim(p.reference_number)) = lower(v_ref)
    ) THEN
      RAISE EXCEPTION 'Iyi reference ya MoMo yamaze gukoreshwa muri iyi shop';
    END IF;
  END IF;

  v_remaining := v_debt.remaining_balance - v_amount;
  v_status := CASE WHEN v_remaining <= 0 THEN 'paid' ELSE 'partial' END;

  INSERT INTO public.payments (
    user_id, debt_id, client_id, amount, payment_method, reference_number, notes, cashier_user_id, created_at
  ) VALUES (
    v_uid, v_debt.id, v_debt.client_id, v_amount, v_method, v_ref, v_notes, v_cashier, v_now
  )
  RETURNING id INTO v_pay_id;

  UPDATE public.debts
  SET remaining_balance = v_remaining,
      status = CASE WHEN v_remaining <= 0 THEN 'paid' ELSE 'active' END,
      paid_at = CASE WHEN v_remaining <= 0 THEN v_now ELSE paid_at END,
      updated_at = v_now
  WHERE id = v_debt.id AND user_id = v_uid;

  UPDATE public.sales
  SET payment_status = CASE WHEN v_remaining <= 0 THEN 'paid' ELSE 'partial' END,
      payment_method = v_method
  WHERE debt_id = v_debt.id AND user_id = v_uid;

  PERFORM public.write_financial_audit(
    'payment', v_pay_id, 'record_payment', v_amount,
    jsonb_build_object(
      'debt_id', v_debt.id,
      'previous_remaining', v_debt.remaining_balance,
      'new_remaining', v_remaining,
      'cashier_user_id', v_cashier
    )
  );

  v_response := jsonb_build_object(
    'id', v_pay_id,
    'debt_id', v_debt.id,
    'client_id', v_debt.client_id,
    'amount', v_amount,
    'payment_method', v_method,
    'reference_number', v_ref,
    'notes', v_notes,
    'created_at', v_now,
    'remaining_balance', v_remaining,
    'payment_status', v_status
  );

  IF v_key IS NOT NULL THEN
    INSERT INTO public.pos_idempotency_keys (user_id, idempotency_key, operation, response)
    VALUES (v_uid, v_key, 'record_payment', v_response)
    ON CONFLICT (user_id, operation, idempotency_key) DO NOTHING;
  END IF;

  RETURN v_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_inventory(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_delta INT;
  v_reason TEXT;
  v_inv public.inventory_items%ROWTYPE;
  v_new INT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.sella_is_shop_owner() AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Only the shop owner can do this';
  END IF;
  IF NOT public.user_has_write_access(v_uid) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Subscription expired — renew to create or edit records';
  END IF;

  v_id := (p_payload->>'inventory_item_id')::UUID;
  v_delta := COALESCE((p_payload->>'delta')::INT, 0);
  v_reason := COALESCE(NULLIF(p_payload->>'reason', ''), 'manual_adjustment');
  IF v_delta = 0 THEN RAISE EXCEPTION 'Delta must be non-zero'; END IF;

  SELECT * INTO v_inv FROM public.inventory_items
  WHERE id = v_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Igicuruzwa ntabwo kibonetse'; END IF;

  v_new := v_inv.quantity + v_delta;
  IF v_new < 0 THEN RAISE EXCEPTION 'Stock ntishobora kuba negative'; END IF;

  UPDATE public.inventory_items
  SET quantity = v_new, updated_at = now()
  WHERE id = v_id AND user_id = v_uid;

  PERFORM public.write_financial_audit(
    'inventory', v_id, 'adjust_inventory', NULL,
    jsonb_build_object(
      'previous_quantity', v_inv.quantity,
      'delta', v_delta,
      'new_quantity', v_new,
      'reason', v_reason
    )
  );

  RETURN jsonb_build_object(
    'id', v_id,
    'previous_quantity', v_inv.quantity,
    'quantity', v_new,
    'delta', v_delta
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_sale_return(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_debt_id UUID;
  v_amount NUMERIC(12,2);
  v_method TEXT;
  v_reason TEXT;
  v_restock BOOLEAN;
  v_debt public.debts%ROWTYPE;
  v_refund_id UUID;
  v_item RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.sella_is_shop_owner() AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Only the shop owner can do this';
  END IF;
  IF NOT public.user_has_write_access(v_uid) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Subscription expired — renew to create or edit records';
  END IF;

  v_debt_id := (p_payload->>'debt_id')::UUID;
  v_amount := ROUND(COALESCE((p_payload->>'amount')::NUMERIC, 0));
  v_method := COALESCE(NULLIF(p_payload->>'payment_method', ''), 'cash');
  v_reason := NULLIF(p_payload->>'reason', '');
  v_restock := COALESCE((p_payload->>'restock')::BOOLEAN, true);
  IF v_amount <= 0 THEN RAISE EXCEPTION 'Amafaranga ntayemewe'; END IF;

  SELECT * INTO v_debt FROM public.debts
  WHERE id = v_debt_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ideni ntiribonetse'; END IF;

  INSERT INTO public.sale_refunds (
    user_id, debt_id, amount, reason, payment_method, restock
  ) VALUES (
    v_uid, v_debt_id, v_amount, v_reason, v_method, v_restock
  )
  RETURNING id INTO v_refund_id;

  IF v_restock THEN
    FOR v_item IN
      SELECT inventory_item_id, quantity
      FROM public.debt_items
      WHERE debt_id = v_debt_id AND user_id = v_uid AND inventory_item_id IS NOT NULL
    LOOP
      UPDATE public.inventory_items
      SET quantity = quantity + v_item.quantity, updated_at = now()
      WHERE id = v_item.inventory_item_id AND user_id = v_uid;
    END LOOP;
  END IF;

  PERFORM public.write_financial_audit(
    'refund', v_refund_id, 'process_sale_return', v_amount,
    jsonb_build_object('debt_id', v_debt_id, 'restock', v_restock, 'reason', v_reason)
  );

  RETURN jsonb_build_object(
    'id', v_refund_id,
    'debt_id', v_debt_id,
    'amount', v_amount,
    'restock', v_restock
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_debt_owner(p_debt_id UUID, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
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
  IF NOT public.sella_is_shop_owner() AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Only the shop owner can do this';
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
  WHERE id = p_debt_id AND user_id = v_uid
  FOR UPDATE;
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

-- Signed-in users cannot point a staff row at another auth user or choose
-- which session is valid. Revoking, deactivating, or changing the PIN clears
-- the current session. Service role (auth.uid() is null) may bind both.
CREATE OR REPLACE FUNCTION public.shop_staff_protect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the shop owner can manage staff';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.auth_user_id := NULL;
    NEW.current_session_id := NULL;
    RETURN NEW;
  END IF;
  NEW.id := OLD.id;
  NEW.owner_id := OLD.owner_id;
  NEW.auth_user_id := OLD.auth_user_id;
  NEW.current_session_id := OLD.current_session_id;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.session_revoked_at IS DISTINCT FROM OLD.session_revoked_at
     OR NEW.pin_hash IS DISTINCT FROM OLD.pin_hash THEN
    NEW.current_session_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_staff_protect_trg ON public.shop_staff;
CREATE TRIGGER shop_staff_protect_trg
  BEFORE INSERT OR UPDATE ON public.shop_staff
  FOR EACH ROW EXECUTE FUNCTION public.shop_staff_protect();

CREATE OR REPLACE FUNCTION public.sella_stamp_sale_actor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_owner UUID := public.sella_tenant_owner_id();
  v_name TEXT;
BEGIN
  IF v_actor IS NULL OR v_owner IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.cashier_user_id := OLD.cashier_user_id;
    NEW.cashier_name := OLD.cashier_name;
    RETURN NEW;
  END IF;
  IF v_actor IS DISTINCT FROM v_owner THEN
    SELECT s.name INTO v_name
    FROM public.shop_staff s
    WHERE s.auth_user_id = v_actor
      AND s.owner_id = v_owner
      AND s.status = 'active'
    LIMIT 1;
    NEW.cashier_user_id := v_actor;
    NEW.cashier_name := v_name;
    RETURN NEW;
  END IF;
  IF NEW.cashier_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shop_staff s
    WHERE s.auth_user_id = NEW.cashier_user_id
      AND s.owner_id = v_owner
  ) THEN
    NEW.cashier_user_id := NULL;
    NEW.cashier_name := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sella_stamp_payment_actor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_owner UUID := public.sella_tenant_owner_id();
BEGIN
  IF v_actor IS NULL OR v_owner IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.cashier_user_id := OLD.cashier_user_id;
    RETURN NEW;
  END IF;
  IF v_actor IS DISTINCT FROM v_owner THEN
    NEW.cashier_user_id := v_actor;
  ELSIF NEW.cashier_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shop_staff s
    WHERE s.auth_user_id = NEW.cashier_user_id
      AND s.owner_id = v_owner
  ) THEN
    NEW.cashier_user_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_stamp_cashier ON public.sales;
CREATE TRIGGER sales_stamp_cashier
  BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.sella_stamp_sale_actor();

DROP TRIGGER IF EXISTS payments_stamp_cashier ON public.payments;
CREATE TRIGGER payments_stamp_cashier
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.sella_stamp_payment_actor();

-- Subscription is the shop owner's, not a cashier's personal trial.
CREATE OR REPLACE FUNCTION public.enforce_write_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_owner UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_owner := public.sella_tenant_owner_id();
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No shop access';
  END IF;
  IF NOT public.user_has_write_access(v_owner) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Subscription expired — renew to create or edit records';
  END IF;
  IF NEW.user_id IS NULL THEN
    NEW.user_id := v_owner;
  ELSIF NEW.user_id IS DISTINCT FROM v_owner AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'No shop access';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.write_financial_audit(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_amount NUMERIC,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_shop UUID := public.sella_tenant_owner_id();
BEGIN
  IF v_actor IS NULL OR v_shop IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.financial_audit_log (
    user_id, actor_user_id, shop_user_id, entity_type, entity_id, action, amount, metadata
  ) VALUES (
    v_shop,
    v_actor,
    v_shop,
    p_entity_type,
    p_entity_id,
    p_action,
    p_amount,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('actor_user_id', v_actor)
  );
END;
$$;

DROP POLICY IF EXISTS financial_audit_tenant ON public.financial_audit_log;
CREATE POLICY financial_audit_tenant ON public.financial_audit_log
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = shop_user_id
    OR public.is_superadmin()
  );

-- Staff auth users are not shops. Do not give them a profile or a trial.
CREATE OR REPLACE FUNCTION public.handle_new_user_saas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_phone TEXT := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_phone_n TEXT := COALESCE(NEW.raw_user_meta_data->>'phone_normalized', '');
  v_biz TEXT := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Shop');
  v_owner TEXT := COALESCE(NEW.raw_user_meta_data->>'owner_name', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  v_email TEXT := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');
  v_nid TEXT := COALESCE(NEW.raw_user_meta_data->>'national_id', '');
BEGIN
  IF COALESCE(NEW.email, '') ILIKE '%@staff.sella.app'
     OR COALESCE(NEW.raw_app_meta_data->>'role', '') = 'cashier' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (
    user_id, business_name, owner_name, phone, phone_normalized,
    email, email_normalized, national_id, shop_code
  )
  VALUES (
    NEW.id, v_biz, v_owner, v_phone, v_phone_n,
    NULLIF(v_email, ''), lower(NULLIF(v_email, '')), NULLIF(v_nid, ''),
    public.generate_shop_code()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    owner_name = COALESCE(EXCLUDED.owner_name, public.profiles.owner_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    phone_normalized = COALESCE(NULLIF(EXCLUDED.phone_normalized, ''), public.profiles.phone_normalized),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    email_normalized = COALESCE(EXCLUDED.email_normalized, public.profiles.email_normalized),
    national_id = COALESCE(EXCLUDED.national_id, public.profiles.national_id),
    shop_code = COALESCE(public.profiles.shop_code, EXCLUDED.shop_code),
    updated_at = now();

  INSERT INTO public.user_subscriptions (user_id, plan_tier, status, trial_ends_at, current_period_end)
  VALUES (NEW.id, 'trial', 'trialing', now() + interval '7 days', now() + interval '7 days')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id OR public.is_superadmin())
    AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IS DISTINCT FROM 'cashier'
  );

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (
    (auth.uid() = user_id OR public.is_superadmin())
    AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IS DISTINCT FROM 'cashier'
  )
  WITH CHECK (
    (auth.uid() = user_id OR public.is_superadmin())
    AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IS DISTINCT FROM 'cashier'
  );

DROP POLICY IF EXISTS profiles_delete ON public.profiles;
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE
  USING (
    (auth.uid() = user_id OR public.is_superadmin())
    AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IS DISTINCT FROM 'cashier'
  );

DROP POLICY IF EXISTS user_subs_insert ON public.user_subscriptions;
CREATE POLICY user_subs_insert ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id OR public.is_superadmin())
    AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IS DISTINCT FROM 'cashier'
  );

-- Do not let a cashier SELECT profiles or user_subscriptions. Those rows include
-- the owner's phone, email, national id, and billing dates.
DROP POLICY IF EXISTS profiles_cashier_read ON public.profiles;
DROP POLICY IF EXISTS user_subs_cashier_read ON public.user_subscriptions;

-- pin_hash is an unsalted 4-digit digest. Hide it from the browser.
REVOKE ALL ON TABLE public.shop_staff FROM anon, authenticated;
GRANT SELECT (
  id, owner_id, shop_code, name, phone, phone_normalized, role, status,
  last_active_at, session_revoked_at, current_session_id, auth_user_id,
  created_at, updated_at
) ON public.shop_staff TO authenticated;
GRANT INSERT (
  id, owner_id, shop_code, name, phone, phone_normalized, role, status, created_at, updated_at
) ON public.shop_staff TO authenticated;
GRANT UPDATE (
  name, phone, phone_normalized, role, status, last_active_at, session_revoked_at, updated_at
) ON public.shop_staff TO authenticated;
GRANT DELETE ON public.shop_staff TO authenticated;

REVOKE ALL ON FUNCTION public.sella_is_shop_owner() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sella_tenant_owner_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_sale_order(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_payment(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.adjust_inventory(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.process_sale_return(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_debt_owner(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_has_write_access(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.shop_staff_protect() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sella_stamp_sale_actor() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sella_stamp_payment_actor() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.write_financial_audit(TEXT, UUID, TEXT, NUMERIC, JSONB) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.sella_is_shop_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sella_tenant_owner_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sale_order(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_inventory(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_sale_return(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_debt_owner(UUID, TEXT) TO authenticated;
