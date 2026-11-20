import { getSupabase, isCloudMode } from "@/integrations/supabase/client";
import {
  drainOutbox,
  markOutbox,
  OutboxConflictError,
  type DrainResult,
  type OutboxItem,
} from "@/db/outbox";
import { db } from "@/db/localDb";
import { asOutboxError, isPermanentStockFailure } from "@/lib/syncErrors";
import { toast } from "sonner";

let listening = false;
let draining = false;

const empty: DrainResult = { synced: 0, failed: 0, cancelled: 0, conflicts: 0 };

async function currentOwner(): Promise<string | null> {
  if (!isCloudMode()) return null;
  try {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function restoreLocalStock(items: unknown[]): Promise<boolean> {
  if (!Array.isArray(items) || items.length === 0) return false;
  let restored = false;
  try {
    for (const raw of items) {
      const it = raw as { inventory_item_id?: string; quantity?: number; item_name?: string };
      const id = it.inventory_item_id;
      const qty = Number(it.quantity) || 0;
      if (!id || qty <= 0) continue;
      const inv = await db.inventory_items.get(id);
      if (inv) {
        await db.inventory_items.update(inv.id, {
          quantity: (inv.quantity || 0) + qty,
          updated_at: new Date().toISOString(),
        });
        restored = true;
      }
    }
    if (restored) {
      window.dispatchEvent(new CustomEvent("sella:inventory-updated"));
    }
  } catch (err) {
    console.warn("Could not restore local stock after conflict:", err);
  }
  return restored;
}

async function invokeOutboxItem(item: OutboxItem): Promise<void> {
  const sb = getSupabase();
  if (item.operation === "create_sale_order") {
    const { data, error } = await sb.rpc("create_sale_order", {
      p_payload: item.payload,
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(String(data.error));
    return;
  }
  if (item.operation === "record_payment") {
    const { data, error } = await sb.rpc("record_payment", {
      p_payload: item.payload,
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(String(data.error));
    return;
  }
  throw new Error(`Unknown outbox operation: ${item.operation}`);
}

export async function syncOutboxNow(): Promise<DrainResult> {
  if (!isCloudMode()) return empty;
  if (typeof navigator !== "undefined" && !navigator.onLine) return empty;
  const owner = await currentOwner();
  if (!owner) return empty;
  if (draining) return empty;
  draining = true;
  try {
    const result = await drainOutbox(owner, async (item) => {
      if (item.owner_key !== owner) {
        throw new Error("Refusing to sync another shop's offline sale");
      }
      try {
        await invokeOutboxItem(item);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const classified = asOutboxError(item.operation, e);
        if (classified instanceof OutboxConflictError) {
          if (item.operation === "create_sale_order" && isPermanentStockFailure(msg)) {
            const payload = item.payload as
              | { items?: unknown[]; local_stock_adjusted?: boolean }
              | undefined;
            const restored =
              payload?.local_stock_adjusted && payload.items
                ? await restoreLocalStock(payload.items)
                : false;
            if (restored) {
              await markOutbox(item.id, { stock_restored: true });
            }
            toast.error(
              restored
                ? "Sale kept — stock was sold elsewhere. Local stock was put back. Review this receipt."
                : "Sale kept on this device — stock conflict. It was not deleted."
            );
            window.dispatchEvent(
              new CustomEvent("sella:outbox-stock-conflict", { detail: { item, message: msg } })
            );
          }
          throw classified;
        }
        throw classified;
      }
    });
    if (result.synced > 0) {
      toast.success(
        result.synced === 1
          ? "1 offline sale synced"
          : `${result.synced} offline actions synced`
      );
      window.dispatchEvent(new CustomEvent("sella:outbox-synced", { detail: result }));
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} offline action(s) failed — will retry`);
    }
    if (result.conflicts > 0) {
      toast.error(
        `${result.conflicts} offline sale(s) need review — the receipt is still saved`
      );
    }
    return result;
  } finally {
    draining = false;
  }
}

/** Call once from AppShell — listens for reconnect. */
export function startOutboxSyncListener() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("sella:online", () => {
    void syncOutboxNow();
  });
  window.addEventListener("online", () => {
    void syncOutboxNow();
  });
  window.setTimeout(() => void syncOutboxNow(), 2500);
}
