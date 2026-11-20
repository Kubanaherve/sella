/**
 * A cashier must never keep working on someone else's Supabase session.
 * A complete staff token pair replaces the session. No tokens means offline,
 * and any previous cloud session has to be cleared first.
 */
export type CashierSessionPlan =
  | "apply-staff-session"
  | "offline-without-cloud-session";

export function planCashierSession(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
}): CashierSessionPlan {
  const access = Boolean(tokens.access_token);
  const refresh = Boolean(tokens.refresh_token);
  if (access && refresh) return "apply-staff-session";
  if (!access && !refresh) return "offline-without-cloud-session";
  throw new Error("Incomplete staff session");
}
