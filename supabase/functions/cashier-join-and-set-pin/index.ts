import { corsHeaders, json } from "../_shared/cors.ts";
import {
  assertCashierMaySetPin,
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
    const name = String(body.name || "").trim();
    const pin = String(body.pin || "").trim();

    if (!rawCode) return json({ ok: false, error: "Shop Code irakenewe" }, 400);
    if (!rawPhone) return json({ ok: false, error: "Nimero ya telefone irakenewe" }, 400);
    if (!name) return json({ ok: false, error: "Izina ry'umukozi rirakenewe" }, 400);
    if (!/^\d{4}$/.test(pin)) return json({ ok: false, error: "PIN igomba kuba imibare 4" }, 400);

    const phone = normalizePhoneE164(rawPhone);
    if (!phone) return json({ ok: false, error: "Nimero ya telefone ntiyemewe mu Rwanda" }, 400);

    const cleanCode = normalizeShopCode(rawCode);
    const sb = adminClient();

    // 1. Verify shop exists
    const { data: profile, error: profErr } = await sb
      .from("profiles")
      .select("id, user_id, business_name, owner_name, shop_code")
      .ilike("shop_code", cleanCode)
      .maybeSingle();

    if (profErr || !profile) {
      return json({ ok: false, error: `Shop Code "${cleanCode}" ntibonetse` }, 404);
    }

    // 2. Verify subscription has write access
    const { data: sub } = await sb
      .from("user_subscriptions")
      .select("status, current_period_end")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    const subStatus = sub?.status || "inactive";
    let hasWriteAccess = false;
    if (subStatus === "active" || subStatus === "trialing") {
      hasWriteAccess = true;
    } else if (sub?.current_period_end) {
      const endMs = new Date(sub.current_period_end).getTime();
      if (Date.now() <= endMs + 3 * 86400000) hasWriteAccess = true;
    }

    if (!hasWriteAccess && subStatus === "expired") {
      return json(
        { ok: false, error: "Iri duka rifite ikibazo cya subscription (ntiyemerewe kwinjizamo abakozi)" },
        403
      );
    }

    const { data: roster, error: rosterErr } = await sb
      .from("shop_staff")
      .select("id, status, auth_user_id, owner_id, name")
      .ilike("shop_code", cleanCode)
      .eq("phone_normalized", phone)
      .maybeSingle();
    if (rosterErr) {
      return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
    }
    const decision = assertCashierMaySetPin(roster as StaffRosterRow | null, profile.user_id);
    if (!decision.ok) return json({ ok: false, error: decision.error }, decision.status);

    // 3. Derive synthetic staff auth identity
    const staffEmail = staffLoginEmail(cleanCode, phone);
    const staffPassword = staffLoginPassword(pin, phone);

    // 4. Create or update auth.users account for this staff
    const { data: userList } = await sb.auth.admin.listUsers();
    const existingAuthUser = (userList?.users || []).find(
      (u) => u.email?.toLowerCase() === staffEmail.toLowerCase()
    );

    let staffAuthUserId: string;

    if (existingAuthUser) {
      staffAuthUserId = existingAuthUser.id;
      const { error: updateErr } = await sb.auth.admin.updateUserById(staffAuthUserId, {
        password: staffPassword,
        app_metadata: { role: "cashier" },
        user_metadata: {
          role: "cashier",
          shop_code: cleanCode,
          owner_id: profile.user_id,
          full_name: name,
          phone,
          phone_normalized: phone,
          pin_length: 4,
        },
      });
      if (updateErr) {
        return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
      }
    } else {
      const { data: created, error: createErr } = await sb.auth.admin.createUser({
        email: staffEmail,
        password: staffPassword,
        email_confirm: true,
        app_metadata: { role: "cashier" },
        user_metadata: {
          role: "cashier",
          shop_code: cleanCode,
          owner_id: profile.user_id,
          full_name: name,
          phone,
          phone_normalized: phone,
          pin_length: 4,
        },
      });
      if (createErr || !created.user) {
        throw new Error(createErr?.message || "Failed creating cashier auth account");
      }
      staffAuthUserId = created.user.id;
    }

    // 5. Sign in to issue verifiable Supabase session tokens
    const { data: sessionData, error: signErr } = await sessionClient().auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    });

    if (signErr || !sessionData.session?.access_token) {
      console.error("signInWithPassword for cashier failed:", signErr);
      return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
    }

    const sessionId = sessionIdFromAccessToken(sessionData.session.access_token);
    if (!sessionId || !roster?.id) {
      await sb.auth.admin.signOut(sessionData.session.access_token, "global");
      return json({ ok: false, error: "Kwinjira byahagaritswe gato. Ongera ugerageze." }, 503);
    }

    const now = new Date().toISOString();
    const { data: bound, error: bindErr } = await sb
      .from("shop_staff")
      .update({
        auth_user_id: staffAuthUserId,
        current_session_id: sessionId,
        name,
        last_active_at: now,
        updated_at: now,
      })
      .eq("id", roster.id)
      .eq("status", "active")
      .eq("owner_id", profile.user_id)
      .is("auth_user_id", null)
      .select("id")
      .maybeSingle();
    if (bindErr || !bound) {
      await sb.auth.admin.signOut(sessionData.session.access_token, "global");
      return json(
        {
          ok: false,
          error:
            "PIN yamaze gushyirwaho. Injira ukoresheje PIN, cyangwa saba nyiri ubucuruzi kuyihindura.",
        },
        409
      );
    }

    return json({
      success: true,
      access_token: sessionData.session?.access_token,
      refresh_token: sessionData.session?.refresh_token,
      staff: {
        id: staffAuthUserId,
        name,
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
    console.error("cashier-join-and-set-pin exception:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Kwemeza umukozi byanze" }, 500);
  }
});
