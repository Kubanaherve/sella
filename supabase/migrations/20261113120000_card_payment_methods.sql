-- Allow Flutterwave card (+ optional FLW MoMo) on subscription_payments

ALTER TABLE public.subscription_payments
  DROP CONSTRAINT IF EXISTS subscription_payments_payment_method_check;

ALTER TABLE public.subscription_payments
  ADD CONSTRAINT subscription_payments_payment_method_check
  CHECK (payment_method IN (
    'momo_paypack',
    'airtel_paypack',
    'momo_manual',
    'bank_transfer',
    'apple_iap',
    'google_play',
    'card_flutterwave',
    'momo_flutterwave',
    'airtel_flutterwave'
  ));
