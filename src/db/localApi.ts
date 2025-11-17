import { db, newId, nowIso } from "./localDb";
import type {
  Client,
  CreateSaleOrderInput,
  CreateSaleOrderResult,
  Debt,
  DebtItem,
  InventoryItem,
  Payment,
  PaymentMethod,
  Profile,
  Sale,
  SalePaymentStatus,
} from "./types";
import { normalizePhoneE164 } from "@/lib/phone";
import { hashPin, verifyPin } from "@/lib/pin";
import { normalizeEmail } from "@/lib/shopIdentity";
import { generateLocalShopCode } from "@/lib/shopCode";
import {
  lineTotal,
  normalizePaymentSlices,
  paymentStatusFromBalances,
  sumRwf,
  toRwf,
  type PaymentSlice,
} from "@/lib/money";
import { calendarDateKeyInKigali, isWithinLastDaysKigali } from "@/lib/dates";

const SESSION_KEY = "sella_session_profile_id";

async function requireProfileId(): Promise<string> {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) throw new Error("Nta session — injira nanone");
  return id;
}

function ownedByProfile<T extends { profile_id?: string }>(row: T, profileId: string) {
  return row.profile_id === profileId;
}

export async function isShopNameAvailableLocal(businessName: string): Promise<boolean> {
  const target = businessName.trim().toLowerCase();
  if (!target) return false;
  const all = await db.profiles.toArray();
  return !all.some((p) => (p.business_name || "").trim().toLowerCase() === target);
}

export async function getSessionProfile(): Promise<Profile | null> {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return (await db.profiles.get(id)) ?? null;
}

export async function setSession(profileId: string | null) {
  if (!profileId) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, profileId);
}

export async function signupLocal(input: {
  phone: string;
  pin: string;
  displayName: string;
  businessName: string;
  email: string;
}): Promise<{ profile: Profile } | { error: string }> {
  const phone_normalized = normalizePhoneE164(input.phone);
  if (!phone_normalized) return { error: "Numero ntiyemewe" };
  if (!/^\d{4}$/.test(input.pin)) {
    return { error: "PIN igomba kuba imibare 4" };
  }
  const businessName = input.businessName.trim();
  if (businessName.length < 2) return { error: "Andika izina ry'ubucuruzi" };
  const email = normalizeEmail(input.email);
  if (!email.includes("@")) return { error: "Andika email neza" };

  if (!(await isShopNameAvailableLocal(businessName))) {
    return { error: "Iri zina ryarafashwe — hitamo irindi" };
  }

  const existing = await db.profiles
    .where("phone_normalized")
    .equals(phone_normalized)
    .first();
  if (existing) return { error: "Iyi numero isanzwe ikoreshwa" };

  const emailTaken = await db.profiles
    .where("email_normalized")
    .equals(email)
    .first();
  if (emailTaken) return { error: "Iyi email isanzwe ikoreshwa" };

  let shop_code = generateLocalShopCode();
  while (await db.profiles.where("shop_code").equals(shop_code).first()) {
    shop_code = generateLocalShopCode();
  }

  const now = nowIso();
  const profile: Profile = {
    id: newId(),
    phone: input.phone.trim(),
    phone_normalized,
    display_name: input.displayName.trim(),
    business_name: businessName,
    email,
    email_normalized: email,
    shop_code,
    pin_hash: await hashPin(input.pin),
    created_at: now,
    updated_at: now,
  };
  await db.profiles.add(profile);
  await setSession(profile.id);
  return { profile };
}

export async function loginLocal(input: {
  phone: string;
  pin: string;
}): Promise<{ profile: Profile } | { error: string }> {
  const phone_normalized = normalizePhoneE164(input.phone);
  const profile = await db.profiles
    .where("phone_normalized")
    .equals(phone_normalized)
    .first();
  if (!profile) return { error: "Numero cyangwa PIN sibyo" };
  if (!(await verifyPin(input.pin, profile.pin_hash))) {
    return { error: "Numero cyangwa PIN sibyo" };
  }
  await setSession(profile.id);
  return { profile };
}

export async function logoutLocal() {
  await setSession(null);
}

