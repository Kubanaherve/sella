import { getSupabase, isCloudMode } from "@/integrations/supabase/client";
import { drainOutbox, OutboxCancelError, type OutboxItem } from "@/db/outbox";
import { db } from "@/db/localDb";
import { toast } from "sonner";

let listening = false;
let draining = false;

function isPermanentStockFailure(message: string): boolean {
  return /insufficient|stock|quantity|not enough|out of stock|inventory/i.test(message);
}

async function restoreLocalStock(items: unknown[]): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;
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
      }
    }
    window.dispatchEvent(new CustomEvent("sella:inventory-updated"));
  } catch (err) {
    console.warn("Could not restore local stock after conflict:", err);
  }
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

export async function syncOutboxNow(): Promise<{
  synced: number;
  failed: number;
  cancelled: number;
}> {
  if (!isCloudMode()) return { synced: 0, failed: 0, cancelled: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0, cancelled: 0 };
  }
  if (draining) return { synced: 0, failed: 0, cancelled: 0 };
  draining = true;
  try {
    const result = await drainOutbox(async (item) => {
      try {
        await invokeOutboxItem(item);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Stock conflicts will never succeed on retry — restore local stock and cancel instead of looping
        if (item.operation === "create_sale_order" && isPermanentStockFailure(msg)) {
          const payload = item.payload as { items?: unknown[] } | undefined;
          if (payload?.items) {
            await restoreLocalStock(payload.items);
          }
          toast.error(
            "Offline sale cancelled: stock was sold elsewhere. Local stock restored."
          );
          window.dispatchEvent(
            new CustomEvent("sella:outbox-stock-conflict", { detail: { item, message: msg } })
          );
          throw new OutboxCancelError(msg);
        }
        throw e;
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
  // Attempt once shortly after boot
  window.setTimeout(() => void syncOutboxNow(), 2500);
}
