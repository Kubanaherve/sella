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
    'clients','inventory_items','debts','debt_items','payments','sales','app_settings'
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
          total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
          remaining_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
          due_date DATE,
          status TEXT NOT NULL DEFAULT 'active',
          paid_at TIMESTAMPTZ,
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
        'clients','inventory_items','debts','debt_items','payments','sales','app_settings'
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
    'clients','inventory_items','debts','debt_items','payments','sales','app_settings'
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
