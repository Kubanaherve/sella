-- Unique shop codes + email / national ID identity
-- Shop names may collide; shop_code is the real system identifier.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shop_code TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS email_normalized TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS national_id TEXT,
  ADD COLUMN IF NOT EXISTS national_id_normalized TEXT;

-- Backfill shop codes for existing rows
CREATE OR REPLACE FUNCTION public.generate_shop_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate TEXT;
  i INT;
  ch TEXT;
BEGIN
  LOOP
    candidate := 'SEL-';
    FOR i IN 1..6 LOOP
      ch := substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      candidate := candidate || ch;
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.shop_code = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

UPDATE public.profiles
SET shop_code = public.generate_shop_code()
WHERE shop_code IS NULL OR shop_code = '';

ALTER TABLE public.profiles
  ALTER COLUMN shop_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_shop_code_uidx
  ON public.profiles (shop_code);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_normalized_uidx
  ON public.profiles (email_normalized)
  WHERE email_normalized IS NOT NULL AND email_normalized <> '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_national_id_normalized_uidx
  ON public.profiles (national_id_normalized)
  WHERE national_id_normalized IS NOT NULL AND national_id_normalized <> '';

-- Email OTP channel (reuse otp_verifications)
ALTER TABLE public.otp_verifications
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'email'));

ALTER TABLE public.otp_verifications
  ADD COLUMN IF NOT EXISTS email_normalized TEXT;

CREATE INDEX IF NOT EXISTS otp_verifications_email_created_idx
  ON public.otp_verifications (email_normalized, created_at DESC)
  WHERE email_normalized IS NOT NULL;

-- Auto-assign shop_code on profile insert
CREATE OR REPLACE FUNCTION public.profiles_assign_shop_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.shop_code IS NULL OR NEW.shop_code = '' THEN
    NEW.shop_code := public.generate_shop_code();
  END IF;
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
    NEW.email_normalized := lower(trim(NEW.email));
  END IF;
  IF NEW.national_id IS NOT NULL AND NEW.national_id <> '' THEN
    NEW.national_id_normalized := upper(regexp_replace(NEW.national_id, '[^A-Za-z0-9]', '', 'g'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_assign_shop_code_trg ON public.profiles;
CREATE TRIGGER profiles_assign_shop_code_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_assign_shop_code();

-- Extend signup bootstrap to keep email metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_saas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_phone_n TEXT := COALESCE(NEW.raw_user_meta_data->>'phone_normalized', '');
  v_biz TEXT := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Shop');
  v_owner TEXT := COALESCE(NEW.raw_user_meta_data->>'owner_name', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  v_email TEXT := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');
  v_nid TEXT := COALESCE(NEW.raw_user_meta_data->>'national_id', '');
BEGIN
  INSERT INTO public.profiles (
    user_id, business_name, owner_name, phone, phone_normalized,
    email, email_normalized, national_id, shop_code
  )
  VALUES (
    NEW.id, v_biz, v_owner, v_phone, v_phone_n,
    NULLIF(v_email, ''), lower(NULLIF(v_email, '')), NULLIF(v_nid, ''),
    public.generate_shop_code()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    owner_name = COALESCE(EXCLUDED.owner_name, public.profiles.owner_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    phone_normalized = COALESCE(NULLIF(EXCLUDED.phone_normalized, ''), public.profiles.phone_normalized),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    email_normalized = COALESCE(EXCLUDED.email_normalized, public.profiles.email_normalized),
    national_id = COALESCE(EXCLUDED.national_id, public.profiles.national_id),
    shop_code = COALESCE(public.profiles.shop_code, EXCLUDED.shop_code),
    updated_at = now();

  INSERT INTO public.user_subscriptions (user_id, plan_tier, status, trial_ends_at, current_period_end)
  VALUES (NEW.id, 'trial', 'trialing', now() + interval '7 days', now() + interval '7 days')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_shop_code() TO service_role, authenticated, anon;

