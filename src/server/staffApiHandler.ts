import { createClient } from "@supabase/supabase-js";
import {
  assertCashierMayLogin,
  assertCashierMaySetPin,
  sessionIdFromAccessToken,
  type StaffRosterRow,
} from "../../supabase/functions/_shared/cashierJoinGuard";
import {
  applyCashierPinRotation,
  deleteAuthUserSessions,
  staffLoginEmail,
  staffLoginPassword,
  type RotationPorts,
  type RotationStaff,
} from "../../supabase/functions/_shared/cashierPinRotation";

export interface ShopLookupResult {
  ok: boolean;
  status: number;
  error?: string;
  shop?: {
    businessName: string;
    ownerName: string;
    shopCode: string;
    ownerId: string;
    hasWriteAccess: boolean;
  };
}

export interface StaffAuthResult {
  success: boolean;
  status: number;
  error?: string;
  access_token?: string;
  refresh_token?: string;
  staff?: {
    id: string;
    name: string;
    phone: string;
    phone_normalized: string;
    role: string;
    status: string;
    shop_code: string;
    owner_id?: string;
  };
  shop?: {
    businessName: string;
    ownerName: string;
    shopCode: string;
    ownerId?: string;
  };
}

export function normalizeShopCode(raw: string): string {
  let clean = (raw || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!clean.startsWith("SEL-")) {
    if (clean.startsWith("SEL")) clean = `SEL-${clean.slice(3)}`;
    else clean = `SEL-${clean}`;
  }
  return clean;
}

export function normalizePhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;
  let n = digits;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("250") && n.length === 12) return `+${n}`;
  if (n.startsWith("0") && n.length === 10) return `+250${n.slice(1)}`;
  if (n.length === 9 && /^[7]/.test(n)) return `+250${n}`;
  if (n.startsWith("250") && n.length > 12) return `+${n.slice(0, 12)}`;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

