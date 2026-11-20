import { getSupabase } from "@/integrations/supabase/client";
import { normalizePhoneE164 } from "@/lib/phone";
import type {
  Client,
  CreateSaleOrderInput,
  CreateSaleOrderResult,
  Debt,
  InventoryItem,
  Payment,
  PaymentMethod,
  Sale,
  SalePaymentStatus,
} from "@/db/types";
import {
  assertPaymentMethod,
  extendTotal,
  lineTotal,
  normalizePaymentSlices,
  saleQuantity,
  stockQuantity,
  sumRwf,
  toRwf,
  type PaymentSlice,
} from "@/lib/money";
import { calendarDateKeyInKigali, isWithinLastDaysKigali, resolveSoldAt } from "@/lib/dates";
import { isNetworkFailure } from "@/lib/network";
import { enqueueOutbox } from "@/db/outbox";
import { withReadCache } from "@/db/readCache";
import { tenantOwnerId } from "@/lib/tenantContext";
import { requireOwnerPin } from "@/lib/ownerGate";
import { deleteDebtViaOwnerRpc } from "@/db/deleteDebtCloud";
import {
  paymentReferenceConflict,
  referenceConflictMessage,
  normalizePaymentReference,
} from "@/lib/paymentRef";
import { buildLedgerDailyReports, netSalesVolume } from "@/lib/reporting";

export type { CreateSaleOrderInput, CreateSaleOrderResult };

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

function makeReceiptNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `R-${t}-${r}`;
}

function mapPayment(pay: Record<string, unknown>): Payment {
  return {
    id: String(pay.id),
    debt_id: (pay.debt_id as string) || null,
    client_id: String(pay.client_id),
    amount: toRwf(pay.amount),
    payment_method: pay.payment_method as PaymentMethod,
    reference_number: (pay.reference_number as string) || null,
    notes: (pay.notes as string) || null,
    created_at: String(pay.created_at),
  };
}

const sb = () => getSupabase();

async function uid(): Promise<string> {
  return tenantOwnerId();
}

/** Session stored on device — works when getUser() cannot reach the network. */
async function sessionUserId(): Promise<string> {
  const { data } = await sb().auth.getSession();
  if (data.session?.user?.id) return data.session.user.id;
  return uid();
}

function mapClient(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: (row.phone as string) || null,
    phone_normalized: (row.phone_normalized as string) || null,
    address: (row.address as string) || null,
    notes: (row.notes as string) || null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getAppSetting(key: string): Promise<string | null> {
  const { data } = await sb()
    .from("app_settings")
    .select("setting_value")
    .eq("user_id", await uid())
    .eq("setting_key", key)
    .maybeSingle();
  return data?.setting_value ?? null;
}

export async function setAppSetting(key: string, value: string) {
  const user_id = await uid();
  const { data: existing } = await sb()
    .from("app_settings")
    .select("id")
    .eq("user_id", user_id)
    .eq("setting_key", key)
    .maybeSingle();
  if (existing) {
    const { error } = await sb()
      .from("app_settings")
      .update({ setting_value: value })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await sb().from("app_settings").insert({
      user_id,
      setting_key: key,
      setting_value: value,
    });
    if (error) throw error;
  }
}

export async function updateClientContact(
  clientId: string,
  patch: { name?: string; phone?: string | null }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.phone !== undefined) {
    updates.phone = patch.phone?.trim() || null;
    updates.phone_normalized = patch.phone ? normalizePhoneE164(patch.phone) : null;
  }
  const { error } = await sb()
    .from("clients")
    .update(updates)
    .eq("id", clientId)
    .eq("user_id", await uid());
  if (error) throw error;
}

