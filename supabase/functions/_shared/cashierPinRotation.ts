/**
 * Owner-only cashier PIN rotation.
 * The Supabase Auth password is the credential. The local hash is only a copy.
 * Service-role access stays inside the server adapter; this module never sees the key.
 */

export type RotationCaller = {
  id: string;
  email?: string | null;
  appRole?: string | null;
};

export type RotationProfile = {
  user_id: string;
  shop_code: string | null;
};

export type RotationStaff = {
  id: string;
  status: string | null;
  owner_id: string | null;
  shop_code: string | null;
  name: string | null;
  phone: string | null;
  phone_normalized: string | null;
  auth_user_id: string | null;
};

export type PinRotationResult =
  | { ok: true; authUserId: string }
  | { ok: false; status: number; error: string; credentialRotated: boolean };

export function staffLoginEmail(shopCode: string, phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  const codeSuffix = shopCode.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `staff.${digits}.${codeSuffix}@staff.sella.app`;
}

export function staffLoginPassword(pin: string, phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  return `sella_staff_${pin}_${digits.slice(-4)}`;
}

export async function hashCashierPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`jfj-v2:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeShopCode(raw: string): string {
  let clean = (raw || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!clean.startsWith("SEL-")) {
    if (clean.startsWith("SEL")) clean = `SEL-${clean.slice(3)}`;
    else if (clean) clean = `SEL-${clean}`;
  }
  return clean;
}

export type RotationPorts = {
  clearSession(staffId: string, ownerId: string): Promise<boolean>;
  commitCredential(input: {
    staffId: string;
    ownerId: string;
    authUserId: string;
    pinHash: string;
  }): Promise<boolean>;
  findAuthUserById(id: string): Promise<{ id: string; email: string | null } | null>;
  findAuthUserByEmail(email: string): Promise<{ id: string; email: string | null } | null>;
  setPassword(userId: string, password: string): Promise<void>;
  createAuthUser(email: string, password: string): Promise<{ id: string }>;
  deleteSessions(input: { userId: string; email: string; password: string }): Promise<void>;
};

function fail(status: number, error: string, credentialRotated = false): PinRotationResult {
  return { ok: false, status, error, credentialRotated };
}

export async function applyCashierPinRotation(
  input: {
    caller: RotationCaller | null;
    profile: RotationProfile | null;
    staff: RotationStaff | null;
    newPin: string;
    phoneE164: string | null;
  },
  ports: RotationPorts
): Promise<PinRotationResult> {
  const pin = input.newPin.trim();
  if (!/^\d{4}$/.test(pin)) {
    return fail(400, "PIN igomba kuba imibare 4");
  }
  const caller = input.caller;
  if (!caller?.id) return fail(401, "Session yanyu yarangiye cyangwa ntiyemewe. Banza winjire.");
  const email = (caller.email || "").toLowerCase();
  if (caller.appRole === "cashier" || email.endsWith("@staff.sella.app")) {
    return fail(403, "Abakozi ntibemerewe guhindura PIN z'abandi.");
  }
  const profile = input.profile;
  if (!profile || profile.user_id !== caller.id || !profile.shop_code) {
    return fail(403, "Ntushobora guhindura PIN kuko udafite iduka.");
  }
  const staff = input.staff;
  if (!staff) return fail(404, "Umukozi ntabonetse muri iyi shop.");
  if (staff.owner_id !== caller.id) {
    return fail(403, "Ntabwo wemerewe guhindura PIN y'uyu mukozi.");
  }
  const ownerShop = normalizeShopCode(profile.shop_code);
  const staffShop = normalizeShopCode(staff.shop_code || "");
  if (!staffShop || staffShop !== ownerShop) {
    return fail(403, "Ntabwo wemerewe guhindura PIN y'uyu mukozi.");
  }
  if (staff.status !== "active") {
    return fail(403, "Umukozi yarahagaritswe. Banza umufungure mbere yo guhindura PIN.");
  }
  if (!input.phoneE164) return fail(400, "Nimero ya telefone ntiyemewe mu Rwanda");

  const loginEmail = staffLoginEmail(ownerShop, input.phoneE164);
  const password = staffLoginPassword(pin, input.phoneE164);

  let authUser = staff.auth_user_id
    ? await ports.findAuthUserById(staff.auth_user_id)
    : null;
  if (staff.auth_user_id && !authUser) {
    return fail(503, "Guhindura PIN byanze. Ongera ugerageze.");
  }
  if (!authUser) authUser = await ports.findAuthUserByEmail(loginEmail);
  if (authUser?.email && authUser.email.toLowerCase() !== loginEmail) {
    return fail(409, "Konti y'umukozi ntabwo ihuye n'iyi nimero.");
  }

  const sessionCleared = await ports.clearSession(staff.id, caller.id);
  if (!sessionCleared) {
    return fail(403, "Umukozi yarahagaritswe. Banza umufungure mbere yo guhindura PIN.");
  }

  let authUserId = authUser?.id || "";
  try {
    if (authUserId) {
      await ports.setPassword(authUserId, password);
    } else {
      const created = await ports.createAuthUser(loginEmail, password);
      authUserId = created.id;
    }
  } catch {
    return fail(503, "Guhindura PIN byanze. Ongera ugerageze.");
  }

  let pinHash = "";
  try {
    pinHash = await hashCashierPin(pin);
  } catch {
    return fail(503, "Guhindura PIN byanze. Ongera ugerageze.", true);
  }
  const committed = await ports.commitCredential({
    staffId: staff.id,
    ownerId: caller.id,
    authUserId,
    pinHash,
  });
  if (!committed) {
    return fail(503, "Guhindura PIN byanze. Ongera ugerageze.", true);
  }

  try {
    await ports.deleteSessions({ userId: authUserId, email: loginEmail, password });
  } catch {
    return fail(503, "PIN yahinduwe, ariko session ntiyasheshwe. Ongera ugerageze.", true);
  }

  return { ok: true, authUserId };
}

/**
 * Revokes every refresh token for this cashier.
 * The documented operation is POST /auth/v1/logout?scope=global with that
 * user's own access token. A service-role call to that route is rejected.
 * Signing in with the password just set, then logging out globally, deletes
 * the new session and every older one. The access token is not returned.
 */
export async function deleteAuthUserSessions(
  supabaseUrl: string,
  apiKey: string,
  email: string,
  password: string,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const base = supabaseUrl.replace(/\/$/, "");
  const headers = { apikey: apiKey, "Content-Type": "application/json" };
  const signed = await fetchImpl(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });
  if (!signed.ok) throw new Error("session revoke failed");
  const body = (await signed.json()) as { access_token?: unknown };
  if (typeof body.access_token !== "string" || !body.access_token) {
    throw new Error("session revoke failed");
  }
  const logout = await fetchImpl(`${base}/auth/v1/logout?scope=global`, {
    method: "POST",
    headers: { apikey: apiKey, Authorization: `Bearer ${body.access_token}` },
  });
  if (!(logout.ok || logout.status === 204)) throw new Error("session revoke failed");
}
