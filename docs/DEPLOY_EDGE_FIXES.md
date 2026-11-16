# Edge Function Deployment Status

All Edge functions and security migrations are deployed to project `ixihbqubatyfulnurpco`:

| Function | Deployment Status | Verification |
|---|---|---|
| `verify-whatsapp-otp` | **Deployed** | Rejects unverified email OTP with `{"need_email_otp": true}` |
| `flutterwave-webhook` | **Deployed** | Timing-safe hash check returns 401 on mismatched signature |
| `pin-login` | **Deployed** | Returns `retry_after_seconds` on 429; resets rate-limit on success |
| `register-shop` | **Deployed** | Requires DB-verified email OTP, consumes OTP on use |
| `reset-pin` | **Deployed** | Self-serve OTP PIN reset, unsets OTP & clears login lockouts |
| `admin-clear-rate-limit` | **Deployed** | Superadmin tool to unlock phones locked by brute-force limits |
| `paypack-cashin` | **Deployed** | Refuses direct Open API without webhooks; routes live MoMo via Paypack |
| `send-email-otp` | **Deployed** | Dispatches 6-digit OTP code |
| `verify-email-otp` | **Deployed** | Verifies OTP into `otp_verifications` |
