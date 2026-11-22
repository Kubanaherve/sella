ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false;

UPDATE public.user_subscriptions
SET is_pro = true
WHERE product_plan = 'pro'
  AND status IN ('trialing', 'active', 'past_due');
