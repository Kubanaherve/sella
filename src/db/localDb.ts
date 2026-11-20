import Dexie, { type Table } from "dexie";
import type {
  AppSetting,
  Client,
  Debt,
  DebtItem,
  InventoryItem,
  MarketplaceOrder,
  MarketplaceOrderItem,
  Payment,
  Profile,
  Sale,
  SessionRecord,
  ShopStaff,
} from "./types";
import { BRAND } from "@/lib/brand";

/** Empty local database — no seed/hardcoded business data. */
export class SellaDB extends Dexie {
  profiles!: Table<Profile, string>;
  clients!: Table<Client, string>;
  debts!: Table<Debt, string>;
  debt_items!: Table<DebtItem, string>;
  payments!: Table<Payment, string>;
  inventory_items!: Table<InventoryItem, string>;
  sales!: Table<Sale, string>;
  app_settings!: Table<AppSetting, string>;
  sessions!: Table<SessionRecord, string>;
  staff!: Table<ShopStaff, string>;
  marketplace_orders!: Table<MarketplaceOrder, string>;
  marketplace_order_items!: Table<MarketplaceOrderItem, string>;

  constructor() {
    super(BRAND.localDbName);
    this.version(1).stores({
      profiles: "id, phone_normalized",
      clients: "id, name, phone_normalized, created_at",
      debts: "id, client_id, status, created_at, due_date",
      debt_items: "id, debt_id, inventory_item_id",
      payments: "id, debt_id, client_id, created_at, payment_method",
      inventory_items: "id, item_name, created_at",
      sales: "id, created_at, inventory_item_id, client_id",
      app_settings: "id, setting_key",
      sessions: "id, profile_id",
    });
    this.version(2).stores({
      profiles: "id, phone_normalized, email_normalized, shop_code, business_name",
      clients: "id, name, phone_normalized, created_at",
      debts: "id, client_id, status, created_at, due_date",
      debt_items: "id, debt_id, inventory_item_id",
      payments: "id, debt_id, client_id, created_at, payment_method",
      inventory_items: "id, item_name, created_at",
      sales: "id, created_at, inventory_item_id, client_id",
      app_settings: "id, setting_key",
      sessions: "id, profile_id",
    });
    // v3: per-shop isolation on shared devices (profile_id on business tables)
    this.version(3)
      .stores({
        profiles: "id, phone_normalized, email_normalized, shop_code, business_name",
        clients: "id, profile_id, name, phone_normalized, created_at",
        debts: "id, profile_id, client_id, status, created_at, due_date",
        debt_items: "id, profile_id, debt_id, inventory_item_id",
        payments: "id, profile_id, debt_id, client_id, created_at, payment_method",
        inventory_items: "id, profile_id, item_name, created_at",
        sales: "id, profile_id, created_at, inventory_item_id, client_id",
        app_settings: "id, setting_key, profile_id",
        sessions: "id, profile_id",
      })
      .upgrade(async (tx) => {
        const profiles = await tx.table("profiles").toArray();
        const fallbackId = profiles[0]?.id as string | undefined;
        if (!fallbackId) return;
        const stamp = async (table: string) => {
          await tx
            .table(table)
            .toCollection()
            .modify((row: { profile_id?: string }) => {
              if (!row.profile_id) row.profile_id = fallbackId;
            });
        };
        await stamp("clients");
        await stamp("debts");
        await stamp("debt_items");
        await stamp("payments");
        await stamp("inventory_items");
        await stamp("sales");
        await stamp("app_settings");
      });
    // v4: richer inventory fields for bulk import (sku/barcode/unit/…)
    this.version(4).stores({
      profiles: "id, phone_normalized, email_normalized, shop_code, business_name",
      clients: "id, profile_id, name, phone_normalized, created_at",
      debts: "id, profile_id, client_id, status, created_at, due_date",
      debt_items: "id, profile_id, debt_id, inventory_item_id",
      payments: "id, profile_id, debt_id, client_id, created_at, payment_method",
      inventory_items:
        "id, profile_id, item_name, sku, barcode, category, created_at",
      sales: "id, profile_id, created_at, inventory_item_id, client_id",
      app_settings: "id, setting_key, profile_id",
      sessions: "id, profile_id",
    });
    // v5: staff management table (cashier / manager staff accounts)
    this.version(5).stores({
      profiles: "id, phone_normalized, email_normalized, shop_code, business_name",
      clients: "id, profile_id, name, phone_normalized, created_at",
      debts: "id, profile_id, client_id, status, created_at, due_date",
      debt_items: "id, profile_id, debt_id, inventory_item_id",
      payments: "id, profile_id, debt_id, client_id, created_at, payment_method",
      inventory_items:
        "id, profile_id, item_name, sku, barcode, category, created_at",
      sales: "id, profile_id, created_at, inventory_item_id, client_id",
      app_settings: "id, setting_key, profile_id",
      sessions: "id, profile_id",
      staff: "id, profile_id, shop_code, phone_normalized, status, name, created_at",
    });
    // v6: sales cashier attribution
    this.version(6).stores({
      profiles: "id, phone_normalized, email_normalized, shop_code, business_name",
      clients: "id, profile_id, name, phone_normalized, created_at",
      debts: "id, profile_id, client_id, status, created_at, due_date",
      debt_items: "id, profile_id, debt_id, inventory_item_id",
      payments: "id, profile_id, debt_id, client_id, created_at, payment_method",
      inventory_items:
        "id, profile_id, item_name, sku, barcode, category, created_at",
      sales: "id, profile_id, cashier_user_id, created_at, inventory_item_id, client_id",
      app_settings: "id, setting_key, profile_id",
      sessions: "id, profile_id",
      staff: "id, profile_id, shop_code, phone_normalized, status, name, created_at",
    });
    // v7: universal marketplace & order management
    this.version(7).stores({
      profiles:
        "id, phone_normalized, email_normalized, shop_code, business_name, business_category",
      clients: "id, profile_id, name, phone_normalized, created_at",
      debts: "id, profile_id, client_id, status, created_at, due_date",
      debt_items: "id, profile_id, debt_id, inventory_item_id",
      payments: "id, profile_id, debt_id, client_id, created_at, payment_method",
      inventory_items:
        "id, profile_id, item_name, sku, barcode, category, created_at",
      sales: "id, profile_id, cashier_user_id, created_at, inventory_item_id, client_id",
      app_settings: "id, setting_key, profile_id",
      sessions: "id, profile_id",
      staff: "id, profile_id, shop_code, phone_normalized, status, name, created_at",
      marketplace_orders:
        "id, profile_id, shop_code, order_number, customer_phone, status, payment_status, created_at",
      marketplace_order_items:
        "id, order_id, profile_id, inventory_item_id, created_at",
    });
  }
}

export const db = new SellaDB();

export const newId = () => crypto.randomUUID();

export const nowIso = () => new Date().toISOString();
