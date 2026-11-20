-- Additive catalog fields for shops that are not clothing or jewelry.
-- Existing rows keep working. RLS policies on these tables are unchanged.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_category TEXT DEFAULT 'general_merchandise';

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS variant_label TEXT,
  ADD COLUMN IF NOT EXISTS min_order_qty INTEGER;

COMMENT ON COLUMN public.profiles.business_category IS
  'Shop trade: grocery, hardware, clothing, wholesale, general, and other legitimate businesses.';

COMMENT ON COLUMN public.inventory_items.variant_label IS
  'Optional size, color, material, or pack note. Null when the product has no variant.';

COMMENT ON COLUMN public.inventory_items.min_order_qty IS
  'Optional wholesale minimum quantity. Null means any quantity is allowed.';
