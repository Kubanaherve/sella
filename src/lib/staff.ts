import { db, newId, nowIso } from "@/db/localDb";
import type { ShopStaff, StaffRole, StaffStatus } from "@/db/types";
import { normalizePhoneE164 } from "@/lib/phone";
import { hashPin, verifyPin } from "@/lib/pin";
import { getSupabase, hasSupabaseConfig, isCloudMode } from "@/integrations/supabase/client";

export interface ShopInfo {
  businessName: string;
  ownerName: string | null;
  shopCode: string;
  ownerId?: string;
}

export interface StaffSalesStats {
  staffId: string;
  salesCount: number;
  salesVolume: number;
  todaySalesCount: number;
  todaySalesVolume: number;
}

/** Format shop code: trim and upper-case, guarantee SEL- prefix */
export function normalizeShopCode(raw: string): string {
  let clean = (raw || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!clean.startsWith("SEL-")) {
    if (clean.startsWith("SEL")) {
      clean = `SEL-${clean.slice(3)}`;
    } else if (clean) {
      clean = `SEL-${clean}`;
    }
  }
  return clean;
}

/** Verify if a shop code exists and return its store details */
export async function findShopByCode(rawCode: string): Promise<ShopInfo> {
  const shopCode = normalizeShopCode(rawCode);
  if (!shopCode || shopCode.length < 5 || !/^SEL-[A-Z0-9]{4,10}$/.test(shopCode)) {
    throw new Error("Shop Code igomba kuba format ya SEL-XXXX (urugero: SEL-MXA8TT)");
  }

  // 1. Check local Dexie profiles first (works offline and local-first)
  try {
    const localProfile = await db.profiles
      .where("shop_code")
      .equalsIgnoreCase(shopCode)
      .first();

    if (localProfile) {
      return {
        businessName: localProfile.business_name || "Iduka",
        ownerName: localProfile.display_name || localProfile.business_name || "Nyir'ubucuruzi",
        shopCode: localProfile.shop_code || shopCode,
        ownerId: localProfile.id,
      };
    }
  } catch (dexieErr) {
    console.warn("Dexie profile lookup warning:", dexieErr);
  }

  // 2. In test environment, call handleLookupShopCode directly for instant testing
  if (import.meta.env.MODE === "test") {
    try {
      const { handleLookupShopCode } = await import("@/server/staffApiHandler");
      const res = await handleLookupShopCode(shopCode);
      if (res.ok && res.shop) {
        return res.shop;
      }
      if (!res.ok) {
        throw new Error(res.error || `Shop Code "${shopCode}" ntibonetse`);
      }
    } catch (testErr) {
      if (
        testErr instanceof Error &&
        (testErr.message.includes("Shop Code") ||
          testErr.message.includes("subscription") ||
          testErr.message.includes("ntibonetse"))
      ) {
        throw testErr;
      }
    }
  }

  // 3. Check network connectivity
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Nta murongo wa interineti uhari. Shyiraho interineti kugira ngo ushake iduka.");
  }

  // 4. Try direct Supabase RPC get_shop_info_by_code (fastest cloud path)
  if (isCloudMode() && hasSupabaseConfig()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.rpc("get_shop_info_by_code", {
        p_shop_code: shopCode,
      });

      if (!error && data) {
        if (!data.has_write_access) {
          throw new Error("Iduka ryarengeje igihe cy'ifatabuguzi ryaryo. Baza nyiri ubucuruzi.");
        }
        return {
          businessName: data.business_name || "Iduka",
          ownerName: data.owner_name || data.business_name || "Nyir'ubucuruzi",
          shopCode: data.shop_code || shopCode,
          ownerId: data.owner_id,
          hasWriteAccess: Boolean(data.has_write_access),
        };
      }
      if (error && error.message && error.message.includes("ntibonetse")) {
        throw new Error(`Shop Code "${shopCode}" ntibonetse. Baza nyiri ubucuruzi code nyayo y'iduka.`);
      }
    } catch (rpcErr) {
      if (
        rpcErr instanceof Error &&
        (rpcErr.message.includes("Shop Code") ||
          rpcErr.message.includes("ifatabuguzi") ||
          rpcErr.message.includes("ntibonetse"))
      ) {
        throw rpcErr;
      }
      console.warn("RPC get_shop_info_by_code warning:", rpcErr);
    }
  }

  // 5. Try /api/lookup-shop-code endpoint (served by backend / dev server)
  if (typeof window !== "undefined" && window.location?.origin && import.meta.env.MODE !== "test") {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch("/api/lookup-shop-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_code: shopCode }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.shop) {
          return json.shop;
        }
      } else if (res.status === 404 || res.status === 400 || res.status === 403) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Shop Code "${shopCode}" ntibonetse`);
      }
    } catch (apiErr) {
      if (
        apiErr instanceof Error &&
        (apiErr.message.includes("Shop Code") ||
          apiErr.message.includes("subscription") ||
          apiErr.message.includes("ntibonetse"))
      ) {
        throw apiErr;
      }
    }
  }

  // 4. Try Supabase Edge Function `lookup-shop-code`
  if (isCloudMode() && hasSupabaseConfig()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke("lookup-shop-code", {
        body: { shop_code: shopCode },
      });

      if (!error && data?.ok && data.shop) {
        return data.shop;
      }
      if (error) {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          const body = (await ctx.json().catch(() => ({}))) as { error?: string };
          if (body?.error) {
            throw new Error(body.error);
          }
        }
      }
    } catch (edgeErr) {
      if (
        edgeErr instanceof Error &&
        (edgeErr.message.includes("Shop Code") ||
          edgeErr.message.includes("subscription") ||
          edgeErr.message.includes("ntibonetse"))
      ) {
        throw edgeErr;
      }
      console.warn("Edge function lookup-shop-code warning:", edgeErr);
    }
  }

  throw new Error(`Shop Code "${shopCode}" ntibonetse. Baza nyiri ubucuruzi code nyayo y'iduka.`);
}

