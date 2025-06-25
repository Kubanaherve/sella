-- POS enhancements: order meta on debts, categories, refunds, receipt prefs
SET session_replication_role = replica;

ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS change_given NUMERIC(12,2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS debts_receipt_number_uidx
  ON public.debts (user_id, receipt_number)
  WHERE receipt_number IS NOT NULL;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS public.sale_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  restock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sale_refunds_tenant ON public.sale_refunds;
CREATE POLICY sale_refunds_tenant ON public.sale_refunds FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Re-attach write trigger if function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'enforce_write_access'
  ) THEN
    DROP TRIGGER IF EXISTS enforce_write_access_sale_refunds ON public.sale_refunds;
    CREATE TRIGGER enforce_write_access_sale_refunds
      BEFORE INSERT OR UPDATE ON public.sale_refunds
      FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
  END IF;
END $$;

SET session_replication_role = DEFAULT;
