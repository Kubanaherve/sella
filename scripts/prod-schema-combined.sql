-- Sella multi-tenant SaaS: WhatsApp OTP auth, Paypack MoMo, manual bank, receipts.
-- Apply on a dedicated Supabase project (alongside or after workspace migration).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (user-scoped tenant identity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT 'My Shop',
  owner_name TEXT,
  phone TEXT NOT NULL DEFAULT '',
  phone_normalized TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'RWF',
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'staff')),
  is_superadmin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Harden / extend if an older profiles shape already exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    -- Legacy: profiles.id = auth.users.id
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
    ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_uidx ON public.profiles (user_id);
  END IF;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT 'My Shop';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_normalized TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'RWF';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS profiles_phone_normalized_idx ON public.profiles (phone_normalized);

-- ---------------------------------------------------------------------------
-- Subscriptions (user-scoped)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'trial' CHECK (plan_tier IN ('trial', 'monthly', 'annual', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'expired')),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alias view for directive naming while avoiding clash with workspace subscriptions table
CREATE OR REPLACE VIEW public.saas_subscriptions AS
  SELECT * FROM public.user_subscriptions;

-- ---------------------------------------------------------------------------
-- Subscription payments (Paypack / manual bank / IAP)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'RWF',
  plan_tier TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_tier IN ('monthly', 'annual', 'lifetime')),
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'momo_paypack', 'airtel_paypack', 'momo_manual', 'bank_transfer', 'apple_iap', 'google_play'
  )),
  reference_id TEXT,
  external_transaction_id TEXT,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_payments_user_id_idx ON public.subscription_payments (user_id);
CREATE INDEX IF NOT EXISTS subscription_payments_status_idx ON public.subscription_payments (status);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_payments_external_tx_uidx
  ON public.subscription_payments (external_transaction_id)
  WHERE external_transaction_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- WhatsApp OTP
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_normalized TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_verifications_phone_created_idx
  ON public.otp_verifications (phone_normalized, created_at DESC);

-- ---------------------------------------------------------------------------
-- Business tables: ensure user_id tenant column
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients','debts','debt_items','payments','sales','inventory_items','app_settings'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE',
        t
      );
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (user_id)',
        t || '_user_id_idx', t
      );
    ELSE
      -- Create minimal stubs if missing (fresh project)
      IF t = 'clients' THEN
        CREATE TABLE public.clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          phone TEXT,
          phone_normalized TEXT,
          address TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      ELSIF t = 'inventory_items' THEN
        CREATE TABLE public.inventory_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          item_name TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      ELSIF t = 'debts' THEN
        CREATE TABLE public.debts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
          amount NUMERIC(12,2) NOT NULL DEFAULT 0,
          remaining_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
          due_date DATE,
          status TEXT NOT NULL DEFAULT 'active',
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      ELSIF t = 'debt_items' THEN
        CREATE TABLE public.debt_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
          inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
          item_name TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      ELSIF t = 'payments' THEN
        CREATE TABLE public.payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
          client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
          amount NUMERIC(12,2) NOT NULL,
          payment_method TEXT NOT NULL DEFAULT 'cash',
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      ELSIF t = 'sales' THEN
        CREATE TABLE public.sales (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
          client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
          item_name TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          payment_method TEXT NOT NULL DEFAULT 'cash',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      ELSIF t = 'app_settings' THEN
        CREATE TABLE public.app_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          setting_key TEXT NOT NULL,
          setting_value TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (user_id, setting_key)
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_superadmin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_write_access(p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions s
    WHERE s.user_id = p_user
      AND (
        (s.status = 'trialing' AND s.trial_ends_at > now())
        OR (s.status = 'active' AND s.current_period_end > now())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS user_subscriptions_touch_updated_at ON public.user_subscriptions;
CREATE TRIGGER user_subscriptions_touch_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies if any
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','user_subscriptions','subscription_payments','otp_verifications',
        'clients','debts','debt_items','payments','sales','inventory_items','app_settings'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY profiles_insert ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.is_superadmin())
  WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY profiles_delete ON public.profiles FOR DELETE
  USING (auth.uid() = user_id OR public.is_superadmin());

-- user_subscriptions
CREATE POLICY user_subs_select ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY user_subs_insert ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY user_subs_update ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id OR public.is_superadmin())
  WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- subscription_payments
CREATE POLICY sub_pay_select ON public.subscription_payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY sub_pay_insert ON public.subscription_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY sub_pay_update ON public.subscription_payments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_superadmin())
  WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- OTP: no client access (service role only)
CREATE POLICY otp_deny_all ON public.otp_verifications FOR ALL
  USING (false) WITH CHECK (false);

-- Tenant business tables
CREATE POLICY clients_tenant ON public.clients FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY debts_tenant ON public.debts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY debt_items_tenant ON public.debt_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY payments_tenant ON public.payments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY sales_tenant ON public.sales FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY inventory_tenant ON public.inventory_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY app_settings_tenant ON public.app_settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Write gate: block inserts/updates when subscription expired (except reads)
CREATE OR REPLACE FUNCTION public.enforce_write_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_has_write_access(auth.uid()) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Subscription expired — renew to create or edit records';
  END IF;
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients','debts','debt_items','payments','sales','inventory_items','app_settings'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS enforce_write_access_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER enforce_write_access_%I BEFORE INSERT OR UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access()',
      t, t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Storage: receipts bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS receipts_upload_own ON storage.objects;