/** Cashier sets their 4-digit PIN after submitting Shop Code & Phone */
export async function staffRegisterOrSetPin(input: {
  shopCode: string;
  phone: string;
  name: string;
  pin: string;
  role?: StaffRole;
}): Promise<{ staff: ShopStaff; shop: ShopInfo; access_token?: string; refresh_token?: string }> {
  const shop = await findShopByCode(input.shopCode);
  const phone_normalized = normalizePhoneE164(input.phone);
  if (!phone_normalized) {
    throw new Error("Nimero ya telefone ntiyemewe mu Rwanda");
  }
  const cleanPin = input.pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    throw new Error("PIN igomba kuba imibare 4");
  }
  const pin_hash = await hashPin(cleanPin);
  const now = nowIso();

  let cloudTokens: { access_token?: string; refresh_token?: string } = {};

  // 1. Try cloud registration via /api/cashier-join-and-set-pin or Edge Function
  if (isCloudMode() && import.meta.env.MODE !== "test" && typeof window !== "undefined") {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch("/api/cashier-join-and-set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopCode: shop.shopCode,
          phone: phone_normalized,
          name: input.name.trim(),
          pin: cleanPin,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          cloudTokens = {
            access_token: json.access_token,
            refresh_token: json.refresh_token,
          };
        }
      } else {
        const json = await res.json().catch(() => ({}));
        if (json.error) throw new Error(json.error);
      }
    } catch (apiErr) {
      if (
        apiErr instanceof Error &&
        (apiErr.message.includes("PIN") ||
          apiErr.message.includes("subscription") ||
          apiErr.message.includes("Konti") ||
          apiErr.message.includes("umukozi") ||
          apiErr.message.includes("hagaritswe"))
      ) {
        throw apiErr;
      }

      // Try Edge Function
      if (hasSupabaseConfig()) {
        try {
          const sb = getSupabase();
          const { data, error } = await sb.functions.invoke("cashier-join-and-set-pin", {
            body: {
              shop_code: shop.shopCode,
              phone: phone_normalized,
              name: input.name.trim(),
              pin: cleanPin,
            },
          });
          if (error) {
            const ctx = (error as { context?: Response }).context;
            if (ctx && typeof ctx.json === "function") {
              const b = (await ctx.json().catch(() => ({}))) as { error?: string };
              if (b?.error) throw new Error(b.error);
            }
          } else if (data?.success) {
            cloudTokens = {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            };
          }
        } catch (edgeErr) {
          if (
            edgeErr instanceof Error &&
            (edgeErr.message.includes("PIN") ||
              edgeErr.message.includes("subscription") ||
              edgeErr.message.includes("Konti") ||
              edgeErr.message.includes("umukozi") ||
              edgeErr.message.includes("hagaritswe"))
          ) {
            throw edgeErr;
          }
        }
      }
    }
  }

  // 2. Check if staff already exists in Dexie (offline persistence)
  const existing = await db.staff
    .where("shop_code")
    .equalsIgnoreCase(shop.shopCode)
    .filter((s) => s.phone_normalized === phone_normalized)
    .first();

  let staffRecord: ShopStaff;

  if (existing) {
    if (existing.status === "deactivated") {
      throw new Error("Konti yawe yarahagaritswe na nyiri ubucuruzi.");
    }
    await db.staff.update(existing.id, {
      name: input.name.trim() || existing.name,
      pin_hash,
      last_active_at: now,
      updated_at: now,
    });
    staffRecord = (await db.staff.get(existing.id))!;
  } else {
    staffRecord = {
      id: newId(),
      profile_id: shop.ownerId || "local",
      owner_id: shop.ownerId,
      shop_code: shop.shopCode,
      name: input.name.trim() || "Cashier",
      phone: input.phone.trim(),
      phone_normalized,
      role: input.role || "cashier",
      status: "active",
      pin_hash,
      last_active_at: now,
      created_at: now,
      updated_at: now,
    };
    await db.staff.add(staffRecord);
  }

  return { staff: staffRecord, shop, ...cloudTokens };
}

