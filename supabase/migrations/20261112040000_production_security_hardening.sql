-- Production security hardening for Sella SaaS (user_id model).
-- Apply AFTER 20261112010000 + 20261112020000 + 20261112030000.

-- ---------------------------------------------------------------------------
-- Billing: users must NOT be able to self-activate subscriptions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS user_subs_update ON public.user_subscriptions;
DROP POLICY IF EXISTS user_subs_insert ON public.user_subscriptions;
DROP POLICY IF EXISTS sub_pay_update ON public.subscription_payments;

-- Users can read their subscription; inserts only for bootstrap edge cases (ignore duplicates via upsert with service role preferred)
CREATE POLICY user_subs_insert ON public.user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'trialing'
    AND plan_tier = 'trial'
  );

-- No client UPDATE on subscriptions — only service_role / edge functions
-- (service_role bypasses RLS)

-- Payments: users may insert pending only; no status upgrades from client
DROP POLICY IF EXISTS sub_pay_insert ON public.subscription_payments;
CREATE POLICY sub_pay_insert ON public.subscription_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Users may update only their own pending payment metadata (proof URL), never status→successful
CREATE POLICY sub_pay_update_pending_proof ON public.subscription_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- ---------------------------------------------------------------------------
-- Rate-limit table for PIN / auth abuse
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key TEXT NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bucket_key)
);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
-- No client policies — service_role only

CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_bucket TEXT,
  p_max_attempts INT DEFAULT 8,
  p_window_seconds INT DEFAULT 900,
  p_lock_seconds INT DEFAULT 900
)
RETURNS TABLE (allowed BOOLEAN, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.auth_rate_limits%ROWTYPE;
  now_ts TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO row FROM public.auth_rate_limits WHERE bucket_key = p_bucket FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.auth_rate_limits (bucket_key, attempt_count, window_started_at)
    VALUES (p_bucket, 1, now_ts);
    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;

  IF row.locked_until IS NOT NULL AND row.locked_until > now_ts THEN
    RETURN QUERY SELECT false, GREATEST(1, EXTRACT(EPOCH FROM (row.locked_until - now_ts))::INT);
    RETURN;
  END IF;

  IF row.window_started_at + make_interval(secs => p_window_seconds) < now_ts THEN
    UPDATE public.auth_rate_limits
    SET attempt_count = 1, window_started_at = now_ts, locked_until = NULL, updated_at = now_ts
    WHERE bucket_key = p_bucket;
    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;

  IF row.attempt_count >= p_max_attempts THEN
    UPDATE public.auth_rate_limits
    SET locked_until = now_ts + make_interval(secs => p_lock_seconds), updated_at = now_ts
    WHERE bucket_key = p_bucket;
    RETURN QUERY SELECT false, p_lock_seconds;
    RETURN;
  END IF;

  UPDATE public.auth_rate_limits
  SET attempt_count = attempt_count + 1, updated_at = now_ts
  WHERE bucket_key = p_bucket;
  RETURN QUERY SELECT true, 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_auth_rate_limit(TEXT, INT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, INT, INT, INT) TO service_role;

-- ---------------------------------------------------------------------------
-- Import clients for user_id SaaS model (replaces workspace RPC usage)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.import_clients_for_user(p_rows JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  r JSONB;
  v_name TEXT;
  v_phone TEXT;
  inserted INT := 0;
  skipped INT := 0;
  invalid INT := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.user_has_write_access(uid) THEN
    RAISE EXCEPTION 'Subscription expired';
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(COALESCE(p_rows, '[]'::jsonb))
  LOOP
    v_name := trim(COALESCE(r->>'name', ''));
    v_phone := NULLIF(trim(COALESCE(r->>'phone', '')), '');
    IF v_name = '' THEN
      invalid := invalid + 1;
      CONTINUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.user_id = uid AND lower(c.name) = lower(v_name)
        AND COALESCE(c.phone, '') = COALESCE(v_phone, '')
    ) THEN
      skipped := skipped + 1;
      CONTINUE;
    END IF;
    INSERT INTO public.clients (user_id, name, phone, phone_normalized)
    VALUES (
      uid,
      v_name,
      v_phone,
      CASE WHEN v_phone IS NULL THEN NULL ELSE regexp_replace(v_phone, '[^0-9+]', '', 'g') END
    );
    inserted := inserted + 1;
  END LOOP;

  RETURN jsonb_build_object('inserted', inserted, 'skipped', skipped, 'invalid', invalid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.import_clients_for_user(JSONB) TO authenticated;
