-- SaaS multi-tenant schema: workspaces, entitlements, Flutterwave/Apple billing.
-- Apply to a NEW Supabase project only (never the legacy open-RLS production DB).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_platform_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Workspaces (tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL DEFAULT 'My Business',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx ON public.workspace_members (user_id);

-- ---------------------------------------------------------------------------
-- Subscriptions (one logical access record per workspace)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL DEFAULT 'monthly_rwf_50k',
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  provider TEXT NOT NULL DEFAULT 'trial'
    CHECK (provider IN ('trial', 'flutterwave', 'apple', 'manual')),
  price_rwf INTEGER NOT NULL DEFAULT 50000,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  apple_original_transaction_id TEXT,
  flutterwave_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trial is bound to workspace forever (reinstall must not restart trial)
CREATE TABLE IF NOT EXISTS public.trial_grants (
  workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('flutterwave', 'apple')),
  reference TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'successful', 'failed', 'refunded')),
  phone TEXT,
  provider_tx_id TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_intents_provider_tx_unique
  ON public.payment_intents (provider, provider_tx_id)
  WHERE provider_tx_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  provider_event_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_provider_event_unique
  ON public.payment_events (provider_event_id)
  WHERE provider_event_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Application data (workspace-scoped)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  phone_normalized TEXT,
  address TEXT,
  notes TEXT,
  external_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clients_workspace_external_key_uidx
  ON public.clients (workspace_id, external_key)
  WHERE external_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS clients_workspace_name_idx ON public.clients (workspace_id, lower(name));

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  date_bought DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  remaining_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (remaining_balance >= 0),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'bad_debt')),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debts_workspace_status_idx ON public.debts (workspace_id, status);

CREATE TABLE IF NOT EXISTS public.debt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('momo', 'cash', 'airtel', 'bank')),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  payment_method TEXT CHECK (payment_method IN ('momo', 'cash', 'airtel', 'bank')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, setting_key)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_workspace_member(wid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = wid AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_has_write_access(wid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.workspace_id = wid
      AND (
        (s.status = 'trialing' AND s.trial_ends_at IS NOT NULL AND s.trial_ends_at > now())
        OR (s.status IN ('active', 'canceled') AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
        OR (s.status = 'past_due' AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Bootstrap new user: profile + empty workspace + one-time trial
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wid UUID;
  trial_end TIMESTAMPTZ := (date_trunc('day', now()) + INTERVAL '1 month');
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Idempotent: one owned workspace max for bootstrap
  SELECT id INTO wid FROM public.workspaces WHERE owner_id = NEW.id LIMIT 1;
  IF wid IS NULL THEN
    INSERT INTO public.workspaces (owner_id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'))
    RETURNING id INTO wid;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (wid, NEW.id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    INSERT INTO public.trial_grants (workspace_id, ends_at)
    VALUES (wid, trial_end)
    ON CONFLICT (workspace_id) DO NOTHING;

    INSERT INTO public.subscriptions (
      workspace_id, plan_code, status, provider, price_rwf,
      trial_started_at, trial_ends_at, current_period_start, current_period_end
    )
    VALUES (
      wid, 'monthly_rwf_50k', 'trialing', 'trial', 50000,
      now(), trial_end, now(), trial_end
    )
    ON CONFLICT (workspace_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Workspaces / members
CREATE POLICY workspaces_select_member ON public.workspaces FOR SELECT USING (public.is_workspace_member(id));
CREATE POLICY workspaces_update_owner ON public.workspaces FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY members_select ON public.workspace_members FOR SELECT USING (public.is_workspace_member(workspace_id));

-- Subscriptions readable by members (writes via service role / edge functions)
CREATE POLICY subscriptions_select ON public.subscriptions FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY trial_grants_select ON public.trial_grants FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY payment_intents_select ON public.payment_intents FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY payment_events_select ON public.payment_events FOR SELECT USING (public.is_workspace_member(workspace_id));

-- Business tables: members can read always; writes require active trial/paid period
CREATE POLICY clients_select ON public.clients FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY clients_insert ON public.clients FOR INSERT WITH CHECK (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);
CREATE POLICY clients_update ON public.clients FOR UPDATE USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);
CREATE POLICY clients_delete ON public.clients FOR DELETE USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);

CREATE POLICY inventory_select ON public.inventory_items FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY inventory_insert ON public.inventory_items FOR INSERT WITH CHECK (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);
CREATE POLICY inventory_update ON public.inventory_items FOR UPDATE USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);
CREATE POLICY inventory_delete ON public.inventory_items FOR DELETE USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);

CREATE POLICY debts_select ON public.debts FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY debts_insert ON public.debts FOR INSERT WITH CHECK (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);
CREATE POLICY debts_update ON public.debts FOR UPDATE USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);
CREATE POLICY debts_delete ON public.debts FOR DELETE USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);

CREATE POLICY debt_items_select ON public.debt_items FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY debt_items_insert ON public.debt_items FOR INSERT WITH CHECK (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);
CREATE POLICY debt_items_update ON public.debt_items FOR UPDATE USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);
CREATE POLICY debt_items_delete ON public.debt_items FOR DELETE USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);