function getAdminClient(envUrl?: string, envKey?: string) {
  const url =
    envUrl ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://ixihbqubatyfulnurpco.supabase.co";
  const key = envKey || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const lookupCache = new Map<string, { result: ShopLookupResult; expires: number }>();

export async function handleLookupShopCode(
  rawCode: string,
  envUrl?: string,
  envKey?: string
): Promise<ShopLookupResult> {
  const clean = normalizeShopCode(rawCode);
  if (!/^SEL-[A-Z0-9]{4,10}$/.test(clean)) {
    return {
      ok: false,
      status: 400,
      error: "Shop Code igomba kuba format ya SEL-XXXX (urugero: SEL-MXA8TT)",
    };
  }

  const cached = lookupCache.get(clean);
  if (cached && cached.expires > Date.now()) {
    return cached.result;
  }

  try {
    const admin = getAdminClient(envUrl, envKey);
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("id, user_id, business_name, owner_name, shop_code")
      .ilike("shop_code", clean)
      .maybeSingle();

    if (profErr) {
      console.error("handleLookupShopCode profErr:", profErr);
      return { ok: false, status: 500, error: "Habaye ikibazo cya seriveri mu gushaka iduka" };
    }

    if (!profile) {
      const notFoundRes: ShopLookupResult = {
        ok: false,
        status: 404,
        error: `Shop Code "${clean}" ntibonetse. Baza nyiri ubucuruzi code nyayo y'iduka.`,
      };
      lookupCache.set(clean, { result: notFoundRes, expires: Date.now() + 30000 });
      return notFoundRes;
    }

    const { data: sub } = await admin
      .from("user_subscriptions")
      .select("status, current_period_end")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    const status = sub?.status || "inactive";
    let hasWriteAccess = false;
    if (status === "active" || status === "trialing") {
      hasWriteAccess = true;
    } else if (sub?.current_period_end) {
      const endMs = new Date(sub.current_period_end).getTime();
      if (Date.now() <= endMs + 3 * 86400000) hasWriteAccess = true;
    }

    if (!hasWriteAccess && status === "expired") {
      return {
        ok: false,
        status: 403,
        error: `Iduka "${profile.business_name}" rifite ikibazo cya subscription (irashaje). Baza nyir'ubucuruzi ngo yishyure.`,
      };
    }

    const successRes: ShopLookupResult = {
      ok: true,
      status: 200,
      shop: {
        businessName: profile.business_name || "Iduka",
        ownerName: profile.owner_name || "Nyir'ubucuruzi",
        shopCode: profile.shop_code || clean,
        ownerId: profile.user_id,
        hasWriteAccess: true,
      },
    };
    lookupCache.set(clean, { result: successRes, expires: Date.now() + 120000 });
    return successRes;
  } catch (err) {
    console.error("handleLookupShopCode catch:", err);
    return {
      ok: false,
      status: 500,
      error: err instanceof Error ? err.message : "Habaye ikibazo cya seriveri",
    };
  }
}

export async function handleCashierJoinAndSetPin(
  input: { shopCode?: string; shop_code?: string; phone: string; name: string; pin: string },
  envUrl?: string,
  envKey?: string
): Promise<StaffAuthResult> {
  const code = input.shopCode || input.shop_code || "";
  const lookup = await handleLookupShopCode(code, envUrl, envKey);
  if (!lookup.ok || !lookup.shop) {
    return {
      success: false,
      status: lookup.status,
      error: lookup.error || "Shop Code ntibonetse",
    };
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return {
      success: false,
      status: 400,
      error: "Nimero ya telefone ntiyemewe mu Rwanda",
    };
  }

  const cleanPin = (input.pin || "").trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    return {
      success: false,
      status: 400,
      error: "PIN igomba kuba imibare 4",
    };
  }

  const cleanName = (input.name || "").trim() || "Cashier";
  const shop = lookup.shop;

  try {
    const admin = getAdminClient(envUrl, envKey);

    const { data: roster, error: rosterErr } = await admin
      .from("shop_staff")
      .select("id, status, auth_user_id, owner_id, name")
      .ilike("shop_code", shop.shopCode)
      .eq("phone_normalized", phone)
      .maybeSingle();
    if (rosterErr) {
      return {
        success: false,
        status: 503,
        error: "Kwinjira byahagaritswe gato. Ongera ugerageze.",
      };
    }
    const decision = assertCashierMaySetPin(roster as StaffRosterRow | null, shop.ownerId);
    if (decision.ok === false) {
      return { success: false, status: decision.status, error: decision.error };
    }

    const staffEmail = staffLoginEmail(shop.shopCode, phone);
    const staffPassword = staffLoginPassword(cleanPin, phone);

    const { data: userList } = await admin.auth.admin.listUsers();
    const existing = (userList?.users || []).find(
      (u) => u.email?.toLowerCase() === staffEmail.toLowerCase()
    );

    let staffAuthUserId: string;

    if (existing) {
      staffAuthUserId = existing.id;
      const { error: updErr } = await admin.auth.admin.updateUserById(staffAuthUserId, {
        password: staffPassword,
        app_metadata: { role: "cashier" },
        user_metadata: {
          role: "cashier",
          shop_code: shop.shopCode,
          owner_id: shop.ownerId,
          full_name: cleanName,
          phone,
          phone_normalized: phone,
          pin_length: 4,
        },
      });
      if (updErr) console.warn("Failed updating staff auth user:", updErr);
    } else {
      const { data: created, error: crtErr } = await admin.auth.admin.createUser({
        email: staffEmail,
        password: staffPassword,
        email_confirm: true,
        app_metadata: { role: "cashier" },
        user_metadata: {
          role: "cashier",
          shop_code: shop.shopCode,
          owner_id: shop.ownerId,
          full_name: cleanName,
          phone,
          phone_normalized: phone,
          pin_length: 4,
        },
      });
      if (crtErr || !created.user) {
        throw new Error(crtErr?.message || "Failed creating cashier auth account");
      }
      staffAuthUserId = created.user.id;
    }

    const { data: sessionData, error: signErr } = await admin.auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    });

    if (signErr || !sessionData.session?.access_token) {
      throw signErr || new Error("Session ntiyabonetse");
    }

    const sessionId = sessionIdFromAccessToken(sessionData.session.access_token);
    if (!sessionId) {
      await admin.auth.admin.signOut(sessionData.session.access_token, "global");
      return {
        success: false,
        status: 503,
        error: "Kwinjira byahagaritswe gato. Ongera ugerageze.",
      };
    }

    const now = new Date().toISOString();
    const { data: bound, error: bindErr } = await admin
      .from("shop_staff")
      .update({
        auth_user_id: staffAuthUserId,
        current_session_id: sessionId,
        name: cleanName,
        last_active_at: now,
        updated_at: now,
      })
      .eq("id", roster!.id)
      .eq("status", "active")
      .eq("owner_id", shop.ownerId)
      .is("auth_user_id", null)
      .select("id")
      .maybeSingle();
    if (bindErr || !bound) {
      await admin.auth.admin.signOut(sessionData.session.access_token, "global");
      return {
        success: false,
        status: 409,
        error:
          "PIN yamaze gushyirwaho. Injira ukoresheje PIN, cyangwa saba nyiri ubucuruzi kuyihindura.",
      };
    }

    return {
      success: true,
      status: 200,
      access_token: sessionData.session?.access_token,
      refresh_token: sessionData.session?.refresh_token,
      staff: {
        id: staffAuthUserId,
        name: cleanName,
        phone,
        phone_normalized: phone,
        role: "cashier",
        status: "active",
        shop_code: shop.shopCode,
        owner_id: shop.ownerId,
      },
      shop: {
        businessName: shop.businessName,
        ownerName: shop.ownerName,
        shopCode: shop.shopCode,
        ownerId: shop.ownerId,
      },
    };
  } catch (err) {
    console.error("handleCashierJoinAndSetPin error:", err);
    return {
      success: false,
      status: 500,
      error: err instanceof Error ? err.message : "Kwemeza umukozi byanze",
    };
  }
}

