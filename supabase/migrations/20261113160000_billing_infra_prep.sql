-- Billing infrastructure prep (works without live MTN/Airtel credentials)
-- Maps the recommended SaaS tables onto Sella without breaking existing rows.

-- ── Plans catalogue ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_rw TEXT,
  duration_days INT NOT NULL CHECK (duration_days > 0),
  price_rwf NUMERIC(12,2) NOT NULL CHECK (price_rwf > 0),
  currency TEXT NOT NULL DEFAULT 'RWF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.subscription_plans (id, name, name_rw, duration_days, price_rwf, sort_order)
VALUES
  ('monthly', 'Monthly', 'Ukwezi', 30, 5000, 1),
  ('annual', 'Annual', 'Umwaka', 365, 50000, 2)
ON CONFLICT (id) DO UPDATE SET
  duration_days = EXCLUDED.duration_days,
  price_rwf = EXCLUDED.price_rwf,
  name = EXCLUDED.name,
  name_rw = EXCLUDED.name_rw;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plans_select ON public.subscription_plans;
CREATE POLICY plans_select ON public.subscription_plans
  FOR SELECT USING (is_active = true OR public.is_superadmin());

-- ── Raw webhook audit (separate from payments) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN (
    'paypack', 'airtel_open_api', 'mtn_momo', 'flutterwave', 'manual', 'test'
  )),
  event_type TEXT,
  external_ref TEXT,
  payment_id UUID REFERENCES public.subscription_payments(id) ON DELETE SET NULL,
  signature_valid BOOLEAN,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT false,
  process_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_webhooks_created_idx
  ON public.payment_webhooks (created_at DESC);
CREATE INDEX IF NOT EXISTS payment_webhooks_ref_idx
  ON public.payment_webhooks (external_ref);
CREATE INDEX IF NOT EXISTS payment_webhooks_payment_idx
  ON public.payment_webhooks (payment_id);

ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_webhooks_admin ON public.payment_webhooks;
CREATE POLICY payment_webhooks_admin ON public.payment_webhooks
  FOR SELECT USING (public.is_superadmin());

-- ── Notification preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  remind_days_before INT[] NOT NULL DEFAULT ARRAY[7, 3, 2, 1, 0],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_prefs_own ON public.notification_preferences;
CREATE POLICY notif_prefs_own ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Device tokens (FCM / APNs via Capacitor) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  push_token TEXT NOT NULL,
  app_version TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, push_token)
);

CREATE INDEX IF NOT EXISTS devices_user_idx ON public.devices (user_id);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS devices_own ON public.devices;
CREATE POLICY devices_own ON public.devices
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Expand billing_notifications kinds for richer reminder set
ALTER TABLE public.billing_notifications
  DROP CONSTRAINT IF EXISTS billing_notifications_kind_check;

ALTER TABLE public.billing_notifications
  ADD CONSTRAINT billing_notifications_kind_check
  CHECK (kind IN (
    'payment_success',
    'payment_failed',
    'payment_cancelled',
    'payment_pending',
    'subscription_activated',
    'subscription_expiring',
    'subscription_expired',
    'subscription_reminder',
    'test'
  ));

-- Track which reminder offsets were already sent (idempotent)
CREATE TABLE IF NOT EXISTS public.subscription_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_end TIMESTAMPTZ NOT NULL,
  days_before INT NOT NULL,
  notification_id UUID REFERENCES public.billing_notifications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_end, days_before)
);

ALTER TABLE public.subscription_reminder_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reminder_log_admin ON public.subscription_reminder_log;
CREATE POLICY reminder_log_admin ON public.subscription_reminder_log
  FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin());

-- Company / merchant identity (single-row config readable by authenticated)
CREATE TABLE IF NOT EXISTS public.merchant_identity (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT 'KUBANA FRIEND TECHNOLOGIES',
  product_name TEXT NOT NULL DEFAULT 'SELLA',
  merchant_brand TEXT NOT NULL DEFAULT 'SELLA',
  founder_name TEXT NOT NULL DEFAULT 'Hervé Friend Kubana',
  business_email TEXT DEFAULT 'hello@sella.app',
  country TEXT NOT NULL DEFAULT 'RW',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.merchant_identity (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.merchant_identity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS merchant_identity_select ON public.merchant_identity;
CREATE POLICY merchant_identity_select ON public.merchant_identity
  FOR SELECT USING (true);