export async function findOrCreateClient(name: string, phone?: string | null): Promise<Client> {
  const user_id = await uid();
  const trimmed = name.trim();
  const { data: existingRows, error: listErr } = await sb()
    .from("clients")
    .select("*")
    .eq("user_id", user_id)
    .ilike("name", escapeIlike(trimmed));
  if (listErr) throw listErr;
  const existing = (existingRows || []).find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) {
    if (phone && !existing.phone) {
      await updateClientContact(existing.id, { phone });
      const { data } = await sb().from("clients").select("*").eq("id", existing.id).single();
      return mapClient(data!);
    }
    return mapClient(existing);
  }
  const { data, error } = await sb()
    .from("clients")
    .insert({
      user_id,
      name: trimmed,
      phone: phone?.trim() || null,
      phone_normalized: phone ? normalizePhoneE164(phone) : null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapClient(data);
}

export async function listClients(): Promise<Client[]> {
  const owner = await uid();
  return withReadCache(owner, "clients", async () => {
    const { data, error } = await sb()
      .from("clients")
      .select("*")
      .eq("user_id", owner)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapClient);
  });
}

export async function deleteClient(clientId: string) {
  const { count } = await sb()
    .from("debts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", await uid())
    .eq("client_id", clientId)
    .eq("status", "active")
    .gt("remaining_balance", 0);
  if ((count || 0) > 0) throw new Error("Ntushobora gusiba umukiriya ufite ideni");
  const { error } = await sb()
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("user_id", await uid());
  if (error) throw error;
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
  const owner = await uid();
  return withReadCache(owner, "debts", async () => {
    const { data: debts, error } = await sb()
      .from("debts")
      .select("*")
      .eq("user_id", owner)
      .eq("status", "active")
      .gt("remaining_balance", 0)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = debts || [];
    if (!rows.length) return [];

    const debtIds = rows.map((d) => d.id as string);
    const clientIds = [...new Set(rows.map((d) => d.client_id as string))];
    const [{ data: clients, error: clientError }, { data: items, error: itemError }] =
      await Promise.all([
        sb().from("clients").select("id, name, phone").in("id", clientIds),
        sb()
          .from("debt_items")
          .select("debt_id, item_name, quantity, unit_price, created_at")
          .in("debt_id", debtIds),
      ]);
    if (clientError) throw clientError;
    if (itemError) throw itemError;

    const clientById = new Map((clients || []).map((c) => [String(c.id), c]));
    const itemsByDebt = new Map<string, NonNullable<typeof items>>();
    for (const item of items || []) {
      const id = String(item.debt_id);
      const list = itemsByDebt.get(id) || [];
      list.push(item);
      itemsByDebt.set(id, list);
    }

    return rows.map((debt) => {
      const client = clientById.get(String(debt.client_id));
      const line_items = (itemsByDebt.get(String(debt.id)) || []).map((i) => ({
        name: String(i.item_name),
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        created_at: String(i.created_at || debt.created_at),
      }));
      return {
        id: debt.id as string,
        client_id: debt.client_id as string,
        total_amount: Number(debt.total_amount),
        remaining_balance: Number(debt.remaining_balance),
        due_date: debt.due_date as string | null,
        status: debt.status as Debt["status"],
        paid_at: (debt.paid_at as string | null) ?? null,
        notes: (debt.notes as string | null) ?? null,
        created_at: String(debt.created_at),
        updated_at: String(debt.updated_at),
        client_name: client?.name || "Unknown",
        client_phone: client?.phone || null,
        items_label: line_items.map((i) => `${i.name}: ${i.quantity}`).join(" , "),
        line_items,
      };
    });
  });
}

export async function listDebtsForReport(): Promise<
  Array<ActiveDebtRow & { payment_amounts: number[] }>
