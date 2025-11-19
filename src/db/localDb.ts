import Dexie, { type Table } from "dexie";
import type {
  AppSetting,
  Client,
  Debt,
  DebtItem,
  InventoryItem,
  Payment,
  Profile,
  Sale,
  SessionRecord,
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
  }
}

export const db = new SellaDB();

export const newId = () => crypto.randomUUID();

export const nowIso = () => new Date().toISOString();
