/**
 * Owner-roster checks for cashier PIN setup and login.
 * A shop code is not permission to create, reactivate, or take over a staff account.
 */

export type StaffRosterRow = {
  id: string;
  status?: string | null;
  auth_user_id?: string | null;
  owner_id?: string | null;
  name?: string | null;
};

export type GuardFailure = { ok: false; status: number; error: string };

export function assertCashierMaySetPin(
  row: StaffRosterRow | null,
  shopOwnerId: string
): { ok: true } | GuardFailure {
  if (!row || !row.owner_id || row.owner_id !== shopOwnerId) {
    return {
      ok: false,
      status: 403,
      error: "Nyiri ubucuruzi agomba kubanza kukwandika nk'umukozi.",
    };
  }
  if (row.status !== "active") {
    return {
      ok: false,
      status: 403,
      error: "Konti yawe yarahagaritswe na nyiri ubucuruzi.",
    };
  }
  if (row.auth_user_id) {
    return {
      ok: false,
      status: 409,
      error:
        "PIN yamaze gushyirwaho. Injira ukoresheje PIN, cyangwa saba nyiri ubucuruzi kuyihindura.",
    };
  }
  return { ok: true };
}

export function assertCashierMayLogin(
  row: StaffRosterRow | null,
  shopOwnerId: string
): { ok: true } | GuardFailure {
  if (!row || !row.owner_id || row.owner_id !== shopOwnerId) {
    return {
      ok: false,
      status: 403,
      error: "Konti yawe ntiyanditswe muri iki duka.",
    };
  }
  if (row.status !== "active") {
    return {
      ok: false,
      status: 403,
      error: "Konti yawe yarahagaritswe na nyiri ubucuruzi.",
    };
  }
  return { ok: true };
}

/** Reads the GoTrue session_id claim. Returns null when the token is not usable. */
export function sessionIdFromAccessToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(globalThis.atob(padded)) as { session_id?: unknown };
    return typeof json.session_id === "string" && json.session_id.length > 0
      ? json.session_id
      : null;
  } catch {
    return null;
  }
}