> {
  const owner = await uid();
  const { data: debts, error } = await sb()
    .from("debts")
    .select("*")
    .eq("user_id", owner)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = debts || [];
  if (!rows.length) return [];
  const debtIds = rows.map((d) => d.id as string);
  const clientIds = [...new Set(rows.map((d) => d.client_id as string).filter(Boolean))];
  const [{ data: clients, error: clientError }, { data: items, error: itemError }, { data: payments, error: payError }] =
    await Promise.all([
      clientIds.length
        ? sb().from("clients").select("id, name, phone").in("id", clientIds)
        : Promise.resolve({ data: [], error: null }),
      sb().from("debt_items").select("debt_id, item_name, quantity, unit_price, created_at").in("debt_id", debtIds),
      sb().from("payments").select("debt_id, amount").eq("user_id", owner).in("debt_id", debtIds),
    ]);
  if (clientError) throw clientError;
  if (itemError) throw itemError;
  if (payError) throw payError;
  const clientById = new Map((clients || []).map((c) => [String(c.id), c]));
  const itemsByDebt = new Map<string, NonNullable<typeof items>>();
  for (const item of items || []) {
    const id = String(item.debt_id);
    const list = itemsByDebt.get(id) || [];
    list.push(item);
    itemsByDebt.set(id, list);
  }
  const paymentsByDebt = new Map<string, number[]>();
  for (const payment of payments || []) {
    if (!payment.debt_id) continue;
    const id = String(payment.debt_id);
    const list = paymentsByDebt.get(id) || [];
    list.push(Number(payment.amount));
    paymentsByDebt.set(id, list);
  }
  return rows.map((debt) => {
    const client = clientById.get(String(debt.client_id));
    const line_items = (itemsByDebt.get(String(debt.id)) || []).map((i) => ({
      name: String(i.item_name),
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      created_at: String(i.created_at || debt.created_at),
    }));
    return {
      id: debt.id as string,
      client_id: debt.client_id as string,
      total_amount: Number(debt.total_amount),
      remaining_balance: Number(debt.remaining_balance),
      due_date: (debt.due_date as string | null) ?? null,
      status: debt.status as Debt["status"],
      paid_at: (debt.paid_at as string | null) ?? null,
      notes: (debt.notes as string | null) ?? null,
      created_at: String(debt.created_at),
      updated_at: String(debt.updated_at),
      client_name: client?.name || "Unknown",
      client_phone: (client?.phone as string | null) ?? null,
      items_label: line_items.map((i) => `${i.name}: ${i.quantity}`).join(" , "),
      line_items,
      payment_amounts: paymentsByDebt.get(String(debt.id)) || [],
    };
  });
}

function mapDebt(debt: Record<string, unknown>): Debt {
  return {
    id: String(debt.id),
    client_id: String(debt.client_id),
    total_amount: Number(debt.total_amount),
    remaining_balance: Number(debt.remaining_balance),
    due_date: (debt.due_date as string) || null,
    status: debt.status as Debt["status"],
    paid_at: (debt.paid_at as string) || null,
    notes: (debt.notes as string) || null,
    discount_amount: toRwf(debt.discount_amount || 0),
    created_at: String(debt.created_at),
    updated_at: String(debt.updated_at),
  };
}

function mapSale(row: Record<string, unknown>): Sale {
  return {
    id: String(row.id),
    client_id: (row.client_id as string) || null,
    item_name: String(row.item_name),
    quantity: Number(row.quantity),
    cost_price: Number(row.cost_price),
    sale_price: Number(row.sale_price),
    inventory_item_id: (row.inventory_item_id as string) || null,
    payment_method: (row.payment_method as PaymentMethod) || null,
    payment_status: (row.payment_status as SalePaymentStatus) || "paid",
    debt_id: (row.debt_id as string) || null,
    created_at: String(row.created_at),
  };
}

/**
 * Atomic sale/credit checkout via Postgres RPC `create_sale_order`.
 * Requires migration `20261112170000_atomic_pos_rpcs.sql`.
 */
