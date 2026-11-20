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
import { normalizeBusinessCategory } from "@/lib/businessCategories";
import { isCashierModeActive } from "@/lib/cashierMode";
import { assertDebtDeleteAllowed, CASHIER_DELETE_ERROR } from "@/lib/debtDeletion";
import {
  normalizePaymentReference,
  paymentReferenceConflict,
  referenceConflictMessage,
} from "@/lib/paymentRef";
import {
  assertPaymentMethod,
  extendTotal,
  lineTotal,
  normalizePaymentSlices,
  paymentStatusFromBalances,
  saleQuantity,
  stockQuantity,
  sumRwf,
  toRwf,
  type PaymentSlice,
} from "@/lib/money";
import { calendarDateKeyInKigali, isWithinLastDaysKigali, resolveSoldAt } from "@/lib/dates";
import { buildLedgerDailyReports, netSalesVolume } from "@/lib/reporting";

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
  businessCategory?: string | null;
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
    business_category: normalizeBusinessCategory(input.businessCategory),
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

async function assertOwnerPin(pin: string): Promise<void> {
  const profile = await getSessionProfile();
  if (!profile || !(await verifyProfilePin(profile.id, pin.trim()))) {
    throw new Error("PIN y'umuyobozi sibyo");
  }
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
  soldAt?: string | null;
}): Promise<Sale> {
  const quantity = saleQuantity(input.quantity);
  const salePrice = toRwf(input.sale_price);
  const costPrice = Math.max(0, toRwf(input.cost_price));
  if (salePrice <= 0) throw new Error("Amafaranga ntayemewe");
  const method = assertPaymentMethod(input.payment_method || "cash");
  const soldAt = input.soldAt ? resolveSoldAt(input.soldAt) : nowIso();

  if (input.inventory_item_id) {
    const result = await createSaleOrder({
      clientName: "Walk-in",
      paidNow: true,
      amount: lineTotal(salePrice, quantity),
      paymentMethod: method,
      ...(input.soldAt ? { soldAt } : {}),
      items: [
        {
          inventory_item_id: input.inventory_item_id,
          item_name: input.item_name,
          quantity,
          unit_price: salePrice,
        },
      ],
    });
    return result.sales[0];
  }

  const profileId = await requireProfileId();
  const client = input.client_id
    ? await db.clients.get(input.client_id)
    : await findOrCreateClient("Walk-in");
  const clientId = client?.id;
  if (!clientId) throw new Error("Umukiriya ntabwo abonetse");
  const amount = lineTotal(salePrice, quantity);
  const sale: Sale = {
    id: newId(),
    profile_id: profileId,
    client_id: clientId,
    item_name: input.item_name.trim(),
    quantity,
    cost_price: costPrice,
    sale_price: salePrice,
    inventory_item_id: null,
    payment_method: method,
    payment_status: "paid",
    debt_id: null,
    created_at: soldAt,
  };
  const payment: Payment = {
    id: newId(),
    profile_id: profileId,
    debt_id: null,
    client_id: clientId,
    amount,
    payment_method: method,
    reference_number: null,
    notes: "Cash sale",
    created_at: soldAt,
  };
  await db.transaction("rw", db.sales, db.payments, async () => {
    await db.sales.add(sale);
    await db.payments.add(payment);
  });
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
  if (!debts.length) return [];

  const clients = await db.clients.bulkGet(debts.map((d) => d.client_id));
  const clientById = new Map(
    clients.filter((c): c is NonNullable<typeof c> => !!c).map((c) => [c.id, c])
  );
  const items = await db.debt_items
    .where("debt_id")
    .anyOf(debts.map((d) => d.id))
    .toArray();
  const itemsByDebt = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsByDebt.get(item.debt_id) || [];
    list.push(item);
    itemsByDebt.set(item.debt_id, list);
  }

  return debts.map((debt) => {
    const client = clientById.get(debt.client_id);
    const lineSource = itemsByDebt.get(debt.id) || [];
    const line_items = lineSource.map((i) => ({
      name: i.item_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      created_at: i.created_at || debt.created_at,
    }));
    return {
      ...debt,
      client_name: client?.name || "Unknown",
      client_phone: client?.phone || null,
      items_label: line_items.map((i) => `${i.name}: ${i.quantity}`).join(" , "),
      line_items,
    };
  });
}

