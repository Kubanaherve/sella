#!/usr/bin/env node
/**
 * Live two-shop RLS security matrix.
 * Prefer existing demo shops (see SELLA_TESTING_GUIDE.md):
 *   A: 0780000001 / PIN 1111
 *   B: 0780000002 / PIN 2222
 *
 * Usage: node scripts/rls-two-shop-matrix.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Missing Supabase env in .env");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function userClient(accessToken) {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

const results = [];
function record(id, title, expected, passed, detail = "") {
  results.push({
    id,
    title,
    expected,
    result: passed ? "PASS" : "FAIL",
    detail: String(detail).slice(0, 400),
  });
  console.log(
    `${passed ? "PASS" : "FAIL"}  ${id} — ${title}${detail ? ` (${String(detail).slice(0, 120)})` : ""}`
  );
}

async function loginDemo(email, pin, phoneE164) {
  const digits = phoneE164.replace(/\D/g, "");
  const password = `sella_${pin}_${digits.slice(-4)}`;
  const { data, error } = await admin.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Login ${email}: ${error?.message || "no session"}`);
  }
  return data.session.access_token;
}

async function ensureSeed(uc, userId, tag) {
  // Extend write access via service role update (trigger uses auth.uid on user writes)
  const far = new Date(Date.now() + 30 * 86400000).toISOString();
  await admin
    .from("user_subscriptions")
    .update({
      status: "active",
      plan_tier: "monthly",
      trial_ends_at: far,
      current_period_end: far,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  let { data: inv } = await uc
    .from("inventory_items")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!inv) {
    const { data, error } = await uc
      .from("inventory_items")
      .insert({
        user_id: userId,
        item_name: `RLS Product ${tag}`,
        quantity: 10,
        cost_price: 100,
        selling_price: 200,
      })
      .select("*")
      .single();
    if (error) throw new Error(`seed inv ${tag}: ${error.message}`);
    inv = data;
  }

  let { data: client } = await uc
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!client) {
    const { data, error } = await uc
      .from("clients")
      .insert({ user_id: userId, name: `RLS Customer ${tag}`, phone: null })
      .select("*")
      .single();
    if (error) throw new Error(`seed client ${tag}: ${error.message}`);
    client = data;
  }

  let { data: debt } = await uc
    .from("debts")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!debt) {
    const { data, error } = await uc
      .from("debts")
      .insert({
        user_id: userId,
        client_id: client.id,
        total_amount: 500,
        remaining_balance: 500,
        status: "active",
      })
      .select("*")
      .single();
    if (error) throw new Error(`seed debt ${tag}: ${error.message}`);
    debt = data;
  }

  let { data: sale } = await uc
    .from("sales")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!sale) {
    const { data, error } = await uc
      .from("sales")
      .insert({
        user_id: userId,
        client_id: client.id,
        inventory_item_id: inv.id,
        item_name: inv.item_name,
        quantity: 1,
        cost_price: 100,
        sale_price: 200,
        total: 200,
      })
      .select("*")
      .single();
    if (error) throw new Error(`seed sale ${tag}: ${error.message}`);
    sale = data;
  }

  return { inv, client, debt, sale };
}

async function main() {
  console.log("\n=== SELLA live RLS two-shop matrix ===\n");

  const anon = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  {
    const { data, error } = await anon.from("inventory_items").select("id").limit(5);
    const open = Array.isArray(data) && data.length > 0;
    record(
      "P0",
      "Anonymous client cannot list inventory",
      "empty / denied",
      !open,
      open ? `leaked ${data.length}` : error?.message || "empty"
    );
  }

  const shopA = {
    tag: "A",
    email: "demo.a.sella@example.com",
    userId: "91f6c1f2-3806-4d2b-89e5-49ff73cafab6",
    phone: "+250780000001",
    pin: "1111",
  };
  const shopB = {
    tag: "B",
    email: "demo.b.sella@example.com",
    userId: "56bc7a8c-d059-4a25-b425-e1fe0c3ea093",
    phone: "+250780000002",
    pin: "2222",
  };

  shopA.token = await loginDemo(shopA.email, shopA.pin, shopA.phone);
  shopB.token = await loginDemo(shopB.email, shopB.pin, shopB.phone);
  const a = userClient(shopA.token);
  const b = userClient(shopB.token);

  Object.assign(shopA, await ensureSeed(a, shopA.userId, "A"));
  Object.assign(shopB, await ensureSeed(b, shopB.userId, "B"));

  // Own reads
  {
    const { data, error } = await a.from("inventory_items").select("id").eq("id", shopA.inv.id);
    record("A1", "Shop A reads own product", "1 row", !error && data?.length === 1, error?.message);
  }
  {
    const { data, error } = await b.from("inventory_items").select("id").eq("id", shopB.inv.id);
    record("B1", "Shop B reads own product", "1 row", !error && data?.length === 1, error?.message);
  }

  // Cross reads
  for (const [id, title, table, rowId] of [
    ["X1", "Shop A cannot read Shop B product", "inventory_items", shopB.inv.id],
    ["X2", "Shop A cannot read Shop B customer", "clients", shopB.client.id],
    ["X3", "Shop A cannot read Shop B sale", "sales", shopB.sale.id],
    ["X4", "Shop A cannot read Shop B debt", "debts", shopB.debt.id],
  ]) {
    const { data, error } = await a.from(table).select("id").eq("id", rowId);
    record(id, title, "0 rows", !error && (data?.length || 0) === 0, error?.message || `rows=${data?.length ?? 0}`);
  }

  // Cross modify / delete
  {
    const { data, error } = await a
      .from("inventory_items")
      .update({ quantity: 0 })
      .eq("id", shopB.inv.id)
      .select("id");
    record(
      "X5",
      "Shop A cannot modify Shop B product",
      "0 rows",
      !error && (data?.length || 0) === 0,
      error?.message || `updated=${data?.length ?? 0}`
    );
  }
  {
    const before = shopB.sale.id;
    const { data, error } = await a.from("sales").delete().eq("id", before).select("id");
    const { data: still } = await b.from("sales").select("id").eq("id", before);
    record(
      "X6",
      "Shop A cannot delete Shop B sale",
      "0 deleted; B still sees sale",
      !error && (data?.length || 0) === 0 && (still?.length || 0) === 1,
      error?.message || `deleted=${data?.length ?? 0} still=${still?.length ?? 0}`
    );
  }

  // Insert claiming B ownership
  {
    const { data, error } = await a
      .from("clients")
      .insert({ user_id: shopB.userId, name: `HACK ${Date.now()}` })
      .select("id,user_id");
    const leaked = data?.[0]?.user_id === shopB.userId;
    record(
      "X7",
      "Shop A cannot insert client owned by Shop B",
      "error or forced to A",
      !!error || (!!data?.[0] && data[0].user_id === shopA.userId && !leaked),
      error?.message || `user_id=${data?.[0]?.user_id}`
    );
    if (data?.[0]?.id) await a.from("clients").delete().eq("id", data[0].id);
  }

  {
    const { data, error } = await a
      .from("subscription_payments")
      .select("id")
      .neq("user_id", shopA.userId)
      .limit(5);
    record(
      "X8",
      "Shop A cannot list other shops' subscription_payments",
      "0 rows",
      !error && (data?.length || 0) === 0,
      error?.message || `rows=${data?.length ?? 0}`
    );
  }

  // RPC bypass attempt
  {
    const qtyBefore = (
      await b.from("inventory_items").select("quantity").eq("id", shopB.inv.id).single()
    ).data?.quantity;
    const { data, error } = await a.rpc("create_sale_order", {
      p_payload: {
        idempotency_key: `rls_x_${Date.now()}`,
        client_name: "Attacker",
        items: [{ inventory_item_id: shopB.inv.id, quantity: 1, unit_price: 200 }],
        payments: [{ method: "cash", amount: 200 }],
      },
    });
    const qtyAfter = (
      await b.from("inventory_items").select("quantity").eq("id", shopB.inv.id).single()
    ).data?.quantity;
    const denied =
      !!error ||
      data?.error ||
      data?.success === false ||
      /not found|stock|inventory|access|denied|expired/i.test(JSON.stringify(data || {}));
    record(
      "R1",
      "RPC create_sale_order as A cannot sell B inventory",
      "denied + B stock unchanged",
      denied && Number(qtyBefore) === Number(qtyAfter),
      error?.message || `stock ${qtyBefore}→${qtyAfter}; ${JSON.stringify(data).slice(0, 140)}`
    );
  }

  // Storage
  {
    const path = `${shopA.userId}/rls_probe_${Date.now()}.txt`;
    const { error: upErr } = await a.storage
      .from("receipts")
      .upload(path, new Blob(["rls-secret"], { type: "text/plain" }), { upsert: true });
    if (upErr) {
      record("S1", "Shop A upload to own receipts path", "ok or clear policy message", false, upErr.message);
      record("S2", "Shop B cannot download Shop A receipt", "denied", false, "skipped — upload failed");
    } else {
      record("S1", "Shop A upload to own receipts path", "ok", true);
      const { data: dl, error: dlErr } = await b.storage.from("receipts").download(path);
      record(
        "S2",
        "Shop B cannot download Shop A receipt",
        "denied",
        !!dlErr || !dl,
        dlErr?.message || (dl ? "DOWNLOAD SUCCEEDED" : "denied")
      );
      await a.storage.from("receipts").remove([path]).catch(() => {});
    }
  }

  // Superadmin escalation
  {
    await a.from("profiles").update({ is_superadmin: true }).eq("user_id", shopA.userId);
    const { data: prof } = await admin
      .from("profiles")
      .select("is_superadmin")
      .eq("user_id", shopA.userId)
      .maybeSingle();
    record(
      "X9",
      "Shop A cannot self-promote to superadmin",
      "still false",
      prof?.is_superadmin !== true,
      `is_superadmin=${prof?.is_superadmin}`
    );
  }

  // Admin payments route data isolation proxy
  {
    const { data, error } = await a.from("subscription_payments").select("id,user_id").limit(20);
    const foreign = (data || []).filter((r) => r.user_id !== shopA.userId);
    record(
      "X10",
      "Shop A subscription_payments only own rows",
      "no foreign user_id",
      !error && foreign.length === 0,
      error?.message || `own=${data?.length ?? 0} foreign=${foreign.length}`
    );
  }

  const passed = results.filter((r) => r.result === "PASS").length;
  const failed = results.filter((r) => r.result === "FAIL").length;
  const when = new Date().toISOString();
  const project = URL.replace("https://", "").split(".")[0];
  const md = `# SELLA live RLS two-shop matrix

**Ran:** ${when}  
**Project:** \`${project}\`  
**Shops:** Demo Jewel Kigali (A) vs Demo Fashion Remera (B)  
**Rule:** No feature is complete until expected behavior is tested and verified.

## Summary

| PASS | FAIL | Total |
|------|------|-------|
| ${passed} | ${failed} | ${results.length} |

**Overall:** ${failed === 0 ? "✅ PASS" : "❌ FAIL — fix before launch"}

## Results

| ID | Test | Expected | Result | Detail |
|----|------|----------|--------|--------|
${results
  .map(
    (r) =>
      `| ${r.id} | ${r.title} | ${r.expected} | **${r.result}** | ${r.detail.replace(/\|/g, "/")} |`
  )
  .join("\n")}

## How to re-run

\`\`\`bash
node scripts/rls-two-shop-matrix.mjs
\`\`\`

Demo credentials: see \`SELLA_TESTING_GUIDE.md\` (0780000001/1111 and 0780000002/2222).
`;

  mkdirSync(resolve(process.cwd(), "docs/security"), { recursive: true });
  const out = resolve(process.cwd(), "docs/security/RLS_TWO_SHOP_MATRIX.md");
  writeFileSync(out, md);
  console.log(`\nWrote ${out}`);
  console.log(`\nSummary: ${passed} PASS / ${failed} FAIL\n`);
  process.exit(failed === 0 ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