export async function verifyProfilePin(profileId: string, pin: string): Promise<boolean> {
  const profile = await db.profiles.get(profileId);
  if (!profile) return false;
  return verifyPin(pin, profile.pin_hash);
}

export async function changePin(profileId: string, oldPin: string, newPin: string) {
  const profile = await db.profiles.get(profileId);
  if (!profile) throw new Error("Profile missing");
  if (!(await verifyPin(oldPin, profile.pin_hash))) {
    throw new Error("PIN ya mbere sibyo");
  }
  if (!/^\d{4}$/.test(newPin)) {
    throw new Error("PIN nshya igomba kuba imibare 4");
  }
  await db.profiles.update(profileId, {
    pin_hash: await hashPin(newPin),
    updated_at: nowIso(),
  });
}

export async function getAppSetting(key: string): Promise<string | null> {
  const profileId = await requireProfileId();
  const row = await db.app_settings
    .where("setting_key")
    .equals(key)
    .filter((r) => ownedByProfile(r, profileId))
    .first();
  return row?.setting_value ?? null;
}

export async function setAppSetting(key: string, value: string) {
  const profileId = await requireProfileId();
  const existing = await db.app_settings
    .where("setting_key")
    .equals(key)
    .filter((r) => ownedByProfile(r, profileId))
    .first();
  if (existing) {
    await db.app_settings.update(existing.id, { setting_value: value });
  } else {
    await db.app_settings.add({
      id: newId(),
      profile_id: profileId,
      setting_key: key,
      setting_value: value,
      created_at: nowIso(),
    });
  }
}

export async function updateClientContact(
  clientId: string,
  patch: { name?: string; phone?: string | null }
) {
  const profileId = await requireProfileId();
  const client = await db.clients.get(clientId);
  if (!client || !ownedByProfile(client, profileId)) {
    throw new Error("Umukiriya ntabwo abonetse");
  }
  const updates: Partial<Client> = { updated_at: nowIso() };
  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.phone !== undefined) {
    updates.phone = patch.phone?.trim() || null;
    updates.phone_normalized = patch.phone ? normalizePhoneE164(patch.phone) : null;
  }
  await db.clients.update(clientId, updates);
}

export async function recordCashSale(input: {
  item_name: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
  inventory_item_id?: string | null;
  payment_method?: PaymentMethod;
  client_id?: string | null;
}): Promise<Sale> {
  if (input.inventory_item_id) {
    const result = await createSaleOrder({
      clientName: "Walk-in",
      paidNow: true,
      amount: input.sale_price * input.quantity,
      paymentMethod: input.payment_method || "cash",
      items: [
        {
          inventory_item_id: input.inventory_item_id,
          item_name: input.item_name,
          quantity: input.quantity,
          unit_price: input.sale_price,
        },
      ],
    });
    return result.sales[0];
  }

  const profileId = await requireProfileId();
  const now = nowIso();
  const sale: Sale = {
    id: newId(),
    profile_id: profileId,
    client_id: input.client_id ?? null,
    item_name: input.item_name.trim(),
    quantity: input.quantity,
    cost_price: input.cost_price,
    sale_price: input.sale_price,
    inventory_item_id: null,
    payment_method: input.payment_method || "cash",
    payment_status: "paid",
    debt_id: null,
    created_at: now,
  };
  await db.sales.add(sale);
  return sale;
}

export async function findOrCreateClient(name: string, phone?: string | null): Promise<Client> {
  const profileId = await requireProfileId();
  const trimmed = name.trim();
  const all = await db.clients
    .filter((c) => ownedByProfile(c, profileId))
    .toArray();
  const existing = all.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    if (phone && !existing.phone) {
      await db.clients.update(existing.id, {
        phone: phone.trim(),
        phone_normalized: normalizePhoneE164(phone),
        updated_at: nowIso(),
      });
      return (await db.clients.get(existing.id))!;
    }
    return existing;
  }
  const now = nowIso();
  const client: Client = {
    id: newId(),
    profile_id: profileId,
    name: trimmed,
    phone: phone?.trim() || null,
    phone_normalized: phone ? normalizePhoneE164(phone) : null,
    address: null,
    notes: null,
    created_at: now,
    updated_at: now,
  };
  await db.clients.add(client);
  return client;
}