CREATE POLICY payments_select ON public.payments FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY payments_insert ON public.payments FOR INSERT WITH CHECK (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);

CREATE POLICY sales_select ON public.sales FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY sales_insert ON public.sales FOR INSERT WITH CHECK (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);
CREATE POLICY sales_delete ON public.sales FOR DELETE USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);

CREATE POLICY settings_select ON public.workspace_settings FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY settings_upsert ON public.workspace_settings FOR ALL USING (
  public.is_workspace_member(workspace_id) AND public.workspace_has_write_access(workspace_id)
);

-- Idempotent customer import for a workspace (owner-driven via authenticated RPC)
CREATE OR REPLACE FUNCTION public.import_clients_json(p_workspace_id UUID, p_rows JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row JSONB;
  inserted INT := 0;
  skipped INT := 0;
  invalid INT := 0;
  name TEXT;
  phone TEXT;
  ext TEXT;
BEGIN
  IF NOT public.is_workspace_member(p_workspace_id) THEN
    RAISE EXCEPTION 'not a workspace member';
  END IF;
  IF NOT public.workspace_has_write_access(p_workspace_id) THEN
    RAISE EXCEPTION 'subscription inactive: write denied';
  END IF;

  FOR row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    name := NULLIF(trim(COALESCE(row->>'name', '')), '');
    phone := NULLIF(trim(COALESCE(row->>'phone', '')), '');
    ext := NULLIF(trim(COALESCE(row->>'external_key', row->>'id', '')), '');
    IF name IS NULL THEN
      invalid := invalid + 1;
      CONTINUE;
    END IF;
    IF ext IS NOT NULL THEN
      INSERT INTO public.clients (workspace_id, name, phone, phone_normalized, external_key)
      VALUES (p_workspace_id, name, phone, regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), ext)
      ON CONFLICT (workspace_id, external_key) WHERE external_key IS NOT NULL
      DO NOTHING;
      IF FOUND THEN inserted := inserted + 1; ELSE skipped := skipped + 1; END IF;
    ELSE
      -- No external key: skip if same name+phone already exists in workspace
      IF EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.workspace_id = p_workspace_id
          AND lower(c.name) = lower(name)
          AND COALESCE(c.phone, '') = COALESCE(phone, '')
      ) THEN
        skipped := skipped + 1;
      ELSE
        INSERT INTO public.clients (workspace_id, name, phone, phone_normalized)
        VALUES (p_workspace_id, name, phone, regexp_replace(COALESCE(phone, ''), '\D', '', 'g'));
        inserted := inserted + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', inserted,
    'skipped', skipped,
    'invalid', invalid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.import_clients_json(UUID, JSONB) TO authenticated;
