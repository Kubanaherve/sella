-- Prevent privilege escalation: authenticated users must not self-grant is_superadmin.
-- Superadmin flag may only be changed by an existing superadmin (or service role).

CREATE OR REPLACE FUNCTION public.protect_profiles_superadmin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.is_superadmin IS DISTINCT FROM OLD.is_superadmin THEN
      IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'is_superadmin can only be changed by a superadmin';
      END IF;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.is_superadmin, false) = true AND NOT public.is_superadmin() THEN
      -- Allow bootstrap only when no superadmin exists yet (first operator setup).
      IF EXISTS (SELECT 1 FROM public.profiles WHERE is_superadmin = true) THEN
        RAISE EXCEPTION 'is_superadmin can only be set by a superadmin';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profiles_superadmin ON public.profiles;
CREATE TRIGGER trg_protect_profiles_superadmin
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_superadmin();