/** Cashier login with Shop Code, Phone, and 4-digit PIN */
export async function staffLoginWithPin(input: {
  shopCode: string;
  phone: string;
  pin: string;
}): Promise<{ staff: ShopStaff; shop: ShopInfo; access_token?: string; refresh_token?: string }> {
  const shop = await findShopByCode(input.shopCode);
  const phone_normalized = normalizePhoneE164(input.phone);
  if (!phone_normalized) throw new Error("Nimero ya telefone ntiyemewe");
  const cleanPin = input.pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) throw new Error("PIN igomba kuba imibare 4");

  let cloudTokens: { access_token?: string; refresh_token?: string } = {};

  // 1. Try Cloud backend login
  if (isCloudMode() && import.meta.env.MODE !== "test" && typeof window !== "undefined") {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch("/api/cashier-pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopCode: shop.shopCode,
          phone: phone_normalized,
          pin: cleanPin,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          cloudTokens = {
            access_token: json.access_token,
            refresh_token: json.refresh_token,
          };
        }
      } else {
        const json = await res.json().catch(() => ({}));
        if (json.error) throw new Error(json.error);
      }
    } catch (apiErr) {
      if (
        apiErr instanceof Error &&
        (apiErr.message.includes("PIN") ||
          apiErr.message.includes("Konti") ||
          apiErr.message.includes("inshuro") ||
          apiErr.message.includes("umukozi") ||
          apiErr.message.includes("hagaritswe"))
      ) {
        throw apiErr;
      }

      // Try Edge Function
      if (hasSupabaseConfig()) {
        try {
          const sb = getSupabase();
          const { data, error } = await sb.functions.invoke("cashier-pin-login", {
            body: {
              shop_code: shop.shopCode,
              phone: phone_normalized,
              pin: cleanPin,
            },
          });
          if (error) {
            const ctx = (error as { context?: Response }).context;
            if (ctx && typeof ctx.json === "function") {
              const b = (await ctx.json().catch(() => ({}))) as { error?: string };
              if (b?.error) throw new Error(b.error);
            }
          } else if (data?.success) {
            cloudTokens = {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            };
          }
        } catch (edgeErr) {
          if (
            edgeErr instanceof Error &&
            (edgeErr.message.includes("PIN") ||
              edgeErr.message.includes("Konti") ||
              edgeErr.message.includes("inshuro") ||
              edgeErr.message.includes("umukozi") ||
              edgeErr.message.includes("hagaritswe"))
          ) {
            throw edgeErr;
          }
        }
      }
    }
  }

  // 2. Query Dexie local records (supports offline operation)
  let staff = await db.staff
    .where("shop_code")
    .equalsIgnoreCase(shop.shopCode)
    .filter((s) => s.phone_normalized === phone_normalized)
    .first();

  if (!staff) {
    // If not found in local Dexie but authenticated via cloud, create local staff cache
    if (cloudTokens.access_token) {
      staff = {
        id: newId(),
        profile_id: shop.ownerId || "cloud",
        owner_id: shop.ownerId,
        shop_code: shop.shopCode,
        name: "Cashier",
        phone: input.phone,
        phone_normalized,
        role: "cashier",
        status: "active",
        pin_hash: await hashPin(cleanPin),
        last_active_at: nowIso(),
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      await db.staff.add(staff);
    } else {
      throw new Error("Umukozi ntabonetse kuri iri duka. Baza nyir'ubucuruzi.");
    }
  }

  if (staff.status === "deactivated") {
    throw new Error("Konti yawe yarahagaritswe na nyiri ubucuruzi.");
  }

  if (!cloudTokens.access_token) {
    if (!staff.pin_hash) {
      throw new Error("PIN sibyo! Ongera ugerageze.");
    }
    const valid = await verifyPin(cleanPin, staff.pin_hash);
    if (!valid) {
      throw new Error("PIN sibyo! Ongera ugerageze.");
    }
  }

  const now = nowIso();
  await db.staff.update(staff.id, { last_active_at: now, updated_at: now });
  staff.last_active_at = now;

  return { staff, shop, ...cloudTokens };
}

