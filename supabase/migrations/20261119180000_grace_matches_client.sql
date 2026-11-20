-- Align server write access with the client grace window.
-- expire_due_subscriptions() used to flip status to `expired` the moment
-- current_period_end passed, which dropped the 3-day grace on both sides.
-- Do not apply this file to production from the app. Review and run it yourself.

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
        OR (
          s.status IN ('active', 'past_due', 'expired')
          AND s.current_period_end IS NOT NULL
          AND now() > s.current_period_end
          AND now() <= s.current_period_end + interval '3 days'
        )
      )
  );
$$;

-- Trials still end immediately. Paid plans stay writable for 3 days after
-- current_period_end, then this job marks them expired.
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
      OR (status = 'trialing' AND trial_ends_at IS NULL AND current_period_end IS NOT NULL AND current_period_end < now())
      OR (
        status <> 'trialing'
        AND current_period_end IS NOT NULL
        AND current_period_end < now() - interval '3 days'
      )
    );
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_due_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_due_subscriptions() TO service_role;
