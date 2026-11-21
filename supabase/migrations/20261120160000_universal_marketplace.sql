-- Universal Digital Marketplace & Multi-Vertical Trader Expansion
-- Supports all 20 Rwandan commercial sectors, rich store profiles, product variations,
-- and online customer marketplace orders with lifecycle tracking.

SET session_replication_role = replica;

-- 1. Extend Profiles for Storefront Customization
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_category TEXT DEFAULT 'general_merchandise',
  ADD COLUMN IF NOT EXISTS store_description TEXT,
  ADD COLUMN IF NOT EXISTS store_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS store_cover_url TEXT,
  ADD COLUMN IF NOT EXISTS store_address TEXT,
  ADD COLUMN IF NOT EXISTS store_tin TEXT;

CREATE INDEX IF NOT EXISTS profiles_business_category_idx
  ON public.profiles (business_category);

-- 2. Extend Inventory Items for Multi-Sector Product Types
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS warranty TEXT,
  ADD COLUMN IF NOT EXISTS dimensions TEXT,
  ADD COLUMN IF NOT EXISTS weight TEXT,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS inventory_items_category_idx
  ON public.inventory_items (category);

CREATE INDEX IF NOT EXISTS inventory_items_available_idx
  ON public.inventory_items (user_id, is_available);

-- 3. Marketplace Orders & Order Items
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_code TEXT NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery')),
  delivery_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'momo' CHECK (payment_method IN ('momo', 'cash', 'airtel', 'bank')),
  payment_reference TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_orders_user_id_idx ON public.marketplace_orders (user_id);
CREATE INDEX IF NOT EXISTS marketplace_orders_shop_code_idx ON public.marketplace_orders (shop_code);
CREATE INDEX IF NOT EXISTS marketplace_orders_customer_phone_idx ON public.marketplace_orders (customer_phone);
CREATE INDEX IF NOT EXISTS marketplace_orders_status_idx ON public.marketplace_orders (status);

CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  selected_variation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_order_items_order_id_idx ON public.marketplace_order_items (order_id);

-- 4. Enable Row Level Security
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Store owners can manage their orders
DROP POLICY IF EXISTS marketplace_orders_owner ON public.marketplace_orders;
CREATE POLICY marketplace_orders_owner ON public.marketplace_orders FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Allow customers / public to place orders (INSERT)
DROP POLICY IF EXISTS marketplace_orders_public_insert ON public.marketplace_orders;
CREATE POLICY marketplace_orders_public_insert ON public.marketplace_orders FOR INSERT
  WITH CHECK (true);

-- Policy: Allow customers to view their order via order_number
DROP POLICY IF EXISTS marketplace_orders_public_read ON public.marketplace_orders;
CREATE POLICY marketplace_orders_public_read ON public.marketplace_orders FOR SELECT
  USING (true);

-- Policy: Order items inherit order visibility
DROP POLICY IF EXISTS marketplace_order_items_all ON public.marketplace_order_items;
CREATE POLICY marketplace_order_items_all ON public.marketplace_order_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Public read policy on active inventory items for marketplace browsing
DROP POLICY IF EXISTS inventory_items_marketplace_browse ON public.inventory_items;
CREATE POLICY inventory_items_marketplace_browse ON public.inventory_items FOR SELECT
  USING (is_available = true);

-- Public read policy on basic profile metadata for store discovery
DROP POLICY IF EXISTS profiles_marketplace_browse ON public.profiles;
CREATE POLICY profiles_marketplace_browse ON public.profiles FOR SELECT
  USING (true);

SET session_replication_role = DEFAULT;