DROP POLICY IF EXISTS receipts_read_own ON storage.objects;
DROP POLICY IF EXISTS receipts_admin_read ON storage.objects;

CREATE POLICY receipts_upload_own ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY receipts_read_own ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_superadmin()
    )
  );

CREATE POLICY receipts_update_own ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY receipts_delete_own ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_superadmin()
    )
  );

-- ---------------------------------------------------------------------------
-- Bootstrap profile + trial on signup (phone OTP path also inserts explicitly)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_saas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_phone_n TEXT := COALESCE(NEW.raw_user_meta_data->>'phone_normalized', '');
  v_biz TEXT := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Shop');
  v_owner TEXT := COALESCE(NEW.raw_user_meta_data->>'owner_name', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
BEGIN
  INSERT INTO public.profiles (user_id, business_name, owner_name, phone, phone_normalized)
  VALUES (NEW.id, v_biz, v_owner, v_phone, v_phone_n)
  ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    owner_name = COALESCE(EXCLUDED.owner_name, public.profiles.owner_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    phone_normalized = COALESCE(NULLIF(EXCLUDED.phone_normalized, ''), public.profiles.phone_normalized),
    updated_at = now();

  INSERT INTO public.user_subscriptions (user_id, plan_tier, status, trial_ends_at, current_period_end)
  VALUES (NEW.id, 'trial', 'trialing', now() + interval '7 days', now() + interval '7 days')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_saas ON auth.users;
CREATE TRIGGER on_auth_user_created_saas
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_saas();
-- Unique shop codes + email / national ID identity
-- Shop names may collide; shop_code is the real system identifier.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shop_code TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS email_normalized TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS national_id TEXT,
  ADD COLUMN IF NOT EXISTS national_id_normalized TEXT;

-- Backfill shop codes for existing rows
CREATE OR REPLACE FUNCTION public.generate_shop_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate TEXT;
  i INT;
  ch TEXT;
BEGIN
  LOOP
    candidate := 'SEL-';
    FOR i IN 1..6 LOOP
      ch := substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      candidate := candidate || ch;
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.shop_code = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

UPDATE public.profiles
SET shop_code = public.generate_shop_code()
WHERE shop_code IS NULL OR shop_code = '';

ALTER TABLE public.profiles
  ALTER COLUMN shop_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_shop_code_uidx
  ON public.profiles (shop_code);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_normalized_uidx
  ON public.profiles (email_normalized)
  WHERE email_normalized IS NOT NULL AND email_normalized <> '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_national_id_normalized_uidx
  ON public.profiles (national_id_normalized)
  WHERE national_id_normalized IS NOT NULL AND national_id_normalized <> '';

-- Email OTP channel (reuse otp_verifications)
ALTER TABLE public.otp_verifications
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'email'));

ALTER TABLE public.otp_verifications
  ADD COLUMN IF NOT EXISTS email_normalized TEXT;

CREATE INDEX IF NOT EXISTS otp_verifications_email_created_idx
  ON public.otp_verifications (email_normalized, created_at DESC)
  WHERE email_normalized IS NOT NULL;

-- Auto-assign shop_code on profile insert
CREATE OR REPLACE FUNCTION public.profiles_assign_shop_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.shop_code IS NULL OR NEW.shop_code = '' THEN
    NEW.shop_code := public.generate_shop_code();
  END IF;
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
    NEW.email_normalized := lower(trim(NEW.email));
  END IF;
  IF NEW.national_id IS NOT NULL AND NEW.national_id <> '' THEN
    NEW.national_id_normalized := upper(regexp_replace(NEW.national_id, '[^A-Za-z0-9]', '', 'g'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_assign_shop_code_trg ON public.profiles;
CREATE TRIGGER profiles_assign_shop_code_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_assign_shop_code();

-- Extend signup bootstrap to keep email metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_saas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_phone_n TEXT := COALESCE(NEW.raw_user_meta_data->>'phone_normalized', '');
  v_biz TEXT := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Shop');
  v_owner TEXT := COALESCE(NEW.raw_user_meta_data->>'owner_name', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  v_email TEXT := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');
  v_nid TEXT := COALESCE(NEW.raw_user_meta_data->>'national_id', '');
BEGIN
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

GRANT EXECUTE ON FUNCTION public.generate_shop_code() TO service_role, authenticated, anon;

-- Shop display names must be unique (case-insensitive).
-- Shop code remains the short system ID emailed to the owner.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_business_name_normalized_uidx
  ON public.profiles (lower(trim(business_name)));

CREATE OR REPLACE FUNCTION public.shop_name_available(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(trim(business_name)) = lower(trim(p_name))
  );
$$;

GRANT EXECUTE ON FUNCTION public.shop_name_available(TEXT) TO anon, authenticated, service_role;
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