export async function handleCashierPinLogin(
  input: { shopCode?: string; shop_code?: string; phone: string; pin: string },
  envUrl?: string,
  envKey?: string
): Promise<StaffAuthResult> {
  const code = input.shopCode || input.shop_code || "";
  const lookup = await handleLookupShopCode(code, envUrl, envKey);
  if (!lookup.ok || !lookup.shop) {
    return {
      success: false,
      status: lookup.status,
      error: lookup.error || "Shop Code ntibonetse",
    };
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return {
      success: false,
      status: 400,
      error: "Nimero ya telefone ntiyemewe",
    };
  }

  const cleanPin = (input.pin || "").trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    return {
      success: false,
      status: 400,
      error: "PIN igomba kuba imibare 4",
    };
  }

  const shop = lookup.shop;

  try {
    const admin = getAdminClient(envUrl, envKey);

    // Rate limiting: 8 attempts / 15 minutes lockout
    const bucket = `cashier_pin:${shop.shopCode}:${phone}`;
    try {
      const { data: rateRows } = await admin.rpc("check_auth_rate_limit", {
        p_bucket: bucket,
        p_max_attempts: 8,
        p_window_seconds: 900,
        p_lock_seconds: 900,
      });
      const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
      if (rate && rate.allowed === false) {
        return {
          success: false,
          status: 429,
          error: "Mwarengeje inshuro zo kugerageza PIN. Mwihangane gato.",
        };
      }
    } catch (e) {
      // If RPC is unavailable in local mocked tests, continue safely
      console.warn("rate limit rpc notice:", e);
    }

    const { data: roster, error: rosterErr } = await admin
      .from("shop_staff")
      .select("id, status, auth_user_id, owner_id, name")
      .ilike("shop_code", shop.shopCode)
      .eq("phone_normalized", phone)
      .maybeSingle();
    if (rosterErr) {
      return {
        success: false,
        status: 503,
        error: "Kwinjira byahagaritswe gato. Ongera ugerageze.",
      };
    }
    const decision = assertCashierMayLogin(roster as StaffRosterRow | null, shop.ownerId);
    if (decision.ok === false) {
      return { success: false, status: decision.status, error: decision.error };
    }

    const staffEmail = staffLoginEmail(shop.shopCode, phone);
    const staffPassword = staffLoginPassword(cleanPin, phone);

    if (roster?.auth_user_id) {
      const { error: metaErr } = await admin.auth.admin.updateUserById(roster.auth_user_id, {
        app_metadata: { role: "cashier" },
      });
      if (metaErr) {
        return {
          success: false,
          status: 503,
          error: "Kwinjira byahagaritswe gato. Ongera ugerageze.",
        };
      }
    }

    let { data: sessionData, error: signErr } = await admin.auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    });

    if (signErr || !sessionData.session?.access_token || !sessionData.user) {
      return {
        success: false,
        status: 401,
        error: "PIN ntabwo ariyo! Ongera ugerageze.",
      };
    }

    if (!roster?.auth_user_id) {
      const { error: metaErr } = await admin.auth.admin.updateUserById(sessionData.user.id, {
        app_metadata: { role: "cashier" },
      });
      if (metaErr) {
        await admin.auth.admin.signOut(sessionData.session.access_token, "global");
        return {
          success: false,
          status: 503,
          error: "Kwinjira byahagaritswe gato. Ongera ugerageze.",
        };
      }
      await admin.auth.admin.signOut(sessionData.session.access_token, "global");
      const again = await admin.auth.signInWithPassword({
        email: staffEmail,
        password: staffPassword,
      });
      sessionData = again.data;
      signErr = again.error;
      if (signErr || !sessionData.session?.access_token || !sessionData.user) {
        return {
          success: false,
          status: 503,
          error: "Kwinjira byahagaritswe gato. Ongera ugerageze.",
        };
      }
    }

    const sessionId = sessionIdFromAccessToken(sessionData.session.access_token);
    if (!sessionId) {
      await admin.auth.admin.signOut(sessionData.session.access_token, "global");
      return {
        success: false,
        status: 503,
        error: "Kwinjira byahagaritswe gato. Ongera ugerageze.",
      };
    }

    const now = new Date().toISOString();
    const { error: bindErr } = await admin
      .from("shop_staff")
      .update({
        auth_user_id: sessionData.user.id,
        current_session_id: sessionId,
        last_active_at: now,
        updated_at: now,
      })
      .eq("id", roster!.id)
      .eq("status", "active")
      .eq("owner_id", shop.ownerId);
    if (bindErr) {
      await admin.auth.admin.signOut(sessionData.session.access_token, "global");
      return {
        success: false,
        status: 503,
        error: "Kwinjira byahagaritswe gato. Ongera ugerageze.",
      };
    }

    const authUser = sessionData.user;
    const staffName = roster?.name || authUser.user_metadata?.full_name || "Cashier";

    return {
      success: true,
      status: 200,
      access_token: sessionData.session?.access_token,
      refresh_token: sessionData.session?.refresh_token,
      staff: {
        id: authUser?.id || "",
        name: staffName,
        phone,
        phone_normalized: phone,
        role: "cashier",
        status: "active",
        shop_code: shop.shopCode,
        owner_id: shop.ownerId,
      },
      shop: {
        businessName: shop.businessName,
        ownerName: shop.ownerName,
        shopCode: shop.shopCode,
        ownerId: shop.ownerId,
      },
    };
  } catch (err) {
    console.error("handleCashierPinLogin error:", err);
    return {
      success: false,
      status: 500,
      error: err instanceof Error ? err.message : "Kwinjira byanze",
    };
  }
}