/** List all staff for the owner's shop with sales volume statistics */
export async function listShopStaff(
  ownerProfileId: string,
  shopCode?: string | null
): Promise<ShopStaff[]> {
  let staffList = await db.staff
    .filter(
      (s) =>
        s.profile_id === ownerProfileId ||
        (!!shopCode && s.shop_code.toUpperCase() === shopCode.toUpperCase())
    )
    .toArray();

  // If in cloud mode and local is empty, fetch cloud staff
  if (staffList.length === 0 && isCloudMode() && hasSupabaseConfig() && shopCode) {
    const sb = getSupabase();
    const { data } = await sb
      .from("shop_staff")
      .select(
        "id, owner_id, shop_code, name, phone, phone_normalized, role, status, last_active_at, session_revoked_at, created_at, updated_at"
      )
      .ilike("shop_code", shopCode)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      staffList = data.map((d) => ({
        id: d.id,
        profile_id: ownerProfileId,
        owner_id: d.owner_id,
        shop_code: d.shop_code,
        name: d.name,
        phone: d.phone,
        phone_normalized: d.phone_normalized,
        role: d.role as StaffRole,
        status: d.status as StaffStatus,
        last_active_at: d.last_active_at,
        session_revoked_at: d.session_revoked_at,
        created_at: d.created_at,
        updated_at: d.updated_at,
      }));
      for (const s of staffList) {
        await db.staff.put(s);
      }
    }
  }

  // Aggregate sales statistics for each staff member
  const allSales = await db.sales
    .filter((s) => !s.profile_id || s.profile_id === ownerProfileId)
    .toArray();

  const enriched = staffList.map((st) => {
    const staffSales = allSales.filter(
      (sale) =>
        sale.cashier_user_id === st.id ||
        (sale as unknown as { cashier_id?: string }).cashier_id === st.id ||
        sale.cashier_name === st.name ||
        (sale as unknown as { cashier_name?: string }).cashier_name === st.name
    );
    const count = staffSales.length;
    const volume = staffSales.reduce(
      (sum, s) =>
        sum +
        ((s as unknown as { total_amount?: number }).total_amount ||
          (s.sale_price * s.quantity) ||
          0),
      0
    );
    return {
      ...st,
      total_sales_count: count,
      total_sales_volume: volume,
    };
  });

  return enriched.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Owner adds a new staff member to their shop */