export async function listClients(): Promise<Client[]> {
  const profileId = await requireProfileId();
  return db.clients
    .orderBy("created_at")
    .reverse()
    .filter((c) => ownedByProfile(c, profileId))
    .toArray();
}

export async function deleteClient(clientId: string) {
  const profileId = await requireProfileId();
  const client = await db.clients.get(clientId);
  if (!client || !ownedByProfile(client, profileId)) {
    throw new Error("Umukiriya ntabwo abonetse");
  }
  const activeDebts = await db.debts
    .where("client_id")
    .equals(clientId)
    .filter(
      (d) =>
        ownedByProfile(d, profileId) &&
        d.status === "active" &&
        d.remaining_balance > 0
    )
    .count();
  if (activeDebts > 0) {
    throw new Error("Ntushobora gusiba umukiriya ufite ideni");
  }
  await db.clients.delete(clientId);
}

export type ActiveDebtRow = Debt & {
  client_name: string;
  client_phone: string | null;
  items_label: string;
  line_items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    created_at: string;
  }>;
};

export async function listActiveDebts(): Promise<ActiveDebtRow[]> {
  const profileId = await requireProfileId();
  const debts = await db.debts
    .filter(
      (d) =>
        ownedByProfile(d, profileId) &&
        d.status === "active" &&
        d.remaining_balance > 0
    )
    .toArray();
  debts.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const result: ActiveDebtRow[] = [];
  for (const debt of debts) {
    const client = await db.clients.get(debt.client_id);
    const items = await db.debt_items.where("debt_id").equals(debt.id).toArray();
    result.push({
      ...debt,
      client_name: client?.name || "Unknown",
      client_phone: client?.phone || null,
      items_label: items.map((i) => `${i.item_name}: ${i.quantity}`).join(" , "),
      line_items: items.map((i) => ({
        name: i.item_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        created_at: i.created_at || debt.created_at,
      })),
    });
  }
  return result;
}

