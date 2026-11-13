import { getSupabase, isCloudMode } from "@/integrations/supabase/client";
import { drainOutbox, type OutboxItem } from "@/db/outbox";
import { toast } from "sonner";

let listening = false;
let draining = false;

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

export async function syncOutboxNow(): Promise<{ synced: number; failed: number }> {
  if (!isCloudMode()) return { synced: 0, failed: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }
  if (draining) return { synced: 0, failed: 0 };
  draining = true;
  try {
    const result = await drainOutbox(invokeOutboxItem);
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
