-- Sella — empty normalized schema (no seed data).
-- App runtime uses local Dexie IndexedDB (@/db); this SQL documents the
-- optional Postgres mirror for future sync / export.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (local PIN auth; not Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  phone_normalized TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  phone_normalized TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_name_idx ON public.clients (lower(name));
CREATE INDEX IF NOT EXISTS clients_phone_normalized_idx ON public.clients (phone_normalized);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  date_bought DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_items_name_idx ON public.inventory_items (lower(item_name));

CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS debts_client_id_idx ON public.debts (client_id);
CREATE INDEX IF NOT EXISTS debts_status_idx ON public.debts (status);
CREATE INDEX IF NOT EXISTS debts_created_at_idx ON public.debts (created_at DESC);

CREATE TABLE IF NOT EXISTS public.debt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debt_items_debt_id_idx ON public.debt_items (debt_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('momo', 'cash', 'airtel', 'bank')),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_debt_id_idx ON public.payments (debt_id);
CREATE INDEX IF NOT EXISTS payments_client_id_idx ON public.payments (client_id);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON public.payments (created_at DESC);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  payment_method TEXT CHECK (payment_method IN ('momo', 'cash', 'airtel', 'bank')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_created_at_idx ON public.sales (created_at DESC);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Empty by design: no INSERT seed rows.
COMMENT ON TABLE public.profiles IS 'v2 empty normalized schema — local-first Dexie app';
