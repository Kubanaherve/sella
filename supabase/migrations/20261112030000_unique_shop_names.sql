-- Shop display names must be unique (case-insensitive).
-- Shop code remains the short system ID emailed to the owner.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_business_name_normalized_uidx
  ON public.profiles (lower(trim(business_name)));

CREATE OR REPLACE FUNCTION public.shop_name_available(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(trim(business_name)) = lower(trim(p_name))
  );
$$;

GRANT EXECUTE ON FUNCTION public.shop_name_available(TEXT) TO anon, authenticated, service_role;