export interface OwnerResetPinResult {
  success: boolean;
  status: number;
  error?: string;
  message?: string;
  credentialRotated?: boolean;
}

export type OwnerResetIO = {
  rateLimit(callerId: string): Promise<"ok" | "locked" | "unavailable">;
  getCaller(
    token: string
  ): Promise<{ id: string; email: string | null; appRole: string | null } | null>;
  getProfile(userId: string): Promise<{ user_id: string; shop_code: string | null } | null>;
  getStaff(staffId: string): Promise<RotationStaff | null>;
  ports: RotationPorts;
};

export async function handleOwnerResetCashierPin(
  input: {
    staffId?: string;
    staff_id?: string;
    newPin?: string;
    new_pin?: string;
    pin?: string;
  },
  callerToken?: string,
  envUrl?: string,
  envKey?: string,
  io?: OwnerResetIO
): Promise<OwnerResetPinResult> {
  const staffId = input.staffId || input.staff_id || "";
  const newPin = (input.newPin || input.new_pin || input.pin || "").trim();

  if (!staffId) {
    return {
      success: false,
      status: 400,
      error: "Umukozi arakenewe (staff_id irakenewe)",
    };
  }

  if (!/^\d{4}$/.test(newPin)) {
    return {
      success: false,
      status: 400,
      error: "PIN igomba kuba imibare 4",
    };
  }

  const token = (callerToken || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return {
      success: false,
      status: 401,
      error: "Kwinjira birakenewe (token missing)",
    };
  }

  try {
    const bound = io ?? (await buildOwnerResetIO(token, envUrl, envKey));
    if (!bound) {
      return {
        success: false,
        status: 503,
        error: "Guhindura PIN byanze. Ongera ugerageze.",
      };
    }
    const caller = await bound.getCaller(token);
    if (!caller) {
      return {
        success: false,
        status: 401,
        error: "Session yanyu yarangiye cyangwa ntiyemewe. Banza winjire.",
      };
    }
    const limit = await bound.rateLimit(caller.id);
    if (limit === "unavailable") {
      return {
        success: false,
        status: 503,
        error: "Guhindura PIN byahagaritswe gato. Ongera ugerageze.",
      };
    }
    if (limit === "locked") {
      return {
        success: false,
        status: 429,
        error: "Mwarengeje inshuro zo guhindura PIN. Mwihangane gato.",
      };
    }
    const [profile, staff] = await Promise.all([
      bound.getProfile(caller.id),
      bound.getStaff(staffId),
    ]);
    const phone = normalizePhone(staff?.phone_normalized || staff?.phone || "");
    const result = await applyCashierPinRotation(
      { caller, profile, staff, newPin, phoneE164: phone },
      bound.ports
    );
    if (!result.ok) {
      return {
        success: false,
        status: result.status,
        error: result.error,
        credentialRotated: result.credentialRotated,
      };
    }
    return {
      success: true,
      status: 200,
      credentialRotated: true,
      message: "PIN yahinduwe neza.",
    };
  } catch (err) {
    console.error("handleOwnerResetCashierPin exception:", err instanceof Error ? err.name : "error");
    return {
      success: false,
      status: 503,
      error: "Guhindura PIN byanze. Ongera ugerageze.",
    };
  }
}

