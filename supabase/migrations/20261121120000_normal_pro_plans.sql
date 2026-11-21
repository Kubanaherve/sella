-- Normal and Pro commercial plans.
-- Expiry stays on user_subscriptions.current_period_end (the app already reads that column).
-- Existing trialing and paid shops keep Pro features. New checkouts choose Normal or Pro.

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS product_plan TEXT;

ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS product_plan TEXT;

UPDATE public.user_subscriptions
SET product_plan = 'pro'
WHERE product_plan IS NULL
  AND status IN ('trialing', 'active', 'past_due');

UPDATE public.user_subscriptions
SET product_plan = 'normal'
WHERE product_plan IS NULL;

ALTER TABLE public.user_subscriptions
  ALTER COLUMN product_plan SET DEFAULT 'normal';

ALTER TABLE public.user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_product_plan_check;

ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_product_plan_check
  CHECK (product_plan IN ('normal', 'pro'));

ALTER TABLE public.subscription_payments
  DROP CONSTRAINT IF EXISTS subscription_payments_product_plan_check;

ALTER TABLE public.subscription_payments
  ADD CONSTRAINT subscription_payments_product_plan_check
  CHECK (product_plan IS NULL OR product_plan IN ('normal', 'pro'));

CREATE UNIQUE INDEX IF NOT EXISTS subscription_payments_external_ref_uidx
  ON public.subscription_payments (external_transaction_id)
  WHERE external_transaction_id IS NOT NULL AND external_transaction_id <> '';

-- Active cashiers: Normal 1, Pro 5. A live 7-day trial has the Pro limit.
CREATE OR REPLACE FUNCTION public.enforce_cashier_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_trial TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_max INT := 1;
  v_count INT;
BEGIN
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;
  IF NEW.role NOT IN ('cashier', 'manager') THEN
    RETURN NEW;
  END IF;

  SELECT product_plan, status, trial_ends_at, current_period_end
    INTO v_plan, v_status, v_trial, v_end
  FROM public.user_subscriptions
  WHERE user_id = NEW.owner_id;

  IF v_status = 'trialing' AND v_trial IS NOT NULL AND v_trial > now() THEN
    v_max := 5;
  ELSIF v_plan = 'pro' AND v_end IS NOT NULL AND v_end > now()
        AND v_status IN ('active', 'past_due', 'trialing') THEN
    v_max := 5;
  ELSE
    v_max := 1;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.shop_staff
  WHERE owner_id = NEW.owner_id
    AND status = 'active'
    AND role IN ('cashier', 'manager')
    AND id IS DISTINCT FROM NEW.id;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'Plan cashier limit reached (%).', v_max
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_staff_plan_limit ON public.shop_staff;
CREATE TRIGGER shop_staff_plan_limit
  BEFORE INSERT OR UPDATE OF status, role, owner_id
  ON public.shop_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_cashier_plan_limit();
