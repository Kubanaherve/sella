-- Enable Supabase Realtime publication for billing and subscription tables
-- Allows immediate websocket push when webhooks update payment or subscription status.

DO $$
BEGIN
  -- Add user_subscriptions to supabase_realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'user_subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
  END IF;

  -- Add subscription_payments to supabase_realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'subscription_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_payments;
  END IF;

  -- Add billing_notifications to supabase_realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'billing_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.billing_notifications;
  END IF;
END $$;

-- Set REPLICA IDENTITY FULL so updates broadcast full column payloads for RLS / client filters
ALTER TABLE public.user_subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.subscription_payments REPLICA IDENTITY FULL;
ALTER TABLE public.billing_notifications REPLICA IDENTITY FULL;