export async function createSaleOrder(
  input: CreateSaleOrderInput
): Promise<CreateSaleOrderResult> {
  const profileId = await requireProfileId();
  if (!input.items.length) throw new Error("Hitamo ibicuruzwa");

  const merchandise = sumRwf(
    input.items.map((i) => lineTotal(i.unit_price, i.quantity))
  );
  const discount = Math.min(toRwf(input.discountAmount || 0), merchandise);
  const orderTotal = Math.max(0, merchandise - discount);
  if (orderTotal <= 0 && merchandise <= 0) throw new Error("Amafaranga ntayemewe");

  let slices: PaymentSlice[] = (input.payments || []).map((p) => ({
    method: p.method,
    amount: toRwf(p.amount),
    referenceNumber: p.referenceNumber,
  }));
  if ((!slices.length || sumRwf(slices.map((s) => s.amount)) === 0) && input.paidNow) {
    slices = [
      {
        method: input.paymentMethod || "cash",
        amount: orderTotal,
        referenceNumber: input.referenceNumber,
      },
    ];
  }

  const normalized = normalizePaymentSlices(slices, orderTotal);
  if (normalized.remaining > 0 && !String(input.clientName || "").trim()) {
    throw new Error("Izina ry'umukiriya rirakenewe ku ideni");
  }

  const clientName = String(input.clientName || "").trim() || "Walk-in";
  const client = await findOrCreateClient(clientName, input.phone);
  const now = nowIso();
  const paymentStatus: SalePaymentStatus = paymentStatusFromBalances(
    orderTotal,
    normalized.remaining
  );
  const receiptNumber = `R-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
  const primaryMethod = normalized.slices[0]?.method || input.paymentMethod || null;

  for (const item of input.items) {
    const inv = await db.inventory_items.get(item.inventory_item_id);
    if (!inv || !ownedByProfile(inv, profileId) || inv.quantity < item.quantity) {
      throw new Error(`Stock ya ${item.item_name} ntihagije`);
    }
  }

  const debt: Debt = {
    id: newId(),
    profile_id: profileId,
    client_id: client.id,
    total_amount: orderTotal,
    remaining_balance: normalized.remaining,
    due_date: normalized.remaining > 0 ? input.dueDate || null : null,
    status: normalized.remaining <= 0 ? "paid" : "active",
    paid_at: normalized.remaining <= 0 ? now : null,
    notes: null,
    created_at: now,
    updated_at: now,
  };

  const sales: Sale[] = [];
  const paymentsOut: Payment[] = [];

  await db.transaction(
    "rw",
    db.inventory_items,
    db.debts,
    db.debt_items,
    db.payments,
    db.sales,
    async () => {
      for (const item of input.items) {
        const inv = await db.inventory_items.get(item.inventory_item_id);
        if (!inv || !ownedByProfile(inv, profileId) || inv.quantity < item.quantity) {
          throw new Error(`Stock ya ${item.item_name} ntihagije`);
        }
        await db.inventory_items.update(inv.id, {
          quantity: inv.quantity - item.quantity,
          updated_at: now,
        });
      }

      await db.debts.add(debt);

      const debtItems: DebtItem[] = input.items.map((item) => ({
        id: newId(),
        profile_id: profileId,
        debt_id: debt.id,
        inventory_item_id: item.inventory_item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: toRwf(item.unit_price),
        created_at: now,
      }));
      await db.debt_items.bulkAdd(debtItems);

      for (const item of input.items) {
        const inv = await db.inventory_items.get(item.inventory_item_id);
        const sale: Sale = {
          id: newId(),
          profile_id: profileId,
          client_id: client.id,
          item_name: item.item_name,
          quantity: item.quantity,
          cost_price: toRwf(inv?.cost_price ?? 0),
          sale_price: toRwf(item.unit_price),
          inventory_item_id: item.inventory_item_id,
          payment_method: primaryMethod,
          payment_status: paymentStatus,
          debt_id: debt.id,
          created_at: now,
        };
        await db.sales.add(sale);
        sales.push(sale);
      }

      for (let idx = 0; idx < normalized.slices.length; idx++) {
        const s = normalized.slices[idx];
        const payment: Payment = {
          id: newId(),
          profile_id: profileId,
          debt_id: debt.id,
          client_id: client.id,
          amount: s.amount,
          payment_method: s.method,
          reference_number: s.referenceNumber || null,
          notes:
            idx === 0 && normalized.slices.length > 1
              ? "Split payment at sale"
              : normalized.remaining > 0
                ? "Partial payment at sale"
                : "Payment at sale",
          created_at: now,
        };
        await db.payments.add(payment);
        paymentsOut.push(payment);
      }
    }
  );

  return {
    debt,
    sales,
    payments: paymentsOut,
    payment: paymentsOut[0] || null,
    paid: normalized.paid,
    remaining: normalized.remaining,
    changeDue: normalized.changeDue,
    receiptNumber,
  };
}

/** @deprecated use createSaleOrder */
export async function createDebt(input: {
  clientName: string;
  phone?: string;
  dueDate?: string;
  isPaid: boolean;
  amount: number;
  paymentMethod?: PaymentMethod;
  items: Array<{
    inventory_item_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
  }>;
}): Promise<Debt> {
  const result = await createSaleOrder({
    clientName: input.clientName,
    phone: input.phone,
    dueDate: input.dueDate,
    paidNow: input.isPaid,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    items: input.items,
  });
  return result.debt;
}

export async function recordPayment(input: {
  debtId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  referenceNumber?: string | null;
}): Promise<Payment> {
  const profileId = await requireProfileId();
  const debt = await db.debts.get(input.debtId);
  if (!debt || !ownedByProfile(debt, profileId)) throw new Error("Ideni ntiribonetse");
  if (input.amount <= 0) throw new Error("Amafaranga ntayemewe");
  if (input.amount > debt.remaining_balance) {
    throw new Error("Amafaranga arenza ideni");
  }

  const now = nowIso();
  const remaining = debt.remaining_balance - input.amount;
  const saleStatus: SalePaymentStatus = remaining <= 0 ? "paid" : "partial";

  const payment: Payment = {
    id: newId(),
    profile_id: profileId,
    debt_id: debt.id,
    client_id: debt.client_id,
    amount: input.amount,
    payment_method: input.paymentMethod,
    reference_number: input.referenceNumber?.trim() || null,
    notes: input.notes || null,
    created_at: now,
  };

  await db.transaction("rw", db.payments, db.debts, db.sales, async () => {
    const fresh = await db.debts.get(input.debtId);
    if (!fresh || !ownedByProfile(fresh, profileId)) {
      throw new Error("Ideni ntiribonetse");
    }
    if (input.amount > fresh.remaining_balance) {
      throw new Error("Amafaranga arenza ideni");
    }
    const rem = fresh.remaining_balance - input.amount;
    await db.payments.add(payment);
    await db.debts.update(fresh.id, {
      remaining_balance: rem,
      status: rem <= 0 ? "paid" : "active",
      paid_at: rem <= 0 ? now : fresh.paid_at,
      updated_at: now,
    });
    const linked = await db.sales.filter((s) => s.debt_id === fresh.id).toArray();
    for (const sale of linked) {
      await db.sales.update(sale.id, {
        payment_status: rem <= 0 ? "paid" : saleStatus,
        payment_method: input.paymentMethod,
      });
    }
  });

  return payment;
}

export async function listRecentSales(limit = 40): Promise<
  Array<Sale & { client_name: string | null }>
> {
  const profileId = await requireProfileId();
  const rows = await db.sales
    .orderBy("created_at")
    .reverse()
    .filter((s) => ownedByProfile(s, profileId))
    .limit(limit)
    .toArray();
  const out = [];
  for (const sale of rows) {
    const client = sale.client_id ? await db.clients.get(sale.client_id) : null;
    out.push({
      ...sale,
      payment_status: sale.payment_status || "paid",
      debt_id: sale.debt_id ?? null,
      client_name: client?.name || null,
    });
  }
  return out;
}

export async function deleteDebt(debtId: string) {
  const profileId = await requireProfileId();
  const debt = await db.debts.get(debtId);
  if (!debt || !ownedByProfile(debt, profileId)) {
    throw new Error("Ideni ntiribonetse");
  }
  const items = await db.debt_items.where("debt_id").equals(debtId).toArray();
  const now = nowIso();
  await db.transaction(
    "rw",
    db.inventory_items,
    db.debt_items,
    db.payments,
    db.sales,
    db.debts,
    async () => {
      for (const item of items) {
        if (item.inventory_item_id) {
          const inv = await db.inventory_items.get(item.inventory_item_id);
          if (inv && ownedByProfile(inv, profileId)) {
            await db.inventory_items.update(inv.id, {
              quantity: inv.quantity + item.quantity,
              updated_at: now,
            });
          }
        }
      }
      await db.debt_items.where("debt_id").equals(debtId).delete();
      await db.payments.where("debt_id").equals(debtId).delete();
      await db.sales.filter((s) => s.debt_id === debtId).delete();
      await db.debts.delete(debtId);
    }
  );
}

export async function listInventory(): Promise<InventoryItem[]> {
  const profileId = await requireProfileId();
  return db.inventory_items
    .orderBy("created_at")
    .reverse()
    .filter((i) => ownedByProfile(i, profileId))
    .toArray();
}

export async function addInventoryItem(
  input: import("./types").InventoryWriteInput
): Promise<InventoryItem> {
  const profileId = await requireProfileId();
  const now = nowIso();
  const item: InventoryItem = {
    id: newId(),
    profile_id: profileId,
    item_name: input.item_name.trim(),
    quantity: input.quantity,
    selling_price: input.selling_price,
    cost_price: input.cost_price,
    date_bought: input.date_bought || calendarDateKeyInKigali(now),
    notes: input.notes ?? null,
    category: input.category ?? null,
    image_url: input.image_url ?? null,
    sku: input.sku?.trim() || null,
    barcode: input.barcode?.trim() || null,
    unit: input.unit ?? "pcs",
    brand: input.brand ?? null,
    supplier: input.supplier ?? null,
    min_quantity: input.min_quantity ?? null,
    description: input.description ?? null,
    created_at: now,
    updated_at: now,
  };
  await db.inventory_items.add(item);
  return item;
}

export async function updateInventoryItem(
  id: string,
  patch: import("./types").InventoryUpdatePatch
) {
  const profileId = await requireProfileId();
  const inv = await db.inventory_items.get(id);
  if (!inv || !ownedByProfile(inv, profileId)) {
    throw new Error("Igicuruzwa ntabwo kibonetse");
  }
  await db.inventory_items.update(id, { ...patch, updated_at: nowIso() });
}

/** Find existing item by SKU, barcode, or exact name (case-insensitive). */
export async function findInventoryMatch(opts: {
  sku?: string | null;
  barcode?: string | null;
  item_name?: string | null;
}): Promise<InventoryItem | null> {
  const profileId = await requireProfileId();
  const all = await db.inventory_items
    .filter((i) => ownedByProfile(i, profileId))
    .toArray();
  const sku = opts.sku?.trim().toLowerCase();
  const barcode = opts.barcode?.trim().toLowerCase();
  const name = opts.item_name?.trim().toLowerCase();
  if (sku) {
    const bySku = all.find((i) => (i.sku || "").trim().toLowerCase() === sku);
    if (bySku) return bySku;
  }
  if (barcode) {
    const byBar = all.find(
      (i) => (i.barcode || "").trim().toLowerCase() === barcode
    );
    if (byBar) return byBar;
  }
  if (name) {
    const byName = all.find((i) => i.item_name.trim().toLowerCase() === name);
    if (byName) return byName;
  }
  return null;
}

export async function deleteInventoryItem(id: string) {
  const profileId = await requireProfileId();
  const inv = await db.inventory_items.get(id);
  if (!inv || !ownedByProfile(inv, profileId)) {
    throw new Error("Igicuruzwa ntabwo kibonetse");
  }
  await db.inventory_items.delete(id);
}

export async function getDashboardStats() {
  const profileId = await requireProfileId();
  const [debts, clients, sales, inventory, payments] = await Promise.all([
    db.debts.filter((d) => ownedByProfile(d, profileId)).toArray(),
    db.clients.filter((c) => ownedByProfile(c, profileId)).toArray(),
    db.sales.filter((s) => ownedByProfile(s, profileId)).toArray(),
    db.inventory_items.filter((i) => ownedByProfile(i, profileId)).toArray(),
    db.payments.filter((p) => ownedByProfile(p, profileId)).toArray(),
  ]);

  const todayKey = calendarDateKeyInKigali();
  const inWeek = (iso: string) => isWithinLastDaysKigali(iso, 7);

  const totalUnpaid = debts
    .filter((d) => d.status === "active")
    .reduce((s, d) => s + d.remaining_balance, 0);

  const salesVolume = sales.reduce((s, row) => s + lineTotal(row.sale_price, row.quantity), 0);
  const moneyCollected = payments.reduce((s, p) => s + toRwf(p.amount), 0);
  const todayCollected = payments
    .filter((p) => calendarDateKeyInKigali(p.created_at) === todayKey)
    .reduce((sum, p) => sum + toRwf(p.amount), 0);
  const todaySalesVolume = sales
    .filter((s) => calendarDateKeyInKigali(s.created_at) === todayKey)
    .reduce((sum, row) => sum + lineTotal(row.sale_price, row.quantity), 0);
  const weekCollected = payments
    .filter((p) => inWeek(p.created_at))
    .reduce((sum, p) => sum + toRwf(p.amount), 0);
  const weekSalesVolume = sales
    .filter((s) => inWeek(s.created_at))
    .reduce((sum, row) => sum + lineTotal(row.sale_price, row.quantity), 0);

  const todayDebt = debts
    .filter(
      (d) =>
        calendarDateKeyInKigali(d.created_at) === todayKey && d.status === "active"
    )
    .reduce((s, d) => s + toRwf(d.remaining_balance), 0);
  const weekDebt = debts
    .filter((d) => inWeek(d.created_at) && d.status === "active")
    .reduce((s, d) => s + toRwf(d.remaining_balance), 0);

  const inventoryValue = inventory.reduce(
    (s, i) => s + lineTotal(i.selling_price, i.quantity),
    0
  );

  const goalSetting = await db.app_settings
    .where("setting_key")
    .equals("sales_goal")
    .filter((r) => ownedByProfile(r, profileId))
    .first();
  const salesGoal = toRwf(goalSetting?.setting_value || inventoryValue || 0);

  return {
    totalUnpaid: toRwf(totalUnpaid),
    totalCustomers: clients.length,
    totalSales: moneyCollected,
    salesVolume,
    moneyCollected,
    todaySales: todayCollected,
    todaySalesVolume,
    todayCollected,
    todayDebt,
    weekCollected,
    weekSalesVolume,
    weekDebt,
    targetMoney: salesGoal,
    inventoryValue,
  };
}

export type DailyReport = {
  date: string;
  cashSales: number;
  debtsCollected: number;
  newDebtIssued: number;
  unpaidOutstanding: number;
  receivedTotal: number;
  accrualNewBusiness: number;
};

/** Blueprint-correct reporting: cash received vs accrual, no inter-day inversion. */
export async function getDailyReports(): Promise<DailyReport[]> {
  const profileId = await requireProfileId();
  const [sales, payments, debts] = await Promise.all([
    db.sales.filter((s) => ownedByProfile(s, profileId)).toArray(),
    db.payments.filter((p) => ownedByProfile(p, profileId)).toArray(),
    db.debts.filter((d) => ownedByProfile(d, profileId)).toArray(),
  ]);

  const map: Record<string, DailyReport> = {};
  const ensure = (date: string) => {
    if (!map[date]) {
      map[date] = {
        date,
        cashSales: 0,
        debtsCollected: 0,
        newDebtIssued: 0,
        unpaidOutstanding: 0,
        receivedTotal: 0,
        accrualNewBusiness: 0,
      };
    }
    return map[date];
  };

  for (const sale of sales) {
    const d = ensure(calendarDateKeyInKigali(sale.created_at));
    const amount = lineTotal(sale.sale_price, sale.quantity);
    d.cashSales += amount;
    d.accrualNewBusiness += amount;
  }

  for (const payment of payments) {
    const d = ensure(calendarDateKeyInKigali(payment.created_at));
    const amt = toRwf(payment.amount);
    d.debtsCollected += amt;
    d.receivedTotal += amt;
  }

  for (const debt of debts) {
    const d = ensure(calendarDateKeyInKigali(debt.created_at));
    d.newDebtIssued += toRwf(debt.total_amount);
    if (debt.status === "active") {
      d.unpaidOutstanding += toRwf(debt.remaining_balance);
    }
  }

  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
}

export async function resetSalesMoney() {
  const profileId = await requireProfileId();
  await db.transaction("rw", db.sales, db.payments, async () => {
    await db.sales.filter((s) => ownedByProfile(s, profileId)).delete();
    await db.payments.filter((p) => ownedByProfile(p, profileId)).delete();
  });
}

export async function factoryResetKeepClients() {
  const profileId = await requireProfileId();
  await db.transaction(
    "rw",
    db.sales,
    db.payments,
    db.debt_items,
    db.debts,
    async () => {
      await db.sales.filter((s) => ownedByProfile(s, profileId)).delete();
      await db.payments.filter((p) => ownedByProfile(p, profileId)).delete();
      await db.debt_items.filter((i) => ownedByProfile(i, profileId)).delete();
      await db.debts.filter((d) => ownedByProfile(d, profileId)).delete();
    }
  );
}

export async function wipeAllBusinessData() {
  const profileId = await requireProfileId();
  await db.transaction(
    "rw",
    db.sales,
    db.payments,
    db.debt_items,
    db.debts,
    db.clients,
    db.inventory_items,
    db.app_settings,
    async () => {
      await db.sales.filter((s) => ownedByProfile(s, profileId)).delete();
      await db.payments.filter((p) => ownedByProfile(p, profileId)).delete();
      await db.debt_items.filter((i) => ownedByProfile(i, profileId)).delete();
      await db.debts.filter((d) => ownedByProfile(d, profileId)).delete();
      await db.clients.filter((c) => ownedByProfile(c, profileId)).delete();
      await db.inventory_items.filter((i) => ownedByProfile(i, profileId)).delete();
      await db.app_settings.filter((s) => ownedByProfile(s, profileId)).delete();
    }
  );
}

export async function getOwnerPhone(): Promise<string | null> {
  return getAppSetting("owner_phone");
}

export async function setOwnerPhone(phone: string) {
  await setAppSetting("owner_phone", phone);
}
