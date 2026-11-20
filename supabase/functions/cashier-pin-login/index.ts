import { corsHeaders, json } from "../_shared/cors.ts";
import {
  assertCashierMayLogin,
  sessionIdFromAccessToken,
  type StaffRosterRow,
} from "../_shared/cashierJoinGuard.ts";
import { staffLoginEmail, staffLoginPassword } from "../_shared/cashierPinRotation.ts";
import { normalizePhoneE164 } from "../_shared/phone.ts";
import { adminClient, sessionClient } from "../_shared/supabaseAdmin.ts";

function normalizeShopCode(raw: string): string {
  let clean = (raw || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!clean.startsWith("SEL-")) {
    if (clean.startsWith("SEL")) clean = `SEL-${clean.slice(3)}`;
    else clean = `SEL-${clean}`;
  }
  return clean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const rawCode = String(body.shop_code || body.shopCode || "").trim();
    const rawPhone = String(body.phone || "").trim();
    const pin = String(body.pin || "").trim();

    if (!rawCode) return json({ ok: false, error: "Shop Code irakenewe" }, 400);
    if (!rawPhone) return json({ ok: false, error: "Nimero ya telefone irakenewe" }, 400);
    if (!/^\d{4}$/.test(pin)) return json({ ok: false, error: "PIN igomba kuba imibare 4" }, 400);

    const phone = normalizePhoneE164(rawPhone);
    if (!phone) return json({ ok: false, error: "Nimero ya telefone ntiyemewe mu Rwanda" }, 400);

    const cleanCode = normalizeShopCode(rawCode);
    const sb = adminClient();

    // 1. Rate limiting. Fail closed: a broken limiter must not allow unlimited PIN guesses.
    const bucket = `cashier_pin:${cleanCode}:${phone}`;
    const { data: rateRows, error: rateErr } = await sb.rpc("check_auth_rate_limit", {
      p_bucket: bucket,
      p_max_attempts: 8,
      p_window_seconds: 900,
      p_lock_seconds: 900,
    });
    if (rateErr) {
      console.error("cashier rate limit rpc", rateErr);
      return json(
        { ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." },
        503
      );
    }
    const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
    if (rate && rate.allowed === false) {
      return json(
        {
          ok: false,
          error: "Mwarengeje inshuro zo kugerageza PIN. Mwihangane gato.",
          retry_after_seconds: rate.retry_after_seconds || 900,
        },
        429
      );
    }

    // 2. Verify shop exists
    const { data: profile } = await sb
      .from("profiles")
      .select("id, user_id, business_name, owner_name, shop_code")
      .ilike("shop_code", cleanCode)
      .maybeSingle();

    if (!profile) {
      return json({ ok: false, error: `Shop Code "${cleanCode}" ntibonetse` }, 404);
    }

    // 3. The owner roster is required. A missing table or a bad query fails closed.
    const { data: staffRow, error: staffErr } = await sb
      .from("shop_staff")
      .select("id, status, name, auth_user_id, owner_id")
      .ilike("shop_code", cleanCode)
      .eq("phone_normalized", phone)
      .maybeSingle();
    if (staffErr) {
      console.error("cashier roster", staffErr);
      return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
    }
    const decision = assertCashierMayLogin(
      staffRow as StaffRosterRow | null,
      profile.user_id
    );
    if (!decision.ok) return json({ ok: false, error: decision.error }, decision.status);

    // 4. Authenticate cashier
    const staffEmail = staffLoginEmail(cleanCode, phone);
    const staffPassword = staffLoginPassword(pin, phone);

    if (staffRow?.auth_user_id) {
      const { error: metaErr } = await sb.auth.admin.updateUserById(staffRow.auth_user_id, {
        app_metadata: { role: "cashier" },
      });
      if (metaErr) {
        return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
      }
    }

    let { data: sessionData, error: signErr } = await sessionClient().auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    });

    if (signErr || !sessionData.session?.access_token || !sessionData.user) {
      return json({ ok: false, error: "PIN ntabwo ariyo! Ongera ugerageze." }, 401);
    }

    if (!staffRow?.auth_user_id) {
      const { error: metaErr } = await sb.auth.admin.updateUserById(sessionData.user.id, {
        app_metadata: { role: "cashier" },
      });
      if (metaErr) {
        await sb.auth.admin.signOut(sessionData.session.access_token, "global");
        return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
      }
      await sb.auth.admin.signOut(sessionData.session.access_token, "global");
      const again = await sessionClient().auth.signInWithPassword({
        email: staffEmail,
        password: staffPassword,
      });
      sessionData = again.data;
      signErr = again.error;
      if (signErr || !sessionData.session?.access_token || !sessionData.user) {
        return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
      }
    }

    const authUser = sessionData.user;
    const staffName = staffRow?.name || authUser.user_metadata?.full_name || "Cashier";
    const sessionId = sessionIdFromAccessToken(sessionData.session.access_token);
    if (!sessionId || !staffRow?.id) {
      await sb.auth.admin.signOut(sessionData.session.access_token, "global");
      return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
    }

    const now = new Date().toISOString();
    const { error: bindErr } = await sb
      .from("shop_staff")
      .update({
        auth_user_id: authUser.id,
        current_session_id: sessionId,
        last_active_at: now,
        updated_at: now,
      })
      .eq("id", staffRow.id)
      .eq("status", "active")
      .eq("owner_id", profile.user_id);
    if (bindErr) {
      await sb.auth.admin.signOut(sessionData.session.access_token, "global");
      return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
    }

    try {
      await sb.from("auth_rate_limits").delete().eq("bucket_key", bucket);
    } catch {
      /* a failed cleanup must not undo a bound session */
    }

    return json({
      success: true,
      access_token: sessionData.session?.access_token,
      refresh_token: sessionData.session?.refresh_token,
      staff: {
        id: authUser.id,
        name: staffName,
        phone,
        phone_normalized: phone,
        role: "cashier",
        status: "active",
        shop_code: cleanCode,
        owner_id: profile.user_id,
      },
      shop: {
        businessName: profile.business_name || "Iduka",
        ownerName: profile.owner_name || "Nyir'ubucuruzi",
        shopCode: cleanCode,
        ownerId: profile.user_id,
      },
    });
  } catch (e) {
    console.error("cashier-pin-login exception:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Kwinjira byanze" }, 500);
  }
});