export async function addShopStaff(
  ownerProfileId: string,
  shopCode: string,
  input: { name: string; phone: string; role?: StaffRole }
): Promise<ShopStaff> {
  const phone_normalized = normalizePhoneE164(input.phone);
  if (!phone_normalized) throw new Error("Nimero ya telefone ntiyemewe");
  const now = nowIso();

  const existing = await db.staff
    .where("shop_code")
    .equalsIgnoreCase(shopCode)
    .filter((s) => s.phone_normalized === phone_normalized)
    .first();

  if (existing) {
    if (existing.status === "deactivated") {
      await db.staff.update(existing.id, {
        status: "active",
        name: input.name.trim(),
        role: input.role || "cashier",
        updated_at: now,
      });
      return (await db.staff.get(existing.id))!;
    }
    throw new Error("Uyu mukozi asanzwe yanditse kuri iri duka.");
  }

  const staff: ShopStaff = {
    id: newId(),
    profile_id: ownerProfileId,
    shop_code: normalizeShopCode(shopCode),
    name: input.name.trim(),
    phone: input.phone.trim(),
    phone_normalized,
    role: input.role || "cashier",
    status: "active",
    last_active_at: null,
    created_at: now,
    updated_at: now,
  };

  await db.staff.add(staff);

  if (isCloudMode() && hasSupabaseConfig()) {
    try {
      const sb = getSupabase();
      await sb.from("shop_staff").insert({
        id: staff.id,
        shop_code: staff.shop_code,
        owner_id: ownerProfileId,
        name: staff.name,
        phone: staff.phone,
        phone_normalized: staff.phone_normalized,
        role: staff.role,
        status: "active",
        created_at: now,
        updated_at: now,
      });
    } catch (e) {
      console.warn("Could not sync new staff member to cloud:", e);
    }
  }

  return staff;
}

/** Owner toggles a cashier between active and deactivated */
export async function toggleStaffStatus(
  staffId: string,
  activeOrStatus: boolean | StaffStatus
): Promise<void> {
  const now = nowIso();
  const nextStatus: StaffStatus =
    typeof activeOrStatus === "boolean"
      ? activeOrStatus
        ? "active"
        : "deactivated"
      : activeOrStatus === "active"
      ? "active"
      : "deactivated";
  await db.staff.update(staffId, {
    status: nextStatus,
    updated_at: now,
    // If deactivated, also revoke active sessions
    ...(nextStatus === "active" ? {} : { session_revoked_at: now }),
  });

  if (isCloudMode() && hasSupabaseConfig()) {
    try {
      const sb = getSupabase();
      await sb
        .from("shop_staff")
        .update({
          status: nextStatus,
          updated_at: now,
          ...(nextStatus === "active" ? {} : { session_revoked_at: now }),
        })
        .eq("id", staffId);
    } catch (e) {
      console.warn("Could not update staff status in cloud:", e);
    }
  }
}