export async function createSaleOrder(
  input: CreateSaleOrderInput
): Promise<CreateSaleOrderResult> {
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
        method: assertPaymentMethod(input.paymentMethod || "cash"),
        amount: orderTotal,
        referenceNumber: input.referenceNumber,
      },
    ];
  }

  const normalized = normalizePaymentSlices(slices, orderTotal);
  if (normalized.remaining > 0 && !String(input.clientName || "").trim()) {
    throw new Error("Izina ry'umukiriya rirakenewe ku ideni");
  }

  const idempotencyKey = crypto.randomUUID();
  const payload = {
    idempotency_key: idempotencyKey,
    client_name: String(input.clientName || "").trim() || "Walk-in",
    phone: input.phone || null,
    due_date: normalized.remaining > 0 ? input.dueDate || null : null,
    discount_amount: discount,
    change_given: toRwf(input.changeGiven ?? normalized.changeDue),
    ...(input.soldAt ? { sold_at: resolveSoldAt(input.soldAt) } : {}),
    payments: normalized.slices.map((s) => ({
      method: s.method,
      amount: s.amount,
      reference_number: s.referenceNumber || null,
    })),
    items: normalizedItems.map((i) => ({
      inventory_item_id: i.inventory_item_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
    ...(input.cashierUserId ? { cashier_user_id: input.cashierUserId } : {}),
    ...(input.cashierName ? { cashier_name: input.cashierName } : {}),
    ...(input.shopId ? { shop_id: input.shopId } : {}),
  };

  const ownerKey = await sessionUserId();
  let data: unknown;
  try {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error("offline");
    }
    const res = await sb().rpc("create_sale_order", {
      p_payload: payload,
    });
    if (res.error) {
      const msg = res.error.message || "";
      if (/could not find the function|schema cache/i.test(msg)) {
        throw new Error(
          "Server update required: apply migration 20261112170000_atomic_pos_rpcs.sql"
        );
      }
      if (isNetworkFailure(res.error)) throw res.error;
      throw new Error(msg || "Sale failed");
    }
    data = res.data;
  } catch (err) {
    if (!isNetworkFailure(err) && String((err as Error)?.message) !== "offline") {
      throw err instanceof Error ? err : new Error(String(err));
    }
    const queued = await enqueueOutbox({
      operation: "create_sale_order",
      payload,
      idempotency_key: idempotencyKey,
      owner_key: ownerKey,
    });
    const now = new Date().toISOString();
    const receiptNumber = `OFF-${idempotencyKey.slice(0, 8).toUpperCase()}`;
    const provisionalDebt: Debt = {
      // Prefixed so follow-up payments cannot hit RPC with a fake debt UUID
      id: `offline:${queued.id}`,
      client_id: "offline",
      total_amount: orderTotal,
      remaining_balance: normalized.remaining,
      due_date: normalized.remaining > 0 ? input.dueDate || null : null,
      status: normalized.remaining > 0 ? "active" : "paid",
      paid_at: normalized.remaining > 0 ? null : now,
      notes: `queued offline · ${receiptNumber}`,
      created_at: now,
      updated_at: now,
    };
    return {
      debt: provisionalDebt,
      sales: [],
      payments: [],
      payment: null,
      paid: orderTotal - normalized.remaining,
      remaining: normalized.remaining,
      changeDue: toRwf(input.changeGiven ?? normalized.changeDue),
      cashTendered: normalized.cashTendered,
      receiptNumber,
      queuedOffline: true,
      outboxId: queued.id,
    };
  }

  const row = data as {
    debt: Record<string, unknown>;
    sales: Array<Record<string, unknown>>;
    payments: Array<Record<string, unknown>>;
    paid: number;
    remaining: number;
    changeDue: number;
    receiptNumber: string;
  };

  const paymentsOut = (row.payments || []).map((p) =>
    mapPayment({
      id: p.id,
      debt_id: row.debt?.id,
      client_id: row.debt?.client_id,
      amount: p.amount,
      payment_method: p.payment_method,
      reference_number: p.reference_number ?? null,
      notes: p.notes ?? null,
      created_at: p.created_at || new Date().toISOString(),
    })
  );

  // Reload full sale rows for consistent mapping when RPC returns summaries
  const debtId = String(row.debt.id);
  const user_id = await uid();
  const { data: insertedSales } = await sb()
    .from("sales")
    .select("*")
    .eq("user_id", user_id)
    .eq("debt_id", debtId);

  return {
    debt: mapDebt(row.debt),
    sales: (insertedSales || []).map((r) => mapSale(r)),
    payments: paymentsOut,
    payment: paymentsOut[0] || null,
    paid: toRwf(row.paid),
    remaining: toRwf(row.remaining),
    changeDue: toRwf(row.changeDue),
    cashTendered: normalized.cashTendered,
    receiptNumber: String(row.receiptNumber || row.debt.receipt_number || makeReceiptNumber()),
  };
}

/** @deprecated use createSaleOrder — kept for older callers */
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

/** Atomic debt payment via Postgres RPC `record_payment`. */
export async function recordPayment(input: {
  debtId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  referenceNumber?: string | null;
  idempotencyKey?: string | null;
}): Promise<Payment> {
  const amount = toRwf(input.amount);
  if (amount <= 0) throw new Error("Amafaranga ntayemewe");
  const method = assertPaymentMethod(input.paymentMethod);
  if (input.debtId.startsWith("offline:")) {
    throw new Error(
      "This sale is still syncing — wait for connection before recording a payment"
    );
  }

  const ownerKey = await sessionUserId();
  const idempotency_key = input.idempotencyKey?.trim() || crypto.randomUUID();
  const reference = input.referenceNumber?.trim() || null;
  const p_payload = {
    idempotency_key,
    debt_id: input.debtId,
    amount,
    payment_method: method,
    notes: input.notes || null,
    reference_number: reference,
  };

  const queuePayment = async (): Promise<Payment> => {
    await enqueueOutbox({
      operation: "record_payment",
      payload: p_payload,
      idempotency_key,
      owner_key: ownerKey,
    });
    return {
      id: idempotency_key,
      debt_id: input.debtId,
      client_id: "offline",
      amount,
      payment_method: method,
      reference_number: reference,
      notes: input.notes || "queued offline",
      idempotency_key,
      created_at: new Date().toISOString(),
    };
  };

  let data: unknown;
  let error: { message?: string } | null = null;
  try {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error("offline");
    }
    if (normalizePaymentReference(reference)) {
      const existing = await sb()
        .from("payments")
        .select("debt_id, payment_method, reference_number")
        .eq("user_id", ownerKey);
      if (existing.error) {
        if (isNetworkFailure(existing.error)) return queuePayment();
        throw new Error(existing.error.message);
      }
      const message = referenceConflictMessage(
        paymentReferenceConflict(existing.data || [], {
          debtId: input.debtId,
          method,
          reference,
        })
      );
      if (message) throw new Error(message);
    }
    const res = await sb().rpc("record_payment", { p_payload });
    data = res.data;
    error = res.error;
  } catch (err) {
    if (isNetworkFailure(err) || String((err as Error)?.message) === "offline") {
      return queuePayment();
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
  if (error) {
    if (isNetworkFailure(error)) return queuePayment();
    const msg = error.message || "";
    if (/could not find the function|schema cache/i.test(msg)) {
      throw new Error(
        "Server update required: apply migration 20261112170000_atomic_pos_rpcs.sql"
      );
    }
    throw new Error(msg || "Payment failed");
  }

  const payment = data as Record<string, unknown>;
  return {
    id: String(payment.id),
    debt_id: (payment.debt_id as string) || null,
    client_id: String(payment.client_id),
    amount: toRwf(payment.amount),
    payment_method: payment.payment_method as PaymentMethod,
    reference_number: (payment.reference_number as string) || null,
    notes: (payment.notes as string) || null,
    created_at: String(payment.created_at),
  };
}

export async function listRecentSales(limit = 40): Promise<
  Array<Sale & { client_name: string | null }>
> {
  const user_id = await uid();
  const { data, error } = await sb()
    .from("sales")
    .select("*, clients(name)")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => {
    const clients = row.clients as { name?: string } | null;
    return {
      ...mapSale(row),
      client_name: clients?.name || null,
    };
  });
}

export async function deleteDebt(debtId: string, ownerPin: string) {
  const client = sb();
  await deleteDebtViaOwnerRpc(
    (name, args) => client.rpc(name, args),
    debtId,
    ownerPin
  );
}

function mapInventoryRow(row: Record<string, unknown>): InventoryItem {
  return {
    id: String(row.id),
    item_name: String(row.item_name),
    quantity: Number(row.quantity),
    selling_price: Number(row.selling_price),
    cost_price: Number(row.cost_price),
    date_bought: kigaliDateOnly(String(row.date_bought || row.created_at || "")),
    notes: (row.notes as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    sku: (row.sku as string | null) ?? null,
    barcode: (row.barcode as string | null) ?? null,
    unit: (row.unit as string | null) ?? "pcs",
    brand: (row.brand as string | null) ?? null,
    supplier: (row.supplier as string | null) ?? null,
    min_quantity:
      row.min_quantity == null ? null : Number(row.min_quantity),
    variant_label: (row.variant_label as string | null) ?? null,
    min_order_qty:
      row.min_order_qty == null ? null : Number(row.min_order_qty),
    description: (row.description as string | null) ?? null,
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

function kigaliDateOnly(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return calendarDateKeyInKigali(value) || value.slice(0, 10);
}

export async function listInventory(): Promise<InventoryItem[]> {
  const owner = await uid();
  return withReadCache(owner, "inventory", async () => {
    const { data, error } = await sb()
      .from("inventory_items")
      .select("*")
      .eq("user_id", owner)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => mapInventoryRow(row as Record<string, unknown>));
  });
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

function isMissingCatalogColumn(error: { message?: string; code?: string }): boolean {
  const msg = `${error.code || ""} ${error.message || ""}`;
  return /variant_label|min_order_qty|schema cache|PGRST204/i.test(msg);
}

function inventoryMoney(value: number, label: string): number {
  const n = toRwf(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} ntikemewe`);
  return n;
}

async function assertCloudUniqueCodes(
  input: { sku?: string | null; barcode?: string | null },
  exceptId?: string
) {
  const sku = input.sku?.trim() || "";
  const barcode = input.barcode?.trim() || "";
  if (sku) {
    const match = await findInventoryMatch({ sku });
    if (match && match.id !== exceptId) {
      throw new Error(`SKU ${sku} is already used by ${match.item_name}`);
    }
  }
  if (barcode) {
    const match = await findInventoryMatch({ barcode });
    if (match && match.id !== exceptId) {
      throw new Error(`Barcode ${barcode} is already used by ${match.item_name}`);
    }
  }
}

export async function addInventoryItem(
  input: import("./types").InventoryWriteInput
): Promise<InventoryItem> {
  const itemName = input.item_name.trim();
  if (!itemName) throw new Error("Izina ry'ikintu rirakenewe");
  const quantity = stockQuantity(input.quantity, 0);
  await assertCloudUniqueCodes(input);
  const { data, error } = await sb()
    .from("inventory_items")
    .insert({
      user_id: await uid(),
      item_name: itemName,
      quantity,
      selling_price: inventoryMoney(input.selling_price, "Igiciro cyo kugurisha"),
      cost_price: inventoryMoney(input.cost_price, "Igiciro cyo kugura"),
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
      date_bought: input.date_bought || undefined,
    })
    .select("*")
    .single();
  if (error && isMissingCatalogColumn(error)) {
    const { data: retry, error: retryError } = await sb()
      .from("inventory_items")
      .insert({
        user_id: await uid(),
        item_name: itemName,
        quantity,
        selling_price: inventoryMoney(input.selling_price, "Igiciro cyo kugurisha"),
        cost_price: inventoryMoney(input.cost_price, "Igiciro cyo kugura"),
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
        date_bought: input.date_bought || undefined,
      })
      .select("*")
      .single();
    if (retryError) throw retryError;
    return mapInventoryRow(retry as Record<string, unknown>);
  }
  if (error) throw error;
  return mapInventoryRow(data as Record<string, unknown>);
}

export async function updateInventoryItem(
  id: string,
  patch: import("./types").InventoryUpdatePatch
) {
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
    await assertCloudUniqueCodes(
      { sku: next.sku, barcode: next.barcode },
      id
    );
  }
  const owner = await uid();
  const { error } = await sb()
    .from("inventory_items")
    .update({ ...next, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", owner);
  if (error && isMissingCatalogColumn(error)) {
    const { variant_label: _variant, min_order_qty: _min, ...rest } = next;
    const { error: retryError } = await sb()
      .from("inventory_items")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", owner);
    if (retryError) throw retryError;
    return;
  }
  if (error) throw error;
}

export async function findInventoryMatch(opts: {
  sku?: string | null;
  barcode?: string | null;
  item_name?: string | null;
}): Promise<InventoryItem | null> {
  const userId = await uid();
  const lookup = async (
    column: "sku" | "barcode" | "item_name",
    raw: string
  ): Promise<InventoryItem | null> => {
    const wanted = raw.trim().toLowerCase();
    const { data, error } = await sb()
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .ilike(column, escapeIlike(raw.trim()));
    if (error) throw error;
    const hit = (data || []).find(
      (row) => String(row[column] || "").trim().toLowerCase() === wanted
    );
    return hit ? mapInventoryRow(hit as Record<string, unknown>) : null;
  };
  if (opts.sku?.trim()) {
    const hit = await lookup("sku", opts.sku);
    if (hit) return hit;
  }
  if (opts.barcode?.trim()) {
    const hit = await lookup("barcode", opts.barcode);
    if (hit) return hit;
  }
  if (opts.item_name?.trim()) {
    const hit = await lookup("item_name", opts.item_name);
    if (hit) return hit;
  }
  return null;
}

export async function deleteInventoryItem(id: string) {
  const userId = await uid();
  const { count, error: countErr } = await sb()
    .from("sales")
    .select("id", { count: "exact", head: true })
    .eq("inventory_item_id", id)
    .eq("user_id", userId);
  if (countErr) throw countErr;
  if ((count || 0) > 0) {
    throw new Error("Ntushobora gusiba igicuruzwa cyagurishijwe. Guhindura stock ahubwo.");
  }
  const { error } = await sb()
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
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
  const soldAt = input.soldAt ? resolveSoldAt(input.soldAt) : new Date().toISOString();

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

  const user_id = await uid();
  const client = input.client_id
    ? { id: input.client_id }
    : await findOrCreateClient("Walk-in");
  const { data, error } = await sb()
    .from("sales")
    .insert({
      user_id,
      client_id: client.id,
      item_name: input.item_name.trim(),
      quantity,
      cost_price: costPrice,
      sale_price: salePrice,
      inventory_item_id: null,
      payment_method: method,
      payment_status: "paid",
      debt_id: null,
      ...(input.soldAt ? { created_at: soldAt } : {}),
    })
    .select("*")
    .single();
  if (error) throw error;
  const { error: payErr } = await sb().from("payments").insert({
    user_id,
    debt_id: null,
    client_id: client.id,
    amount: lineTotal(salePrice, quantity),
    payment_method: method,
    notes: "Cash sale",
    ...(input.soldAt ? { created_at: soldAt } : {}),
  });
  if (payErr) throw payErr;
  return mapSale(data);
}

export async function getDashboardStats() {
  const user_id = await uid();
  const todayKey = calendarDateKeyInKigali();
  const inWeek = (iso: string) => isWithinLastDaysKigali(String(iso), 7);

  const [{ data: debts }, { data: clients }, { data: sales }, { data: inventory }, { data: payments }] =
    await Promise.all([
      sb().from("debts").select("*").eq("user_id", user_id),
      sb().from("clients").select("id").eq("user_id", user_id),
      sb().from("sales").select("*").eq("user_id", user_id),
      sb().from("inventory_items").select("*").eq("user_id", user_id),
      sb().from("payments").select("*").eq("user_id", user_id),
    ]);

  const totalUnpaid = (debts || [])
    .filter((d) => d.status === "active")
    .reduce((s, d) => s + toRwf(d.remaining_balance), 0);
  const saleRows = sales || [];
  const debtRows = debts || [];
  const onDay = (iso: string) => calendarDateKeyInKigali(String(iso)) === todayKey;
  /** Accrual: amount charged after basket discounts. */
  const salesVolume = netSalesVolume(saleRows, debtRows);
  /** Cash actually collected (payments only — never double-count with sale lines). */
  const moneyCollected = (payments || []).reduce((s, p) => s + toRwf(p.amount), 0);
  const todaySalesVolume = netSalesVolume(saleRows, debtRows, onDay);
  const todayCollected = (payments || [])
    .filter((p) => calendarDateKeyInKigali(String(p.created_at)) === todayKey)
    .reduce((sum, p) => sum + toRwf(p.amount), 0);
  const weekSalesVolume = netSalesVolume(saleRows, debtRows, (iso) => inWeek(String(iso)));
  const weekCollected = (payments || [])
    .filter((p) => inWeek(String(p.created_at)))
    .reduce((sum, p) => sum + toRwf(p.amount), 0);
  const todayDebt = (debts || [])
    .filter(
      (d) =>
        calendarDateKeyInKigali(String(d.created_at)) === todayKey &&
        d.status === "active"
    )
    .reduce((s, d) => s + toRwf(d.remaining_balance), 0);
  const weekDebt = (debts || [])
    .filter((d) => inWeek(String(d.created_at)) && d.status === "active")
    .reduce((s, d) => s + toRwf(d.remaining_balance), 0);
  const inventoryValue = (inventory || []).reduce(
    (s, i) => s + extendTotal(i.selling_price, i.quantity),
    0
  );
  const goal = await getAppSetting("sales_goal");
  const salesGoal = toRwf(goal || inventoryValue || 0);

  return {
    totalUnpaid,
    totalCustomers: (clients || []).length,
    /** @deprecated alias of moneyCollected — goal progress uses money in hand */
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

export async function getDailyReports(): Promise<DailyReport[]> {
  const user_id = await uid();
  const [{ data: sales }, { data: payments }, { data: debts }] = await Promise.all([
    sb().from("sales").select("*").eq("user_id", user_id),
    sb().from("payments").select("*").eq("user_id", user_id),
    sb().from("debts").select("*").eq("user_id", user_id),
  ]);

  return buildLedgerDailyReports({
    sales: sales || [],
    payments: payments || [],
    debts: debts || [],
  });
}

export async function resetSalesMoney(ownerPin: string) {
  await requireOwnerPin(ownerPin);
  const user_id = await uid();
  await sb().from("sales").delete().eq("user_id", user_id);
  await sb().from("payments").delete().eq("user_id", user_id);
}

export async function factoryResetKeepClients(ownerPin: string) {
  await requireOwnerPin(ownerPin);
  const user_id = await uid();
  await sb().from("sales").delete().eq("user_id", user_id);
  await sb().from("payments").delete().eq("user_id", user_id);
  await sb().from("debt_items").delete().eq("user_id", user_id);
  await sb().from("debts").delete().eq("user_id", user_id);
}

export async function wipeAllBusinessData(ownerPin: string) {
  await requireOwnerPin(ownerPin);
  const user_id = await uid();
  await sb().from("sales").delete().eq("user_id", user_id);
  await sb().from("payments").delete().eq("user_id", user_id);
  await sb().from("debt_items").delete().eq("user_id", user_id);
  await sb().from("debts").delete().eq("user_id", user_id);
  await sb().from("clients").delete().eq("user_id", user_id);
  await sb().from("inventory_items").delete().eq("user_id", user_id);
  await sb().from("app_settings").delete().eq("user_id", user_id);
}

export async function getOwnerPhone(): Promise<string | null> {
  return getAppSetting("owner_phone");
}

export async function setOwnerPhone(phone: string) {
  await setAppSetting("owner_phone", phone);
}
