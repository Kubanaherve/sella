-- Sale-first: every purchase is a sale; debts are balances on those sales.
-- Adds payment_status + debt_id on sales; reference_number on payments.
-- Use session_replication_role so backfill bypasses enforce_write_access triggers.

SET session_replication_role = replica;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid';

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS debt_id UUID;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS reference_number TEXT;

ALTER TABLE public.sales ALTER COLUMN payment_method DROP NOT NULL;
ALTER TABLE public.sales ALTER COLUMN payment_status SET DEFAULT 'paid';
UPDATE public.sales SET payment_status = COALESCE(payment_status, 'paid');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_payment_status_check') THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_payment_status_check
      CHECK (payment_status IN ('paid', 'credit', 'partial'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_debt_id_fkey') THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_debt_id_fkey
      FOREIGN KEY (debt_id) REFERENCES public.debts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sales_debt_id_idx ON public.sales (debt_id);
CREATE INDEX IF NOT EXISTS sales_payment_status_idx ON public.sales (user_id, payment_status);

INSERT INTO public.sales (
  user_id,
  client_id,
  inventory_item_id,
  item_name,
  quantity,
  cost_price,
  sale_price,
  payment_method,
  payment_status,
  debt_id,
  created_at
)
SELECT
  di.user_id,
  d.client_id,
  di.inventory_item_id,
  di.item_name,
  di.quantity,
  COALESCE(di.cost_price, 0),
  di.unit_price,
  CASE
    WHEN d.status = 'paid' OR d.remaining_balance < d.total_amount THEN 'momo'
    ELSE NULL
  END,
  CASE
    WHEN d.status = 'paid' OR d.remaining_balance <= 0 THEN 'paid'
    WHEN d.remaining_balance < d.total_amount THEN 'partial'
    ELSE 'credit'
  END,
  d.id,
  COALESCE(d.created_at, now())
FROM public.debt_items di
JOIN public.debts d ON d.id = di.debt_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales s WHERE s.debt_id = d.id
);

SET session_replication_role = DEFAULT;