/** Owner resets a cashier's 4-digit PIN */
export async function resetStaffPin(
  staffId: string,
  newPin: string
): Promise<void> {
  const cleanPin = newPin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    throw new Error("PIN igomba kuba imibare 4");
  }

  // Prevent resetting PIN on a deactivated cashier
  const localStaff = await db.staff.get(staffId);
  if (localStaff && localStaff.status === "deactivated") {
    throw new Error("Umukozi yarahagaritswe. Banza umufungure mbere yo guhindura PIN.");
  }

  const pin_hash = await hashPin(cleanPin);
  const now = nowIso();

  // If in cloud mode and running in browser, invoke server-side credential rotation
  if (isCloudMode() && typeof window !== "undefined" && import.meta.env.MODE !== "test") {
    let callerToken: string | undefined;
    if (hasSupabaseConfig()) {
      try {
        const sb = getSupabase();
        const { data } = await sb.auth.getSession();
        callerToken = data.session?.access_token;
      } catch (e) {
        console.warn("Could not get auth session for PIN reset:", e);
      }
    }

    let cloudSucceeded = false;
    let cloudError: string | undefined;
    let resJson: { credentialRotated?: boolean; error?: string; success?: boolean; ok?: boolean } | null =
      null;

    // 1. Try local dev server API endpoint
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (callerToken) headers["Authorization"] = `Bearer ${callerToken}`;

      const res = await fetch("/api/owner-reset-cashier-pin", {
        method: "POST",
        headers,
        body: JSON.stringify({ staffId, newPin: cleanPin }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const json = await res.json().catch(() => ({}));
      resJson = json;
      if (res.ok && (json.success || json.ok)) {
        cloudSucceeded = true;
      } else {
        cloudError = json.error || json.message;
      }
    } catch (apiErr) {
      if (apiErr instanceof Error && !cloudError) {
        cloudError = apiErr.message;
      }
    }

    // 2. If not succeeded, try Supabase Edge Function
    if (!cloudSucceeded && hasSupabaseConfig()) {
      try {
        const sb = getSupabase();
        const { data, error } = await sb.functions.invoke("owner-reset-cashier-pin", {
          body: { staff_id: staffId, new_pin: cleanPin },
        });
        resJson = data ?? resJson;
        if (!error && (data?.ok || data?.success)) {
          cloudSucceeded = true;
          cloudError = undefined;
        } else if (error) {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const b = (await ctx.json().catch(() => ({}))) as { error?: string };
            if (b?.error) cloudError = b.error;
          }
        }
      } catch (edgeErr) {
        if (edgeErr instanceof Error && !cloudError) {
          cloudError = edgeErr.message;
        }
      }
    }

    let credentialRotated = false;
    if (resJson?.credentialRotated) credentialRotated = true;

    if (!cloudSucceeded && !credentialRotated) {
      throw new Error(cloudError || "Guhindura PIN byanze. Ongera ugerageze.");
    }
    if (!cloudSucceeded && credentialRotated) {
      await db.staff.update(staffId, {
        pin_hash,
        session_revoked_at: now,
        updated_at: now,
      });
      throw new Error(cloudError || "PIN yahinduwe, ariko session ntiyasheshwe. Ongera ugerageze.");
    }
  }

  await db.staff.update(staffId, {
    pin_hash,
    session_revoked_at: now,
    updated_at: now,
  });
}

/** Owner immediately revokes all active sessions for this cashier */
export async function revokeStaffSession(staffId: string): Promise<void> {
  const now = nowIso();
  await db.staff.update(staffId, {
    session_revoked_at: now,
    updated_at: now,
  });

  if (isCloudMode() && hasSupabaseConfig()) {
    try {
      const sb = getSupabase();
      await sb
        .from("shop_staff")
        .update({ session_revoked_at: now, updated_at: now })
        .eq("id", staffId);
    } catch (e) {
      console.warn("Could not revoke staff session in cloud:", e);
    }
  }
}
