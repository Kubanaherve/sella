-- Phase 1: Atomic POS financial operations (sale + payment + inventory + audit).
-- Additive only. Does not drop tenant data.
-- Apply after 20261112060000 and 20261112160000.

-- ---------------------------------------------------------------------------
-- Constraints (safe if already present)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_items_quantity_nonneg'
  ) THEN
    ALTER TABLE public.inventory_items
      ADD CONSTRAINT inventory_items_quantity_nonneg CHECK (quantity >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'debts_remaining_nonneg'
  ) THEN
    ALTER TABLE public.debts
      ADD CONSTRAINT debts_remaining_nonneg CHECK (remaining_balance >= 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Idempotency + append-only financial audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pos_idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  operation TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, operation, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.financial_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shop_user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  amount NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'RWF',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_audit_log_user_created_idx
  ON public.financial_audit_log (user_id, created_at DESC);

ALTER TABLE public.pos_idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_idempotency_tenant ON public.pos_idempotency_keys;
CREATE POLICY pos_idempotency_tenant ON public.pos_idempotency_keys FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS financial_audit_tenant ON public.financial_audit_log;
CREATE POLICY financial_audit_tenant ON public.financial_audit_log FOR SELECT
  USING (auth.uid() = user_id OR public.is_superadmin());
-- Inserts only via SECURITY DEFINER RPCs (no direct client insert policy)

CREATE OR REPLACE FUNCTION public.write_financial_audit(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_amount NUMERIC,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.financial_audit_log (
    user_id, actor_user_id, shop_user_id, entity_type, entity_id, action, amount, metadata
  ) VALUES (
    v_uid, v_uid, v_uid, p_entity_type, p_entity_id, p_action, p_amount, COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- create_sale_order — single transaction
-- Payload:
-- {
--   "idempotency_key": "optional-uuid",
--   "client_name": "Jean",
--   "phone": "+2507...",
--   "due_date": null,
--   "discount_amount": 0,
--   "change_given": 0,
--   "payments": [{"method":"cash","amount":1000,"reference_number":null}],
--   "items": [{"inventory_item_id":"...","quantity":1,"unit_price":null}]
-- }
-- unit_price null → use inventory selling_price (authoritative default)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_sale_order(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
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
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.user_has_write_access(v_uid) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Subscription expired — renew to create or edit records';
  END IF;

  v_key := NULLIF(trim(COALESCE(p_payload->>'idempotency_key', '')), '');
  IF v_key IS NOT NULL THEN
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
  v_change := ROUND(COALESCE((p_payload->>'change_given')::NUMERIC, 0));
  IF (p_payload ? 'due_date') AND NULLIF(p_payload->>'due_date', '') IS NOT NULL THEN
    v_due := (p_payload->>'due_date')::DATE;
  ELSE
    v_due := NULL;
  END IF;
  v_pays := COALESCE(p_payload->'payments', '[]'::jsonb);

  -- Lock + validate stock; compute merchandise using inventory cost + sale price
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) AS t(value)
  LOOP
    v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::INT, 0));
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    SELECT * INTO v_inv
    FROM public.inventory_items
    WHERE id = (v_item->>'inventory_item_id')::UUID
      AND user_id = v_uid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Igicuruzwa ntabwo kibonetse';
    END IF;
    IF v_inv.quantity < v_qty THEN
      RAISE EXCEPTION 'Stock ya % ntihagije', v_inv.item_name;
    END IF;

    -- Prefer explicit unit_price if provided; else inventory selling_price
    IF v_item ? 'unit_price' AND NULLIF(v_item->>'unit_price', '') IS NOT NULL THEN
      v_unit := ROUND(GREATEST(0, (v_item->>'unit_price')::NUMERIC));
    ELSE
      v_unit := ROUND(GREATEST(0, COALESCE(v_inv.selling_price, 0)));
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
    v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::INT, 0));
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

    IF v_item ? 'unit_price' AND NULLIF(v_item->>'unit_price', '') IS NOT NULL THEN
      v_unit := ROUND(GREATEST(0, (v_item->>'unit_price')::NUMERIC));
    ELSE
      v_unit := ROUND(GREATEST(0, COALESCE(v_inv.selling_price, 0)));
    END IF;

    INSERT INTO public.debt_items (
      user_id, debt_id, inventory_item_id, item_name, quantity, unit_price, created_at
    ) VALUES (
      v_uid, v_debt_id, v_inv.id, v_inv.item_name, v_qty, v_unit, v_now
    );

    INSERT INTO public.sales (
      user_id, client_id, inventory_item_id, item_name, quantity, cost_price, sale_price,
      payment_method, payment_status, debt_id, created_at
    ) VALUES (
      v_uid, v_client_id, v_inv.id, v_inv.item_name, v_qty,
      ROUND(COALESCE(v_inv.cost_price, 0)), v_unit,
      v_primary_method, v_pay_status, v_debt_id, v_now
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
      v_idx := v_idx + 1;
      INSERT INTO public.payments (
        user_id, debt_id, client_id, amount, payment_method, reference_number, notes, created_at
      ) VALUES (
        v_uid, v_debt_id, v_client_id, v_slice_amt,
        COALESCE(NULLIF(v_pay->>'method', ''), 'cash'),
        NULLIF(v_pay->>'reference_number', ''),
        CASE
          WHEN jsonb_array_length(v_pays) > 1 AND v_idx = 1 THEN 'Split payment at sale'
          WHEN v_remaining > 0 THEN 'Partial payment at sale'
          ELSE 'Payment at sale'
        END,
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

-- ---------------------------------------------------------------------------
-- record_payment — lock debt row, insert payment, update balance atomically
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_payment(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
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
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.user_has_write_access(v_uid) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Subscription expired — renew to create or edit records';
  END IF;

  v_key := NULLIF(trim(COALESCE(p_payload->>'idempotency_key', '')), '');
  IF v_key IS NOT NULL THEN
    SELECT response INTO v_cached
    FROM public.pos_idempotency_keys
    WHERE user_id = v_uid AND operation = 'record_payment' AND idempotency_key = v_key;
    IF v_cached IS NOT NULL THEN RETURN v_cached; END IF;
  END IF;

  v_debt_id := (p_payload->>'debt_id')::UUID;
  v_amount := ROUND(COALESCE((p_payload->>'amount')::NUMERIC, 0));
  v_method := COALESCE(NULLIF(p_payload->>'payment_method', ''), 'cash');
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

  v_remaining := v_debt.remaining_balance - v_amount;
  v_status := CASE WHEN v_remaining <= 0 THEN 'paid' ELSE 'partial' END;

  INSERT INTO public.payments (
    user_id, debt_id, client_id, amount, payment_method, reference_number, notes, created_at
  ) VALUES (
    v_uid, v_debt.id, v_debt.client_id, v_amount, v_method, v_ref, v_notes, v_now
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
      'new_remaining', v_remaining
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

-- Alias: credit-first checkout is create_sale_order with unpaid remainder
CREATE OR REPLACE FUNCTION public.record_credit_transaction(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.create_sale_order(p_payload);
END;
$$;

-- ---------------------------------------------------------------------------
-- adjust_inventory — controlled stock change with audit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_inventory(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- ---------------------------------------------------------------------------
-- process_sale_return — refund row + optional restock (controlled reversal)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_sale_return(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.create_sale_order(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_credit_transaction(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_inventory(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_sale_return(JSONB) TO authenticated;
-- write_financial_audit is for other SECURITY DEFINER functions only
REVOKE ALL ON FUNCTION public.write_financial_audit(TEXT, UUID, TEXT, NUMERIC, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.write_financial_audit(TEXT, UUID, TEXT, NUMERIC, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.write_financial_audit(TEXT, UUID, TEXT, NUMERIC, JSONB) TO postgres;
