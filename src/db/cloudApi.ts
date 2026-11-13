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
  lineTotal,
  normalizePaymentSlices,
  sumRwf,
  toRwf,
  type PaymentSlice,
} from "@/lib/money";
import { calendarDateKeyInKigali, isWithinLastDaysKigali } from "@/lib/dates";
import { isNetworkFailure } from "@/lib/network";
import { enqueueOutbox } from "@/db/outbox";

export type { CreateSaleOrderInput, CreateSaleOrderResult };

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
  const { data, error } = await sb().auth.getUser();
  if (error || !data.user) throw new Error("Not signed in");
  return data.user.id;
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
    .ilike("name", trimmed);
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
  const { data, error } = await sb()
    .from("clients")
    .select("*")
    .eq("user_id", await uid())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapClient);
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
  const user_id = await uid();
  const { data: debts, error } = await sb()
    .from("debts")
    .select("*")
    .eq("user_id", user_id)
    .eq("status", "active")
    .gt("remaining_balance", 0)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const result: ActiveDebtRow[] = [];
  for (const debt of debts || []) {
    const { data: client } = await sb()
      .from("clients")
      .select("name, phone")
      .eq("id", debt.client_id)
      .maybeSingle();
    const { data: items } = await sb()
      .from("debt_items")
      .select("item_name, quantity, unit_price, created_at")
      .eq("debt_id", debt.id);
    const line_items = (items || []).map((i) => ({
      name: String(i.item_name),
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      created_at: String(i.created_at || debt.created_at),
    }));
    result.push({
      id: debt.id,
      client_id: debt.client_id,
      total_amount: Number(debt.total_amount),
      remaining_balance: Number(debt.remaining_balance),
      due_date: debt.due_date,
      status: debt.status,
      paid_at: debt.paid_at,
      notes: debt.notes,
      created_at: debt.created_at,
      updated_at: debt.updated_at,
      client_name: client?.name || "Unknown",
      client_phone: client?.phone || null,
      items_label: line_items.map((i) => `${i.name}: ${i.quantity}`).join(" , "),
      line_items,
    });
  }
  return result;
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

  const idempotencyKey = crypto.randomUUID();
  const payload = {
    idempotency_key: idempotencyKey,
    client_name: String(input.clientName || "").trim() || "Walk-in",
    phone: input.phone || null,
    due_date: normalized.remaining > 0 ? input.dueDate || null : null,
    discount_amount: discount,
    change_given: toRwf(input.changeGiven ?? normalized.changeDue),
    payments: normalized.slices.map((s) => ({
      method: s.method,
      amount: s.amount,
      reference_number: s.referenceNumber || null,
    })),
    items: input.items.map((i) => ({
      inventory_item_id: i.inventory_item_id,
      quantity: i.quantity,
      unit_price: toRwf(i.unit_price),
    })),
  };

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
}): Promise<Payment> {
  if (input.amount <= 0) throw new Error("Amafaranga ntayemewe");
  if (input.debtId.startsWith("offline:")) {
    throw new Error(
      "This sale is still syncing — wait for connection before recording a payment"
    );
  }

  const idempotency_key = crypto.randomUUID();
  const p_payload = {
    idempotency_key,
    debt_id: input.debtId,
    amount: toRwf(input.amount),
    payment_method: input.paymentMethod,
    notes: input.notes || null,
    reference_number: input.referenceNumber?.trim() || null,
  };

  let data: unknown;
  let error: { message?: string } | null = null;
  try {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error("offline");
    }
    const res = await sb().rpc("record_payment", { p_payload });
    data = res.data;
    error = res.error;
  } catch (err) {
    if (isNetworkFailure(err) || String((err as Error)?.message) === "offline") {
      await enqueueOutbox({
        operation: "record_payment",
        payload: p_payload,
        idempotency_key,
      });
      const now = new Date().toISOString();
      return {
        id: idempotency_key,
        debt_id: input.debtId,
        client_id: "offline",
        amount: toRwf(input.amount),
        payment_method: input.paymentMethod,
        reference_number: input.referenceNumber?.trim() || null,
        notes: input.notes || "queued offline",
        created_at: now,
      };
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
  if (error) {
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

export async function deleteDebt(debtId: string) {
  const user_id = await uid();
  const { data: items } = await sb()
    .from("debt_items")
    .select("*")
    .eq("debt_id", debtId)
    .eq("user_id", user_id);
  const now = new Date().toISOString();
  for (const item of items || []) {
    if (!item.inventory_item_id) continue;
    const { data: inv } = await sb()
      .from("inventory_items")
      .select("quantity")
      .eq("id", item.inventory_item_id)
      .eq("user_id", user_id)
      .maybeSingle();
    if (inv) {
      await sb()
        .from("inventory_items")
        .update({ quantity: inv.quantity + item.quantity, updated_at: now })
        .eq("id", item.inventory_item_id)
        .eq("user_id", user_id);
    }
  }
  await sb().from("payments").delete().eq("debt_id", debtId).eq("user_id", user_id);
  await sb().from("debt_items").delete().eq("debt_id", debtId).eq("user_id", user_id);
  const { error } = await sb()
    .from("debts")
    .delete()
    .eq("id", debtId)
    .eq("user_id", user_id);
  if (error) throw error;
}

function mapInventoryRow(row: Record<string, unknown>): InventoryItem {
  return {
    id: String(row.id),
    item_name: String(row.item_name),
    quantity: Number(row.quantity),
    selling_price: Number(row.selling_price),
    cost_price: Number(row.cost_price),
    date_bought:
      String(row.date_bought || "").slice(0, 10) ||
      String(row.created_at || "").slice(0, 10),
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
    description: (row.description as string | null) ?? null,
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

export async function listInventory(): Promise<InventoryItem[]> {
  const { data, error } = await sb()
    .from("inventory_items")
    .select("*")
    .eq("user_id", await uid())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapInventoryRow(row as Record<string, unknown>));
}

export async function addInventoryItem(
  input: import("./types").InventoryWriteInput
): Promise<InventoryItem> {
  const { data, error } = await sb()
    .from("inventory_items")
    .insert({
      user_id: await uid(),
      item_name: input.item_name.trim(),
      quantity: input.quantity,
      selling_price: input.selling_price,
      cost_price: input.cost_price,
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
  if (error) throw error;
  return mapInventoryRow(data as Record<string, unknown>);
}

export async function updateInventoryItem(
  id: string,
  patch: import("./types").InventoryUpdatePatch
) {
  const { error } = await sb()
    .from("inventory_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", await uid());
  if (error) throw error;
}

export async function findInventoryMatch(opts: {
  sku?: string | null;
  barcode?: string | null;
  item_name?: string | null;
}): Promise<InventoryItem | null> {
  const userId = await uid();
  if (opts.sku?.trim()) {
    const { data } = await sb()
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .ilike("sku", opts.sku.trim())
      .maybeSingle();
    if (data) return mapInventoryRow(data as Record<string, unknown>);
  }
  if (opts.barcode?.trim()) {
    const { data } = await sb()
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .ilike("barcode", opts.barcode.trim())
      .maybeSingle();
    if (data) return mapInventoryRow(data as Record<string, unknown>);
  }
  if (opts.item_name?.trim()) {
    const { data } = await sb()
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .ilike("item_name", opts.item_name.trim())
      .maybeSingle();
    if (data) return mapInventoryRow(data as Record<string, unknown>);
  }
  return null;
}

export async function deleteInventoryItem(id: string) {
  const { error } = await sb()
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("user_id", await uid());
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

  const user_id = await uid();
  const { data, error } = await sb()
    .from("sales")
    .insert({
      user_id,
      client_id: input.client_id ?? null,
      item_name: input.item_name.trim(),
      quantity: input.quantity,
      cost_price: input.cost_price,
      sale_price: input.sale_price,
      inventory_item_id: null,
      payment_method: input.payment_method || "cash",
      payment_status: "paid",
      debt_id: null,
    })
    .select("*")
    .single();
  if (error) throw error;
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
  /** Accrual: value of goods sold (all sale lines). */
  const salesVolume = (sales || []).reduce(
    (s, row) => s + lineTotal(row.sale_price, row.quantity),
    0
  );
  /** Cash actually collected (payments only — never double-count with sale lines). */
  const moneyCollected = (payments || []).reduce((s, p) => s + toRwf(p.amount), 0);
  const todaySalesVolume = (sales || [])
    .filter((s) => calendarDateKeyInKigali(String(s.created_at)) === todayKey)
    .reduce((sum, row) => sum + lineTotal(row.sale_price, row.quantity), 0);
  const todayCollected = (payments || [])
    .filter((p) => calendarDateKeyInKigali(String(p.created_at)) === todayKey)
    .reduce((sum, p) => sum + toRwf(p.amount), 0);
  const weekSalesVolume = (sales || [])
    .filter((s) => inWeek(String(s.created_at)))
    .reduce((sum, row) => sum + lineTotal(row.sale_price, row.quantity), 0);
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
    (s, i) => s + lineTotal(i.selling_price, i.quantity),
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

  for (const sale of sales || []) {
    const d = ensure(String(sale.created_at).slice(0, 10));
    const amount = lineTotal(sale.sale_price, sale.quantity);
    d.cashSales += amount; // goods sold (accrual), not cash
    d.accrualNewBusiness += amount;
  }
  for (const payment of payments || []) {
    const d = ensure(String(payment.created_at).slice(0, 10));
    const amt = toRwf(payment.amount);
    d.debtsCollected += amt;
    d.receivedTotal += amt; // money actually collected
  }
  for (const debt of debts || []) {
    const d = ensure(String(debt.created_at).slice(0, 10));
    d.newDebtIssued += toRwf(debt.total_amount);
    if (debt.status === "active") d.unpaidOutstanding += toRwf(debt.remaining_balance);
  }
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
}

export async function resetSalesMoney() {
  const user_id = await uid();
  await sb().from("sales").delete().eq("user_id", user_id);
  await sb().from("payments").delete().eq("user_id", user_id);
}

export async function factoryResetKeepClients() {
  const user_id = await uid();
  await sb().from("sales").delete().eq("user_id", user_id);
  await sb().from("payments").delete().eq("user_id", user_id);
  await sb().from("debt_items").delete().eq("user_id", user_id);
  await sb().from("debts").delete().eq("user_id", user_id);
}

export async function wipeAllBusinessData() {
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
