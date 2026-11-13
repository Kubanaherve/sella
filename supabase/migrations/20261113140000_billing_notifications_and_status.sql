-- Expand payment statuses + first-class airtel_manual + billing notifications

ALTER TABLE public.subscription_payments
  DROP CONSTRAINT IF EXISTS subscription_payments_status_check;

ALTER TABLE public.subscription_payments
  ADD CONSTRAINT subscription_payments_status_check
  CHECK (status IN ('pending', 'completed', 'rejected', 'cancelled', 'expired_pending'));

ALTER TABLE public.subscription_payments
  DROP CONSTRAINT IF EXISTS subscription_payments_payment_method_check;

ALTER TABLE public.subscription_payments
  ADD CONSTRAINT subscription_payments_payment_method_check
  CHECK (payment_method IN (
    'momo_paypack',
    'airtel_paypack',
    'momo_manual',
    'airtel_manual',
    'bank_transfer',
    'apple_iap',
    'google_play',
    'card_flutterwave',
    'momo_flutterwave',
    'airtel_flutterwave'
  ));

CREATE TABLE IF NOT EXISTS public.billing_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.subscription_payments(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN (
    'payment_success',
    'payment_failed',
    'payment_cancelled',
    'payment_pending',
    'subscription_activated',
    'subscription_expiring',
    'subscription_expired'
  )),
  title TEXT NOT NULL,
  body TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_notifications_user_idx
  ON public.billing_notifications (user_id, created_at DESC);

ALTER TABLE public.billing_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_notif_select ON public.billing_notifications;
CREATE POLICY billing_notif_select ON public.billing_notifications
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_superadmin()
  );

DROP POLICY IF EXISTS billing_notif_update ON public.billing_notifications;
CREATE POLICY billing_notif_update ON public.billing_notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mark overdue pending payments (admin visibility)
CREATE OR REPLACE FUNCTION public.mark_stale_pending_payments(p_hours INT DEFAULT 24)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
BEGIN
  UPDATE public.subscription_payments
  SET status = 'expired_pending',
      admin_notes = COALESCE(admin_notes, '') || ' | auto: pending too long'
  WHERE status = 'pending'
    AND created_at < now() - make_interval(hours => p_hours);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- Flip subscriptions past end date to expired (access already time-gated)
CREATE OR REPLACE FUNCTION public.expire_due_subscriptions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
BEGIN
  UPDATE public.user_subscriptions
  SET status = 'expired',
      updated_at = now()
  WHERE status IN ('active', 'trialing', 'past_due')
    AND (
      (status = 'trialing' AND trial_ends_at IS NOT NULL AND trial_ends_at < now())
      OR (current_period_end IS NOT NULL AND current_period_end < now() AND status <> 'trialing')
      OR (status = 'trialing' AND trial_ends_at IS NULL AND current_period_end IS NOT NULL AND current_period_end < now())
    );
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_stale_pending_payments(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_due_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_stale_pending_payments(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_due_subscriptions() TO service_role;
