-- ---------------------------------------------------------------------------
-- Helper function to reset/clear rate-limit bucket for a phone or IP
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clear_auth_rate_limit(p_bucket TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_rate_limits WHERE bucket_key = p_bucket;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_auth_rate_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_auth_rate_limit(TEXT) TO service_role;