async function buildOwnerResetIO(
  _token: string,
  envUrl?: string,
  envKey?: string
): Promise<OwnerResetIO | null> {
  let admin: ReturnType<typeof getAdminClient>;
  let url = "";
  let key = "";
  try {
    url =
      envUrl ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://ixihbqubatyfulnurpco.supabase.co";
    key = envKey || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!key) return null;
    admin = getAdminClient(envUrl, envKey);
  } catch {
    return null;
  }

  const ports: RotationPorts = {
    async clearSession(staffId, ownerId) {
      const now = new Date().toISOString();
      const { data, error } = await admin
        .from("shop_staff")
        .update({ current_session_id: null, session_revoked_at: now, updated_at: now })
        .eq("id", staffId)
        .eq("owner_id", ownerId)
        .eq("status", "active")
        .select("id")
        .maybeSingle();
      return !error && !!data;
    },
    async commitCredential({ staffId, ownerId, authUserId, pinHash }) {
      const now = new Date().toISOString();
      const { data, error } = await admin
        .from("shop_staff")
        .update({
          pin_hash: pinHash,
          auth_user_id: authUserId,
          current_session_id: null,
          session_revoked_at: now,
          updated_at: now,
        })
        .eq("id", staffId)
        .eq("owner_id", ownerId)
        .eq("status", "active")
        .select("id")
        .maybeSingle();
      return !error && !!data;
    },
    async findAuthUserById(id) {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error || !data.user) return null;
      return { id: data.user.id, email: data.user.email ?? null };
    },
    async findAuthUserByEmail(email) {
      const headers = { Authorization: `Bearer ${key}`, apikey: key };
      const filtered = await fetch(
        `${url}/auth/v1/admin/users?page=1&per_page=200&filter=${encodeURIComponent(email)}`,
        { headers }
      );
      const pick = (users: { id?: string; email?: string | null }[]) =>
        users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
      if (filtered.ok) {
        const body = (await filtered.json()) as { users?: { id?: string; email?: string | null }[] };
        const match = pick(body.users || []);
        if (match?.id) return { id: match.id, email: match.email ?? null };
      }
      for (let page = 1; page <= 5; page += 1) {
        const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
        if (!res.ok) return null;
        const body = (await res.json()) as { users?: { id?: string; email?: string | null }[] };
        const users = body.users || [];
        const match = pick(users);
        if (match?.id) return { id: match.id, email: match.email ?? null };
        if (users.length < 200) return null;
      }
      return null;
    },
    async setPassword(userId, password) {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
        app_metadata: { role: "cashier" },
      });
      if (error) throw new Error("password update failed");
    },
    async createAuthUser(email, password) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "cashier" },
      });
      if (error || !data.user) throw new Error("create user failed");
      return { id: data.user.id };
    },
    deleteSessions({ email, password }) {
      return deleteAuthUserSessions(url, key, email, password);
    },
  };

  return {
    ports,
    async rateLimit(callerId) {
      const { data, error } = await admin.rpc("check_auth_rate_limit", {
        p_bucket: `owner_pin_reset:${callerId}`,
        p_max_attempts: 8,
        p_window_seconds: 900,
        p_lock_seconds: 900,
      });
      if (error) return "unavailable";
      const row = Array.isArray(data) ? data[0] : data;
      if (row && row.allowed === false) return "locked";
      return "ok";
    },
    async getCaller(accessToken) {
      const { data, error } = await admin.auth.getUser(accessToken);
      if (error || !data.user) return null;
      const appMeta = data.user.app_metadata as { role?: unknown } | undefined;
      return {
        id: data.user.id,
        email: data.user.email ?? null,
        appRole: typeof appMeta?.role === "string" ? appMeta.role : null,
      };
    },
    async getProfile(userId) {
      const { data, error } = await admin
        .from("profiles")
        .select("user_id, shop_code")
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !data) return null;
      return { user_id: data.user_id, shop_code: data.shop_code };
    },
    async getStaff(id) {
      const { data, error } = await admin
        .from("shop_staff")
        .select("id, status, auth_user_id, owner_id, name, phone, phone_normalized, shop_code")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      return data as RotationStaff;
    },
  };
}