export async function listDebtsForReport(): Promise<
  Array<ActiveDebtRow & { payment_amounts: number[] }>
> {
  const profileId = await requireProfileId();
  const debts = (await db.debts.filter((d) => ownedByProfile(d, profileId)).toArray()).sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
  if (!debts.length) return [];
  const clients = await db.clients.bulkGet(debts.map((d) => d.client_id));
  const clientById = new Map(
    clients.filter((c): c is NonNullable<typeof c> => !!c).map((c) => [c.id, c])
  );
  const items = await db.debt_items.where("debt_id").anyOf(debts.map((d) => d.id)).toArray();
  const payments = await db.payments.filter((payment) => debts.some((debt) => debt.id === payment.debt_id)).toArray();
  const itemsByDebt = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsByDebt.get(item.debt_id) || [];
    list.push(item);
    itemsByDebt.set(item.debt_id, list);
  }
  const paymentsByDebt = new Map<string, number[]>();
  for (const payment of payments) {
    if (!payment.debt_id) continue;
    const list = paymentsByDebt.get(payment.debt_id) || [];
    list.push(payment.amount);
    paymentsByDebt.set(payment.debt_id, list);
  }
  return debts.map((debt) => {
    const client = clientById.get(debt.client_id);
    const line_items = (itemsByDebt.get(debt.id) || []).map((i) => ({
      name: i.item_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      created_at: i.created_at || debt.created_at,
    }));
    return {
      ...debt,
      client_name: client?.name || "Unknown",
      client_phone: client?.phone || null,
      items_label: line_items.map((i) => `${i.name}: ${i.quantity}`).join(" , "),
      line_items,
      payment_amounts: paymentsByDebt.get(debt.id) || [],
    };
  });
}

