#!/usr/bin/env node
/**
 * Live staging test. Refuses the production project.
 * Service role is used only to create fixture auth users and subscriptions.
 * Shop data, sales, and PIN flows use owner and cashier tokens.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";

const PRODUCTION_REF = "ixihbqubatyfulnurpco";
const STAGING_REF = "nyfwfdpmuwlhzjachdyh";

function loadEnv(name) {
  const env = {};
  const raw = readFileSync(resolve(process.cwd(), name), "utf8");
  for (const line of raw.split("\n")) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv(".env.staging");
const URL = env.VITE_SUPABASE_URL || "";
const ANON = env.VITE_SUPABASE_ANON_KEY || "";
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!URL.includes(STAGING_REF) || URL.includes(PRODUCTION_REF) || !ANON || !SERVICE) {
  console.error("Refusing to run: staging URL was not confirmed.");
  process.exit(1);
}

function serviceClient() {
  return createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
}
function anonClient() {
  return createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
}
const admin = serviceClient();
const results = [];
function record(id, title, passed, detail = "") {
  results.push({ id, title, result: passed ? "PASS" : "FAIL" });
  const text = detail ? ` (${String(detail).replace(/\s+/g, " ").slice(0, 180)})` : "";
  console.log(`${passed ? "PASS" : "FAIL"}  ${id} — ${title}${text}`);
}

function userClient(token) {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function fn(name, body, token) {
  const res = await fetch(`${URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token || ANON}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function ensureOwner(email, password, shopCode, business) {
  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = (existing.data?.users || []).find((user) => user.email === email);
  if (found) await admin.auth.admin.deleteUser(found.id);
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: business },
  });
  if (created.error || !created.data.user) throw new Error(created.error?.message || "owner create failed");
  const signed = await anonClient().auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) throw new Error(signed.error?.message || "owner login failed");
  const token = signed.data.session.access_token;
  const client = userClient(token);
  const far = new Date(Date.now() + 30 * 86400000).toISOString();
  const profile = await client
    .from("profiles")
    .update({
      business_name: business,
      owner_name: business,
      shop_code: shopCode,
      phone: "+250788000000",
      phone_normalized: "+250788000000",
    })
    .eq("user_id", created.data.user.id)
    .select("user_id, shop_code")
    .maybeSingle();
  if (profile.error || !profile.data) {
    throw new Error(profile.error?.message || "owner profile missing");
  }
  const sub = await admin
    .from("user_subscriptions")
    .update({
      status: "active",
      plan_tier: "monthly",
      current_period_end: far,
      trial_ends_at: far,
    })
    .eq("user_id", created.data.user.id);
  if (sub.error) throw new Error(sub.error.message);
  return { id: created.data.user.id, token, client, refresh: signed.data.session.refresh_token };
}

const createdIds = [];

try {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  for (const user of listed.data?.users || []) {
    const email = user.email || "";
    if (email.startsWith("staging-owner-") || email.includes("selstaga") || email.includes("selstagb")) {
      await admin.auth.admin.deleteUser(user.id);
    }
  }
  const passwordA = `StageA-${randomUUID()}`;
  const passwordB = `StageB-${randomUUID()}`;
  const ownerA = await ensureOwner("staging-owner-a@sella.test", passwordA, "SEL-STAGA", "Staging Shop A");
  const ownerB = await ensureOwner("staging-owner-b@sella.test", passwordB, "SEL-STAGB", "Staging Shop B");
  createdIds.push(ownerA.id, ownerB.id);

  const staffA = await ownerA.client
    .from("shop_staff")
    .insert({
      shop_code: "SEL-STAGA",
      owner_id: ownerA.id,
      name: "Cashier A",
      phone: "0788100001",
      phone_normalized: "+250788100001",
      role: "cashier",
      status: "active",
    })
    .select("id")
    .single();
  const staffB = await ownerB.client
    .from("shop_staff")
    .insert({
      shop_code: "SEL-STAGB",
      owner_id: ownerB.id,
      name: "Cashier B",
      phone: "0788100002",
      phone_normalized: "+250788100002",
      role: "cashier",
      status: "active",
    })
    .select("id")
    .single();
  record("1", "Owner creates cashier", !staffA.error && !staffB.error, staffA.error?.message || staffB.error?.message || "");
  if (staffA.error || staffB.error) throw new Error("staff insert failed");

  const itemA = await ownerA.client
    .from("inventory_items")
    .insert({
      user_id: ownerA.id,
      item_name: "Staging ring",
      quantity: 10,
      cost_price: 2000,
      selling_price: 5000,
    })
    .select("id, quantity, selling_price")
    .single();
  const itemB = await ownerB.client
    .from("inventory_items")
    .insert({
      user_id: ownerB.id,
      item_name: "Staging chain",
      quantity: 4,
      cost_price: 1000,
      selling_price: 3000,
    })
    .select("id")
    .single();
  if (itemA.error || itemB.error) throw new Error(itemA.error?.message || itemB.error?.message || "inventory");

  const join = await fn("cashier-join-and-set-pin", {
    shop_code: "SEL-STAGA",
    phone: "0788100001",
    name: "Cashier A",
    pin: "2468",
  });
  record("2-3", "Cashier joins assigned shop and sets initial PIN", join.status === 200 && join.json.success === true, join.json.error || `status ${join.status}`);
  if (!join.json.access_token) throw new Error("join did not return a session");
  createdIds.push(join.json.staff?.id);

  const login = await fn("cashier-pin-login", {
    shop_code: "SEL-STAGA",
    phone: "0788100001",
    pin: "2468",
  });
  record("4", "Cashier logs in", login.status === 200 && !!login.json.access_token, login.json.error || `status ${login.status}`);
  const cashierToken = login.json.access_token || join.json.access_token;
  const oldRefresh = login.json.refresh_token || join.json.refresh_token;
  const cashier = userClient(cashierToken);

  const stockRead = await cashier.from("inventory_items").select("id, item_name, quantity, selling_price");
  const seesOwn = (stockRead.data || []).some((row) => row.id === itemA.data.id);
  const seesOther = (stockRead.data || []).some((row) => row.item_name === "Staging chain");
  record("5", "Cashier reads assigned inventory", !stockRead.error && seesOwn && !seesOther, stockRead.error?.message || "");

  const sale = await cashier.rpc("create_sale_order", {
    p_payload: {
      idempotency_key: randomUUID(),
      client_name: "Client A",
      discount_amount: 4000,
      payments: [{ method: "cash", amount: 1000 }],
      items: [{ inventory_item_id: itemA.data.id, quantity: 1, unit_price: 1 }],
    },
  });
  record("6", "Cashier creates a sale", !sale.error, sale.error?.message || "");

  const after = await cashier.from("inventory_items").select("quantity").eq("id", itemA.data.id).single();
  record("7", "Inventory decreases once", Number(after.data?.quantity) === 9, `quantity ${after.data?.quantity}`);

  const debtId = sale.data?.debt_id || sale.data?.debt?.id;
  const lines = await ownerA.client.from("debt_items").select("unit_price").eq("inventory_item_id", itemA.data.id);
  const sales = await ownerA.client.from("sales").select("sale_price, cashier_user_id, user_id").eq("inventory_item_id", itemA.data.id);
  const debts = await ownerA.client.from("debts").select("discount_amount").eq("user_id", ownerA.id);
  const priced = (lines.data || []).length > 0 && (lines.data || []).every((row) => Number(row.unit_price) === 5000);
  const soldAtList = (sales.data || []).every((row) => Number(row.sale_price) === 5000);
  const noDiscount = (debts.data || []).length > 0 && (debts.data || []).every((row) => Number(row.discount_amount) === 0);
  const stamped = (sales.data || []).some((row) => row.cashier_user_id && row.user_id === ownerA.id);
  record(
    "9",
    "Server keeps selling price and rejects cashier discount",
    priced && soldAtList && noDiscount && stamped,
    sales.error?.message || debts.error?.message || `price ${lines.data?.[0]?.unit_price} sale ${sales.data?.[0]?.sale_price} discount ${debts.data?.[0]?.discount_amount}`
  );

  let paymentOk = false;
  let paymentDetail = "no debt id";
  if (debtId) {
    const payment = await cashier.rpc("record_payment", {
      p_payload: {
        idempotency_key: randomUUID(),
        debt_id: debtId,
        amount: 1500,
        payment_method: "cash",
      },
    });
    paymentOk = !payment.error;
    paymentDetail = payment.error?.message || "";
  }
  record("8", "Cashier records a payment", paymentOk, paymentDetail);

  const foreign = await cashier.from("inventory_items").select("id").eq("user_id", ownerB.id);
  const foreignStaff = await cashier.from("shop_staff").select("id").eq("owner_id", ownerB.id);
  const foreignSales = await cashier.from("sales").select("id").eq("user_id", ownerB.id);
  record(
    "10",
    "Cashier cannot access the other shop",
    (foreign.data || []).length === 0 && (foreignStaff.data || []).length === 0 && (foreignSales.data || []).length === 0,
    foreign.error?.message || ""
  );

  const reset = await fn(
    "owner-reset-cashier-pin",
    { staff_id: staffA.data.id, new_pin: "1357" },
    ownerA.token
  );
  record("11", "Owner resets cashier PIN", reset.status === 200 && reset.json.ok === true, reset.json.error || `status ${reset.status}`);

  const oldPin = await fn("cashier-pin-login", { shop_code: "SEL-STAGA", phone: "0788100001", pin: "2468" });
  record("12", "Old PIN is rejected", oldPin.status >= 400 || oldPin.json.ok === false || !oldPin.json.access_token, oldPin.json.error || `status ${oldPin.status}`);

  const newPin = await fn("cashier-pin-login", { shop_code: "SEL-STAGA", phone: "0788100001", pin: "1357" });
  record("13", "New PIN succeeds", newPin.status === 200 && !!newPin.json.access_token, newPin.json.error || `status ${newPin.status}`);

  const refreshClient = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const refreshed = await refreshClient.auth.refreshSession({ refresh_token: oldRefresh });
  record("14", "Previous refresh token is rejected", !!refreshed.error || !refreshed.data.session, refreshed.error?.message || "session returned");

  const oldAccess = userClient(cashierToken);
  const oldRead = await oldAccess.from("inventory_items").select("id");
  const oldSale = await oldAccess.rpc("create_sale_order", {
    p_payload: {
      idempotency_key: randomUUID(),
      client_name: "Should fail",
      payments: [{ method: "cash", amount: 5000 }],
      items: [{ inventory_item_id: itemA.data.id, quantity: 1, unit_price: 5000 }],
    },
  });
  record(
    "15",
    "Previous access token cannot use protected shop data",
    (oldRead.data || []).length === 0 && !!oldSale.error,
    oldSale.error?.message || `rows ${oldRead.data?.length || 0}`
  );

  const deactivated = await ownerA.client
    .from("shop_staff")
    .update({ status: "deactivated" })
    .eq("id", staffA.data.id)
    .select("status")
    .single();
  const blocked = await fn("cashier-pin-login", { shop_code: "SEL-STAGA", phone: "0788100001", pin: "1357" });
  record(
    "16",
    "Deactivated cashier cannot log in",
    deactivated.data?.status === "deactivated" && (blocked.status >= 400 || !blocked.json.access_token),
    blocked.json.error || deactivated.error?.message || ""
  );

  const ownerStill = await ownerA.client.from("inventory_items").select("id, quantity").eq("id", itemA.data.id).single();
  record("17", "Owner can still access the shop", !ownerStill.error && ownerStill.data?.id === itemA.data.id, ownerStill.error?.message || "");

  const past = new Date(Date.now() - 10 * 86400000).toISOString();
  const expired = await serviceClient()
    .from("user_subscriptions")
    .update({ status: "expired", current_period_end: past, trial_ends_at: past })
    .eq("user_id", ownerA.id)
    .select("status, current_period_end");
  if (expired.error || expired.data?.[0]?.status !== "expired") {
    throw new Error(expired.error?.message || "subscription was not expired");
  }
  const blockedSale = await ownerA.client.rpc("create_sale_order", {
    p_payload: {
      idempotency_key: randomUUID(),
      client_name: "Expired",
      payments: [{ method: "cash", amount: 5000 }],
      items: [{ inventory_item_id: itemA.data.id, quantity: 1, unit_price: 5000 }],
    },
  });
  record("18", "Expired subscription blocks financial writes", !!blockedSale.error, blockedSale.error?.message || "sale succeeded");

  const qtyNow = await ownerA.client.from("inventory_items").select("quantity").eq("id", itemA.data.id).single();
  record("7b", "Expired write did not decrement stock again", Number(qtyNow.data?.quantity) === 9, `quantity ${qtyNow.data?.quantity}`);
} catch (error) {
  record("fatal", "Staging run stopped", false, error instanceof Error ? error.message : String(error));
} finally {
  for (const id of createdIds.filter(Boolean)) {
    await admin.auth.admin.deleteUser(id);
  }
  const failed = results.filter((row) => row.result === "FAIL").length;
  console.log(`RESULT ${results.length - failed} PASS / ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
}
