import { corsHeaders, json } from "../_shared/cors.ts";
import {
  applyCashierPinRotation,
  deleteAuthUserSessions,
  type RotationPorts,
  type RotationStaff,
} from "../_shared/cashierPinRotation.ts";
import { normalizePhoneE164 } from "../_shared/phone.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ ok: false, error: "Kwinjira birakenewe (token missing)" }, 401);

    const body = await req.json().catch(() => ({}));
    const staffId = String(body.staff_id || body.staffId || "").trim();
    const newPin = String(body.new_pin || body.newPin || body.pin || "").trim();
    if (!staffId) return json({ ok: false, error: "Umukozi arakenewe (staff_id irakenewe)" }, 400);
    if (!/^\d{4}$/.test(newPin)) return json({ ok: false, error: "PIN igomba kuba imibare 4" }, 400);

    const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("SB_URL") ?? "";
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !key) {
      return json({ ok: false, error: "Guhindura PIN byanze. Ongera ugerageze." }, 503);
    }
    const sb = adminClient();

    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData.user) {
      return json(
        { ok: false, error: "Session yanyu yarangiye cyangwa ntiyemewe. Banza winjire." },
        401
      );
    }
    const caller = userData.user;
    const appRole = (caller.app_metadata as { role?: unknown } | undefined)?.role;

    const { data: rateRows, error: rateErr } = await sb.rpc("check_auth_rate_limit", {
      p_bucket: `owner_pin_reset:${caller.id}`,
      p_max_attempts: 8,
      p_window_seconds: 900,
      p_lock_seconds: 900,
    });
    if (rateErr) {
      return json({ ok: false, error: "Guhindura PIN byahagaritswe gato. Ongera ugerageze." }, 503);
    }
    const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
    if (rate && rate.allowed === false) {
      return json(
        { ok: false, error: "Mwarengeje inshuro zo guhindura PIN. Mwihangane gato." },
        429
      );
    }

    const [{ data: profile, error: profErr }, { data: staff, error: staffErr }] = await Promise.all([
      sb.from("profiles").select("user_id, shop_code").eq("user_id", caller.id).maybeSingle(),
      sb
        .from("shop_staff")
        .select("id, status, auth_user_id, owner_id, name, phone, phone_normalized, shop_code")
        .eq("id", staffId)
        .maybeSingle(),
    ]);
    if (profErr || staffErr) {
      return json({ ok: false, error: "Guhindura PIN byanze. Ongera ugerageze." }, 503);
    }

    const ports: RotationPorts = {
      async clearSession(id, ownerId) {
        const now = new Date().toISOString();
        const { data, error } = await sb
          .from("shop_staff")
          .update({ current_session_id: null, session_revoked_at: now, updated_at: now })
          .eq("id", id)
          .eq("owner_id", ownerId)
          .eq("status", "active")
          .select("id")
          .maybeSingle();
        return !error && !!data;
      },
      async commitCredential({ staffId: id, ownerId, authUserId, pinHash }) {
        const now = new Date().toISOString();
        const { data, error } = await sb
          .from("shop_staff")
          .update({
            pin_hash: pinHash,
            auth_user_id: authUserId,
            current_session_id: null,
            session_revoked_at: now,
            updated_at: now,
          })
          .eq("id", id)
          .eq("owner_id", ownerId)
          .eq("status", "active")
          .select("id")
          .maybeSingle();
        return !error && !!data;
      },
      async findAuthUserById(id) {
        const { data, error } = await sb.auth.admin.getUserById(id);
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
          const body = await filtered.json();
          const match = pick(body.users || []);
          if (match?.id) return { id: match.id, email: match.email ?? null };
        }
        for (let page = 1; page <= 5; page += 1) {
          const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
          if (!res.ok) return null;
          const body = await res.json();
          const users = body.users || [];
          const match = pick(users);
          if (match?.id) return { id: match.id, email: match.email ?? null };
          if (users.length < 200) return null;
        }
        return null;
      },
      async setPassword(userId, password) {
        const { error } = await sb.auth.admin.updateUserById(userId, {
          password,
          app_metadata: { role: "cashier" },
        });
        if (error) throw new Error("password update failed");
      },
      async createAuthUser(email, password) {
        const { data, error } = await sb.auth.admin.createUser({
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

    const result = await applyCashierPinRotation(
      {
        caller: {
          id: caller.id,
          email: caller.email ?? null,
          appRole: typeof appRole === "string" ? appRole : null,
        },
        profile: profile ? { user_id: profile.user_id, shop_code: profile.shop_code } : null,
        staff: (staff as RotationStaff | null) ?? null,
        newPin,
        phoneE164: normalizePhoneE164(staff?.phone_normalized || staff?.phone || ""),
      },
      ports
    );
    if (!result.ok) {
      return json(
        { ok: false, error: result.error, credentialRotated: result.credentialRotated },
        result.status
      );
    }
    return json({ ok: true, success: true, credentialRotated: true, message: "PIN yahinduwe neza." });
  } catch (err) {
    console.error("owner-reset-cashier-pin", err instanceof Error ? err.name : "error");
    return json({ ok: false, error: "Guhindura PIN byanze. Ongera ugerageze." }, 503);
  }
});