export async function createSaleOrder(
  input: CreateSaleOrderInput
): Promise<CreateSaleOrderResult> {
  const profileId = await requireProfileId();
  if (!input.items.length) throw new Error("Hitamo ibicuruzwa");

  const normalizedItems = input.items.map((item) => ({
    ...item,
    quantity: saleQuantity(item.quantity),
    unit_price: Math.max(0, toRwf(item.unit_price)),
  }));

  const merchandise = sumRwf(
    normalizedItems.map((i) => lineTotal(i.unit_price, i.quantity))
  );
  const discount = Math.min(toRwf(input.discountAmount || 0), merchandise);
  const orderTotal = Math.max(0, merchandise - discount);
  if (orderTotal <= 0 && merchandise <= 0) throw new Error("Amafaranga ntayemewe");

  let slices: PaymentSlice[] = (input.payments || []).map((p) => ({
    method: assertPaymentMethod(p.method),
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
  const now = input.soldAt ? resolveSoldAt(input.soldAt) : nowIso();
  const paymentStatus: SalePaymentStatus = paymentStatusFromBalances(
    orderTotal,
    normalized.remaining
  );
  const receiptNumber = `R-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
  const primaryMethod =
    normalized.slices[0]?.method ||
    (input.paymentMethod ? assertPaymentMethod(input.paymentMethod) : null);

  const needed = new Map<string, { qty: number; name: string }>();
  for (const item of normalizedItems) {
    const prev = needed.get(item.inventory_item_id);
    needed.set(item.inventory_item_id, {
      qty: (prev?.qty || 0) + item.quantity,
      name: item.item_name,
    });
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
    discount_amount: discount,
    change_given: toRwf(input.changeGiven ?? normalized.changeDue),
    receipt_number: receiptNumber,
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
      for (const [id, req] of needed) {
        const inv = await db.inventory_items.get(id);
        if (!inv || !ownedByProfile(inv, profileId) || inv.quantity < req.qty) {
          throw new Error(`Stock ya ${req.name} ntihagije`);
        }
        await db.inventory_items.update(inv.id, {
          quantity: inv.quantity - req.qty,
          updated_at: now,
        });
      }

      await db.debts.add(debt);

      const debtItems: DebtItem[] = normalizedItems.map((item) => ({
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

      for (const item of normalizedItems) {
        const inv = await db.inventory_items.get(item.inventory_item_id);
        const sale: Sale = {
          id: newId(),
          profile_id: profileId,
          shop_id: input.shopId || profileId,
          cashier_user_id: input.cashierUserId || null,
          cashier_name: input.cashierName || null,
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
    cashTendered: normalized.cashTendered,
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
  idempotencyKey?: string | null;
}): Promise<Payment> {
  const profileId = await requireProfileId();
  const debt = await db.debts.get(input.debtId);
  if (!debt || !ownedByProfile(debt, profileId)) throw new Error("Ideni ntiribonetse");
  const amount = toRwf(input.amount);
  if (amount <= 0) throw new Error("Amafaranga ntayemewe");
  const method = assertPaymentMethod(input.paymentMethod);
  const reference = input.referenceNumber?.trim() || null;
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  if (idempotencyKey) {
    const prior = await db.payments
      .filter(
        (p) => ownedByProfile(p, profileId) && p.idempotency_key === idempotencyKey
      )
      .first();
    if (prior) return prior;
  }
  if (amount > toRwf(debt.remaining_balance)) {
    throw new Error("Amafaranga arenza ideni");
  }
  if (reference) {
    const message = await referenceConflictForProfile(
      profileId,
      input.debtId,
      method,
      reference
    );
    if (message) throw new Error(message);
  }

  const now = nowIso();

  const payment: Payment = {
    id: newId(),
    profile_id: profileId,
    debt_id: debt.id,
    client_id: debt.client_id,
    amount,
    payment_method: method,
    reference_number: reference,
    notes: input.notes || null,
    idempotency_key: idempotencyKey,
    created_at: now,
  };

  let replay: Payment | null = null;
  await db.transaction("rw", db.payments, db.debts, db.sales, async () => {
    if (idempotencyKey) {
      const prior = await db.payments
        .filter(
          (p) =>
            ownedByProfile(p, profileId) && p.idempotency_key === idempotencyKey
        )
        .first();
      if (prior) {
        replay = prior;
        return;
      }
    }
    const fresh = await db.debts.get(input.debtId);
    if (!fresh || !ownedByProfile(fresh, profileId)) {
      throw new Error("Ideni ntiribonetse");
    }
    if (amount > toRwf(fresh.remaining_balance)) {
      throw new Error("Amafaranga arenza ideni");
    }
    if (reference) {
      const message = await referenceConflictForProfile(
        profileId,
        input.debtId,
        method,
        reference
      );
      if (message) throw new Error(message);
    }
    const rem = toRwf(fresh.remaining_balance) - amount;
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
        payment_status: rem <= 0 ? "paid" : "partial",
        payment_method: method,
      });
    }
  });

  return replay || payment;
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

export async function deleteDebt(debtId: string, ownerPin: string) {
  const pin = assertDebtDeleteAllowed(ownerPin);
  const profileId = await requireProfileId();
  await assertOwnerPin(pin);
  const debt = await db.debts.get(debtId);
  if (!debt || !ownedByProfile(debt, profileId)) {
    throw new Error("Ideni ntiribonetse");
  }
  const now = nowIso();
  await db.transaction(
    "rw",
    db.inventory_items,
    db.debt_items,
    db.payments,
    db.sales,
    db.debts,
    async () => {
      if (isCashierModeActive()) throw new Error(CASHIER_DELETE_ERROR);
      const fresh = await db.debts.get(debtId);
      if (!fresh || !ownedByProfile(fresh, profileId)) {
        throw new Error("Ideni ntiribonetse");
      }
      const items = await db.debt_items.where("debt_id").equals(debtId).toArray();
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

async function referenceConflictForProfile(
  profileId: string,
  debtId: string,
  method: string,
  reference: string | null
): Promise<string | null> {
  if (!normalizePaymentReference(reference)) return null;
  const rows = await db.payments.filter((p) => ownedByProfile(p, profileId)).toArray();
  return referenceConflictMessage(
    paymentReferenceConflict(rows, { debtId, method, reference })
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

async function assertUniqueInventoryCodes(
  profileId: string,
  input: { sku?: string | null; barcode?: string | null },
  exceptId?: string
) {
  const sku = input.sku?.trim().toLowerCase() || "";
  const barcode = input.barcode?.trim().toLowerCase() || "";
  if (!sku && !barcode) return;
  const all = await db.inventory_items
    .filter((i) => ownedByProfile(i, profileId))
    .toArray();
  for (const item of all) {
    if (exceptId && item.id === exceptId) continue;
    if (sku && (item.sku || "").trim().toLowerCase() === sku) {
      throw new Error(`SKU ${input.sku} is already used by ${item.item_name}`);
    }
    if (barcode && (item.barcode || "").trim().toLowerCase() === barcode) {
      throw new Error(`Barcode ${input.barcode} is already used by ${item.item_name}`);
    }
  }
}

function cleanVariant(value: string | null | undefined): string | null {
  const text = (value || "").trim().slice(0, 80);
  return text || null;
}

function cleanMinOrder(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  return n > 0 ? n : null;
}

function inventoryMoney(value: number, label: string): number {
  const n = toRwf(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} ntikemewe`);
  return n;
}

export async function addInventoryItem(
  input: import("./types").InventoryWriteInput
): Promise<InventoryItem> {
  const profileId = await requireProfileId();
  const itemName = input.item_name.trim();
  if (!itemName) throw new Error("Izina ry'ikintu rirakenewe");
  const quantity = stockQuantity(input.quantity, 0);
  await assertUniqueInventoryCodes(profileId, input);
  const now = nowIso();
  const item: InventoryItem = {
    id: newId(),
    profile_id: profileId,
    item_name: itemName,
    quantity,
    selling_price: inventoryMoney(input.selling_price, "Igiciro cyo kugurisha"),
    cost_price: inventoryMoney(input.cost_price, "Igiciro cyo kugura"),
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
    variant_label: cleanVariant(input.variant_label),
    min_order_qty: cleanMinOrder(input.min_order_qty),
    description: input.description ?? null,
    variations: input.variations ?? null,
    specifications: input.specifications ?? null,
    warranty: input.warranty ?? null,
    dimensions: input.dimensions ?? null,
    weight: input.weight ?? null,
    material: input.material ?? null,
    is_available: input.is_available ?? true,
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
  const next: import("./types").InventoryUpdatePatch = { ...patch };
  if (next.item_name !== undefined) {
    const name = next.item_name.trim();
    if (!name) throw new Error("Izina ry'ikintu rirakenewe");
    next.item_name = name;
  }
  if (next.quantity !== undefined) {
    next.quantity = stockQuantity(next.quantity, 0);
  }
  if (next.selling_price !== undefined) {
    next.selling_price = inventoryMoney(next.selling_price, "Igiciro cyo kugurisha");
  }
  if (next.cost_price !== undefined) {
    next.cost_price = inventoryMoney(next.cost_price, "Igiciro cyo kugura");
  }
  if (next.variant_label !== undefined) next.variant_label = cleanVariant(next.variant_label);
  if (next.min_order_qty !== undefined) next.min_order_qty = cleanMinOrder(next.min_order_qty);
  if (next.sku !== undefined || next.barcode !== undefined) {
    await assertUniqueInventoryCodes(
      profileId,
      {
        sku: next.sku === undefined ? inv.sku : next.sku,
        barcode: next.barcode === undefined ? inv.barcode : next.barcode,
      },
      id
    );
  }
  await db.inventory_items.update(id, { ...next, updated_at: nowIso() });
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
  const sold = await db.sales
    .filter((s) => ownedByProfile(s, profileId) && s.inventory_item_id === id)
    .count();
  if (sold > 0) {
    throw new Error("Ntushobora gusiba igicuruzwa cyagurishijwe. Guhindura stock ahubwo.");
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

  const onDay = (iso: string) => calendarDateKeyInKigali(iso) === todayKey;
  const salesVolume = netSalesVolume(sales, debts);
  const moneyCollected = payments.reduce((s, p) => s + toRwf(p.amount), 0);
  const todayCollected = payments
    .filter((p) => onDay(p.created_at))
    .reduce((sum, p) => sum + toRwf(p.amount), 0);
  const todaySalesVolume = netSalesVolume(sales, debts, onDay);
  const weekCollected = payments
    .filter((p) => inWeek(p.created_at))
    .reduce((sum, p) => sum + toRwf(p.amount), 0);
  const weekSalesVolume = netSalesVolume(sales, debts, inWeek);

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
    (s, i) => s + extendTotal(i.selling_price, i.quantity),
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
  return buildLedgerDailyReports({ sales, payments, debts });
}

export async function resetSalesMoney(ownerPin: string) {
  await assertOwnerPin(ownerPin);
  const profileId = await requireProfileId();
  await db.transaction("rw", db.sales, db.payments, async () => {
    await db.sales.filter((s) => ownedByProfile(s, profileId)).delete();
    await db.payments.filter((p) => ownedByProfile(p, profileId)).delete();
  });
}

export async function factoryResetKeepClients(ownerPin: string) {
  await assertOwnerPin(ownerPin);
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

export async function wipeAllBusinessData(ownerPin: string) {
  await assertOwnerPin(ownerPin);
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

// ---------------------------------------------------------------------------
// Universal Marketplace & Store Management Functions (Local-first)
// ---------------------------------------------------------------------------

export async function updateStoreProfile(
  patch: Partial<
    Pick<
      Profile,
      | "business_name"
      | "owner_name"
      | "business_category"
      | "store_description"
      | "store_logo_url"
      | "store_cover_url"
      | "store_address"
      | "store_tin"
      | "phone"
      | "email"
    >
  >
): Promise<Profile> {
  const profileId = await requireProfileId();
  const existing = await db.profiles.get(profileId);
  if (!existing) throw new Error("Profile not found");

  const clean: Partial<Profile> = {
    updated_at: nowIso(),
  };

  if (patch.business_name !== undefined) {
    const bName = patch.business_name?.trim();
    if (bName && bName.length >= 2) {
      if (bName.toLowerCase() !== (existing.business_name || "").toLowerCase()) {
        const available = await isShopNameAvailableLocal(bName);
        if (!available) throw new Error("Izina ry'iduka rirafashwe — hitamo irindi");
      }
      clean.business_name = bName;
    }
  }

  if (patch.owner_name !== undefined) clean.owner_name = patch.owner_name?.trim() || null;
  if (patch.business_category !== undefined) {
    clean.business_category = normalizeBusinessCategory(patch.business_category);
  }
  if (patch.store_description !== undefined) {
    clean.store_description = patch.store_description?.trim() || null;
  }
  if (patch.store_logo_url !== undefined) {
    clean.store_logo_url = patch.store_logo_url?.trim() || null;
  }
  if (patch.store_cover_url !== undefined) {
    clean.store_cover_url = patch.store_cover_url?.trim() || null;
  }
  if (patch.store_address !== undefined) {
    clean.store_address = patch.store_address?.trim() || null;
  }
  if (patch.store_tin !== undefined) {
    clean.store_tin = patch.store_tin?.trim() || null;
  }

  await db.profiles.update(profileId, clean);
  const updated = await db.profiles.get(profileId);
  return updated || existing;
}

export interface CreateMarketplaceOrderInput {
  shopCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryType: import("./types").MarketplaceDeliveryType;
  deliveryAddress?: string | null;
  paymentMethod: import("./types").PaymentMethod;
  paymentReference?: string | null;
  notes?: string | null;
  items: Array<{
    inventoryItemId?: string | null;
    itemName: string;
    quantity: number;
    unitPrice: number;
    selectedVariation?: string | null;
  }>;
}

export async function createMarketplaceOrder(
  input: CreateMarketplaceOrderInput
): Promise<import("./types").MarketplaceOrder> {
  const shop = await db.profiles
    .where("shop_code")
    .equalsIgnoreCase(input.shopCode.trim())
    .first();

  const profileId = shop?.id || (await requireProfileId().catch(() => "marketplace_guest"));
  const orderId = newId();
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
  const now = nowIso();

  let totalAmount = 0;
  const orderItems: import("./types").MarketplaceOrderItem[] = [];

  for (const item of input.items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = toRwf(item.unitPrice);
    const itemTotal = extendTotal(unitPrice, qty);
    totalAmount += itemTotal;

    const orderItem: import("./types").MarketplaceOrderItem = {
      id: newId(),
      order_id: orderId,
      profile_id: profileId,
      inventory_item_id: item.inventoryItemId || null,
      item_name: item.itemName.trim(),
      quantity: qty,
      unit_price: unitPrice,
      total_price: itemTotal,
      selected_variation: item.selectedVariation?.trim() || null,
      created_at: now,
    };
    orderItems.push(orderItem);

    // If item exists in inventory, decrement stock cleanly
    if (item.inventoryItemId) {
      try {
        const inv = await db.inventory_items.get(item.inventoryItemId);
        if (inv && inv.quantity >= qty) {
          await db.inventory_items.update(inv.id, {
            quantity: Math.max(0, inv.quantity - qty),
            updated_at: now,
          });
        }
      } catch (e) {
        console.warn("Stock decrement warning for order item:", e);
      }
    }
  }

  const order: import("./types").MarketplaceOrder = {
    id: orderId,
    profile_id: profileId,
    shop_id: profileId,
    shop_code: shop?.shop_code || input.shopCode,
    shop_name: shop?.business_name || "Iduka",
    order_number: orderNumber,
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone.trim(),
    customer_email: input.customerEmail?.trim() || null,
    delivery_type: input.deliveryType,
    delivery_address: input.deliveryAddress?.trim() || null,
    status: "pending",
    payment_status: input.paymentReference ? "paid" : "pending",
    payment_method: input.paymentMethod,
    payment_reference: input.paymentReference?.trim() || null,
    total_amount: totalAmount,
    notes: input.notes?.trim() || null,
    items: orderItems,
    created_at: now,
    updated_at: now,
  };

  await db.transaction("rw", db.marketplace_orders, db.marketplace_order_items, async () => {
    await db.marketplace_orders.add(order);
    for (const oi of orderItems) {
      await db.marketplace_order_items.add(oi);
    }
  });

  return order;
}

export async function listMarketplaceOrders(
  shopCodeOrProfileId?: string
): Promise<import("./types").MarketplaceOrder[]> {
  let orders: import("./types").MarketplaceOrder[] = [];

  if (shopCodeOrProfileId) {
    orders = await db.marketplace_orders
      .filter(
        (o) =>
          o.profile_id === shopCodeOrProfileId ||
          (o.shop_code || "").toLowerCase() === shopCodeOrProfileId.toLowerCase()
      )
      .toArray();
  } else {
    const profileId = await requireProfileId().catch(() => null);
    if (profileId) {
      orders = await db.marketplace_orders
        .where("profile_id")
        .equals(profileId)
        .toArray();
    } else {
      orders = await db.marketplace_orders.toArray();
    }
  }

  orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Attach items
  for (const o of orders) {
    o.items = await db.marketplace_order_items.where("order_id").equals(o.id).toArray();
  }

  return orders;
}

export async function getMarketplaceOrder(
  orderNumberOrId: string
): Promise<import("./types").MarketplaceOrder | null> {
  const key = orderNumberOrId.trim();
  const order = await db.marketplace_orders
    .filter((o) => o.id === key || o.order_number.toUpperCase() === key.toUpperCase())
    .first();

  if (!order) return null;
  order.items = await db.marketplace_order_items.where("order_id").equals(order.id).toArray();
  return order;
}

export async function updateMarketplaceOrderStatus(
  orderId: string,
  status: import("./types").MarketplaceOrderStatus,
  paymentStatus?: import("./types").MarketplacePaymentStatus
): Promise<import("./types").MarketplaceOrder> {
  const order = await db.marketplace_orders.get(orderId);
  if (!order) throw new Error("Order not found");

  const patch: Partial<import("./types").MarketplaceOrder> = {
    status,
    updated_at: nowIso(),
  };
  if (paymentStatus) {
    patch.payment_status = paymentStatus;
  }

  await db.marketplace_orders.update(orderId, patch);
  const updated = await db.marketplace_orders.get(orderId);
  if (!updated) throw new Error("Order update failed");
  updated.items = await db.marketplace_order_items.where("order_id").equals(orderId).toArray();
  return updated;
}

export async function listMarketplaceProducts(filter?: {
  category?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}): Promise<
  Array<
    InventoryItem & {
      shop_name?: string;
      shop_code?: string;
      shop_category?: string;
    }
  >
> {
  const allItems = await db.inventory_items.toArray();
  const allProfiles = await db.profiles.toArray();
  const profileMap = new Map<string, Profile>(allProfiles.map((p) => [p.id, p]));

  const q = (filter?.query || "").toLowerCase().trim();
  const cat = filter?.category?.toLowerCase().trim();

  return allItems
    .filter((item) => {
      if (filter?.inStockOnly && item.quantity <= 0) return false;
      if (filter?.minPrice != null && item.selling_price < filter.minPrice) return false;
      if (filter?.maxPrice != null && item.selling_price > filter.maxPrice) return false;

      if (cat && cat !== "all") {
        const itemCat = (item.category || "").toLowerCase();
        const shop = item.profile_id ? profileMap.get(item.profile_id) : undefined;
        const shopCat = (shop?.business_category || "").toLowerCase();
        if (itemCat !== cat && shopCat !== cat) return false;
      }

      if (q) {
        const haystack = [
          item.item_name,
          item.category || "",
          item.brand || "",
          item.description || "",
          item.sku || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    })
    .map((item) => {
      const shop = item.profile_id ? profileMap.get(item.profile_id) : undefined;
      return {
        ...item,
        shop_name: shop?.business_name || "Iduka",
        shop_code: shop?.shop_code || "SEL-XXXX",
        shop_category: shop?.business_category || "general_merchandise",
      };
    });
}

export async function listMarketplaceStores(
  query?: string,
  category?: string
): Promise<Array<Profile & { product_count?: number }>> {
  const profiles = await db.profiles.toArray();
  const items = await db.inventory_items.toArray();

  const countMap = new Map<string, number>();
  for (const i of items) {
    if (i.profile_id) {
      countMap.set(i.profile_id, (countMap.get(i.profile_id) || 0) + 1);
    }
  }

  const q = (query || "").toLowerCase().trim();
  const cat = category?.toLowerCase().trim();

  return profiles
    .filter((p) => {
      if (cat && cat !== "all") {
        if ((p.business_category || "").toLowerCase() !== cat) return false;
      }
      if (q) {
        const haystack = [
          p.business_name || "",
          p.owner_name || "",
          p.shop_code || "",
          p.business_category || "",
          p.store_address || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .map((p) => ({
      ...p,
      product_count: countMap.get(p.id) || 0,
    }));
}
