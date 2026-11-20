import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

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

    if (!rawCode) {
      return json({ ok: false, error: "Shop Code irakenewe (e.g. SEL-MXA8TT)" }, 400);
    }

    const cleanCode = normalizeShopCode(rawCode);
    if (!/^SEL-[A-Z0-9]{4,10}$/.test(cleanCode)) {
      return json({ ok: false, error: "Shop Code igomba kuba format ya SEL-XXXX" }, 400);
    }

    const sb = adminClient();

    // 1. Find profile by shop_code
    const { data: profile, error: profErr } = await sb
      .from("profiles")
      .select("id, user_id, business_name, owner_name, shop_code")
      .ilike("shop_code", cleanCode)
      .maybeSingle();

    if (profErr) {
      console.error("lookup-shop-code DB error:", profErr);
      return json({ ok: false, error: "Habaye ikibazo cya seriveri mu gushaka iduka" }, 500);
    }

    if (!profile) {
      return json(
        { ok: false, error: `Shop Code "${cleanCode}" ntibonetse. Baza nyiri ubucuruzi code nyayo y'iduka.` },
        404
      );
    }

    // 2. Verify owner's active subscription status & write access
    const { data: sub, error: subErr } = await sb
      .from("user_subscriptions")
      .select("status, plan_tier, trial_ends_at, current_period_end")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    if (subErr) {
      console.warn("lookup-shop-code subscription read warning:", subErr);
    }

    const subStatus = sub?.status || "inactive";
    const now = Date.now();
    let hasWriteAccess = false;

    if (subStatus === "active" || subStatus === "trialing") {
      hasWriteAccess = true;
    } else if (sub?.current_period_end) {
      // 3-day grace period
      const endMs = new Date(sub.current_period_end).getTime();
      const graceEndMs = endMs + 3 * 86400000;
      if (now <= graceEndMs) {
        hasWriteAccess = true;
      }
    }

    // Even if in trial or grace, allow onboarding so employees can work
    if (!hasWriteAccess && subStatus === "expired") {
      return json(
        {
          ok: false,
          error: `Iduka "${profile.business_name}" rifite ikibazo cya subscription (irashaje). Baza nyir'ubucuruzi ngo yishyure.`,
          shop: {
            businessName: profile.business_name || "Iduka",
            ownerName: profile.owner_name || "Nyir'ubucuruzi",
            shopCode: profile.shop_code || cleanCode,
            hasWriteAccess: false,
          },
        },
        403
      );
    }

    return json({
      ok: true,
      shop: {
        businessName: profile.business_name || "Iduka",
        ownerName: profile.owner_name || "Nyir'ubucuruzi",
        shopCode: profile.shop_code || cleanCode,
        ownerId: profile.user_id,
        hasWriteAccess: true,
      },
    });
  } catch (e) {
    console.error("lookup-shop-code exception:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Gushaka iduka byanze" }, 500);
  }
});
