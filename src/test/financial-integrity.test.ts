import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/localDb";
import {
  addInventoryItem,
  createSaleOrder,
  deleteDebt,
  recordPayment,
  setSession,
  signupLocal,
} from "@/db/localApi";
import { deleteDebt as deleteCloudDebt } from "@/db/cloudApi";
import {
  clearOutbox,
  drainOutbox,
  enqueueOutbox,
  getOutboxItem,
  listConflictOutbox,
  markOutbox,
  OutboxConflictError,
} from "@/db/outbox";
import { resolveConflictAsOwner } from "@/services/conflictResolve";
import { describeConflict } from "@/lib/conflictReview";
import { requestDebtDelete } from "@/lib/debtDeletion";
import {
  SAME_DEBT_REFERENCE_ERROR,
  SHOP_MOMO_REFERENCE_ERROR,
  paymentReferenceConflict,
} from "@/lib/paymentRef";
import { asOutboxError, isPermanentStockFailure } from "@/lib/syncErrors";
import {
  resetCashierModeForTests,
  setCashierModeActive,
} from "@/lib/cashierMode";

const STOCK = "Ububiko ntibuhagije kuri Amata (has 0, needs 2)";

const { rpc, from } = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(() => {
    throw new Error("direct table access is not authorization");
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  getSupabase: () => ({
    rpc,
    from,
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null } }),
    },
    functions: { invoke: async () => ({ data: null, error: { message: "no" } }) },
  }),
  isCloudMode: () => false,
  hasSupabaseConfig: () => false,
}));

async function shop(phone: string, business: string) {
  const result = await signupLocal({
    phone,
    pin: "1234",
    displayName: business,
    businessName: business,
    email: `${phone}@example.com`,
  });
  if ("error" in result) throw new Error(result.error);
  return result.profile;
}

async function credit(name: string, price = 10000) {
  const item = await addInventoryItem({
    item_name: name,
    quantity: 10,
    cost_price: 1000,
    selling_price: price,
  });
  const sale = await createSaleOrder({
    clientName: name,
    amount: price,
    payments: [],
    items: [
      {
        inventory_item_id: item.id,
        item_name: item.item_name,
        quantity: 1,
        unit_price: price,
      },
    ],
  });
  return { item, debtId: sale.debt.id };
}

describe("financial integrity", () => {
  beforeEach(async () => {
    rpc.mockReset();
    from.mockClear();
    resetCashierModeForTests();
    await clearOutbox();
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();
  });

  describe("debt deletion", () => {
    it("rejects a cashier through the UI handler without calling delete", async () => {
      const remove = vi.fn();
      await expect(
        requestDebtDelete({
          isCashier: true,
          canWrite: true,
          pin: "1234",
          debtId: "debt-1",
          remove,
        })
      ).rejects.toThrow(/Cashier Mode/);
      expect(remove).not.toHaveBeenCalled();
    });

    it("rejects a cashier who calls deleteDebt directly and keeps the debt", async () => {
      await shop("0788111001", "Delete Shop");
      const { item, debtId } = await credit("Aline");
      setCashierModeActive(true);
      await expect(deleteDebt(debtId, "1234")).rejects.toThrow(/Cashier Mode/);
      expect(await db.debts.get(debtId)).toBeTruthy();
      expect((await db.inventory_items.get(item.id))?.quantity).toBe(9);
    });

    it("rejects a wrong PIN and keeps the debt", async () => {
      await shop("0788111002", "Pin Shop");
      const { debtId } = await credit("Beata");
      await expect(deleteDebt(debtId, "0000")).rejects.toThrow(/PIN/);
      expect(await db.debts.get(debtId)).toBeTruthy();
    });

    it("lets the owner delete and restores stock", async () => {
      await shop("0788111003", "Owner Shop");
      const { item, debtId } = await credit("Chantal");
      await deleteDebt(debtId, "1234");
      expect(await db.debts.get(debtId)).toBeUndefined();
      expect((await db.inventory_items.get(item.id))?.quantity).toBe(10);
    });

    it("rejects deletion when the subscription gate is closed", async () => {
      const remove = vi.fn();
      await expect(
        requestDebtDelete({
          isCashier: false,
          canWrite: false,
          pin: "1234",
          debtId: "debt-1",
          remove,
        })
      ).rejects.toThrow(/Subscription/);
      expect(remove).not.toHaveBeenCalled();
    });

    it("rejects an unauthorized cloud delete without touching tables", async () => {
      rpc.mockResolvedValue({
        data: null,
        error: { message: "PIN y'umuyobozi sibyo" },
      });
      await expect(deleteCloudDebt("debt-9", "1234")).rejects.toThrow(/PIN/);
      expect(rpc).toHaveBeenCalledWith("delete_debt_owner", {
        p_debt_id: "debt-9",
        p_pin: "1234",
      });
      expect(from).not.toHaveBeenCalled();
    });

    it("sends an authorized cloud delete only through the owner RPC", async () => {
      rpc.mockResolvedValue({ data: { deleted: true }, error: null });
      await deleteCloudDebt("debt-9", "1234");
      expect(rpc).toHaveBeenCalledWith("delete_debt_owner", {
        p_debt_id: "debt-9",
        p_pin: "1234",
      });
      expect(from).not.toHaveBeenCalled();
    });

    it("rejects a cloud delete when the server reports an expired subscription", async () => {
      rpc.mockResolvedValue({
        data: null,
        error: { message: "Subscription expired — renew to create or edit records" },
      });
      await expect(deleteCloudDebt("debt-9", "1234")).rejects.toThrow(/Subscription expired/);
      expect(from).not.toHaveBeenCalled();
    });

    it("fails closed when the delete RPC is not installed", async () => {
      rpc.mockResolvedValue({
        data: null,
        error: { message: "Could not find the function public.delete_debt_owner" },
      });
      await expect(deleteCloudDebt("debt-9", "1234")).rejects.toThrow(/Server update required/);
      expect(from).not.toHaveBeenCalled();
    });

    it("does not call the cloud RPC while Cashier Mode is on", async () => {
      setCashierModeActive(true);
      await expect(deleteCloudDebt("debt-9", "1234")).rejects.toThrow(/Cashier Mode/);
      expect(rpc).not.toHaveBeenCalled();
      expect(from).not.toHaveBeenCalled();
    });
  });

  describe("Kinyarwanda stock conflicts", () => {
    it("classifies both ntihagije and ntibuhagije, including the live exception", () => {
      expect(isPermanentStockFailure("Stock ya Amata ntihagije")).toBe(true);
      expect(isPermanentStockFailure("Ububiko ntibuhagije kuri Inyange")).toBe(true);
      expect(isPermanentStockFailure(STOCK)).toBe(true);
      expect(isPermanentStockFailure("Ububiko bwinshi")).toBe(false);
      expect(isPermanentStockFailure("timeout")).toBe(false);
      expect(asOutboxError("create_sale_order", new Error(STOCK))).toBeInstanceOf(
        OutboxConflictError
      );
    });

    it("stores the sale as conflict and does not retry it", async () => {
      const payload = {
        client_name: "Aline",
        phone: "0788000000",
        amount: 2000,
        items: [{ item_name: "Amata", quantity: 2, unit_price: 1000 }],
        payments: [{ method: "cash", amount: 2000, reference_number: null }],
      };
      const item = await enqueueOutbox({
        operation: "create_sale_order",
        owner_key: "merchant-a",
        idempotency_key: "sale-key-1",
        payload,
      });
      await drainOutbox("merchant-a", async () => {
        throw asOutboxError("create_sale_order", new Error(STOCK));
      });
      const stored = await getOutboxItem(item.id);
      expect(stored?.status).toBe("conflict");
      expect(stored?.payload).toEqual(payload);
      expect(stored?.idempotency_key).toBe("sale-key-1");
      let calls = 0;
      await drainOutbox("merchant-a", async () => {
        calls += 1;
      });
      expect(calls).toBe(0);
      expect((await getOutboxItem(item.id))?.payload).toEqual(payload);
    });

    it("keeps a duplicate MoMo sync failure as conflict instead of retrying", async () => {
      const payload = { debt_id: "d1", amount: 1000, reference_number: "AB12" };
      const item = await enqueueOutbox({
        operation: "record_payment",
        owner_key: "merchant-a",
        idempotency_key: "pay-key-1",
        payload,
      });
      await drainOutbox("merchant-a", async () => {
        throw asOutboxError("record_payment", new Error(SHOP_MOMO_REFERENCE_ERROR));
      });
      const stored = await getOutboxItem(item.id);
      expect(stored?.status).toBe("conflict");
      expect(stored?.payload).toEqual(payload);
      expect(stored?.idempotency_key).toBe("pay-key-1");
      let calls = 0;
      await drainOutbox("merchant-a", async () => {
        calls += 1;
      });
      expect(calls).toBe(0);
    });
  });

  describe("conflict review", () => {
    const payload = {
      client_name: "Aline",
      phone: "0788123456",
      sold_at: "2026-11-19T10:00:00.000Z",
      discount_amount: 0,
      items: [
        {
          item_name: "Amata",
          inventory_item_id: "item-1",
          quantity: 2,
          unit_price: 1000,
        },
      ],
      payments: [{ method: "momo", amount: 2000, reference_number: "MM1" }],
    };

    async function conflict(owner: string) {
      const item = await enqueueOutbox({
        operation: "create_sale_order",
        owner_key: owner,
        idempotency_key: `key-${owner}`,
        payload,
      });
      await drainOutbox(owner, async () => {
        throw new OutboxConflictError(STOCK);
      });
      return item.id;
    }

    it("shows the original sale and hides another merchant's conflicts", async () => {
      const id = await conflict("merchant-a");
      const mine = await listConflictOutbox("merchant-a");
      expect(mine.map((row) => row.id)).toEqual([id]);
      expect(await listConflictOutbox("merchant-b")).toEqual([]);
      const view = describeConflict(mine[0]);
      expect(view.clientName).toBe("Aline");
      expect(view.phone).toBe("0788123456");
      expect(view.amount).toBe(2000);
      expect(view.reason).toBe(STOCK);
      expect(view.items[0]).toMatchObject({ name: "Amata", quantity: 2, unitPrice: 1000 });
      expect(view.payments[0]).toMatchObject({
        method: "momo",
        amount: 2000,
        reference: "MM1",
      });
      expect(view.idempotencyKey).toBe("key-merchant-a");
    });

    it("refuses another merchant, a cashier, and a wrong PIN", async () => {
      await shop("0788111004", "Review Shop");
      const id = await conflict("merchant-a");
      await expect(
        resolveConflictAsOwner({
          ownerKey: "merchant-b",
          id,
          action: "void",
          note: "no",
          pin: "1234",
        })
      ).rejects.toThrow(/not found/i);
      expect((await getOutboxItem(id))?.status).toBe("conflict");
      expect((await getOutboxItem(id))?.payload).toEqual(payload);

      setCashierModeActive(true);
      await expect(
        resolveConflictAsOwner({
          ownerKey: "merchant-a",
          id,
          action: "void",
          note: "no",
          pin: "1234",
        })
      ).rejects.toThrow(/Cashier Mode/);
      resetCashierModeForTests();
      await expect(
        resolveConflictAsOwner({
          ownerKey: "merchant-a",
          id,
          action: "void",
          note: "no",
          pin: "0000",
        })
      ).rejects.toThrow(/PIN/);
      expect((await getOutboxItem(id))?.status).toBe("conflict");
    });

    it("voids once, keeps the payload, and does not post it again", async () => {
      await shop("0788111005", "Void Shop");
      const id = await conflict("merchant-a");
      const first = await resolveConflictAsOwner({
        ownerKey: "merchant-a",
        id,
        action: "void",
        note: "Customer left",
        pin: "1234",
      });
      expect(first.status).toBe("resolved");
      expect(first.payload).toEqual(payload);
      expect(first.idempotency_key).toBe("key-merchant-a");
      expect(first.resolution_action).toBe("void");
      expect(first.resolved_by).toBe("merchant-a");
      expect(first.resolved_at).toBeTruthy();
      expect(first.resolution_log).toHaveLength(1);
      const second = await resolveConflictAsOwner({
        ownerKey: "merchant-a",
        id,
        action: "void",
        note: "again",
        pin: "1234",
      });
      expect(second.resolution_log).toHaveLength(1);
      await expect(
        resolveConflictAsOwner({
          ownerKey: "merchant-a",
          id,
          action: "retry",
          note: "repost",
          pin: "1234",
        })
      ).rejects.toThrow(/will not be posted/);
      let calls = 0;
      await drainOutbox("merchant-a", async () => {
        calls += 1;
      });
      expect(calls).toBe(0);
      expect((await getOutboxItem(id))?.payload).toEqual(payload);
    });

    it("retries the same key once and refuses a second stock deduction", async () => {
      await shop("0788111006", "Retry Shop");
      const item = await addInventoryItem({
        item_name: "Amata",
        quantity: 2,
        cost_price: 500,
        selling_price: 1000,
      });
      const queued = await enqueueOutbox({
        operation: "create_sale_order",
        owner_key: "merchant-a",
        idempotency_key: "retry-key",
        payload: {
          ...payload,
          local_stock_adjusted: true,
          items: [{ ...payload.items[0], inventory_item_id: item.id }],
        },
      });
      await drainOutbox("merchant-a", async () => {
        throw new OutboxConflictError(STOCK);
      });
      const stored = await getOutboxItem(queued.id);
      expect(stored?.status).toBe("conflict");
      await markOutbox(queued.id, { stock_restored: true });

      const retried = await resolveConflictAsOwner({
        ownerKey: "merchant-a",
        id: queued.id,
        action: "retry",
        note: "Restocked",
        pin: "1234",
      });
      expect(retried.status).toBe("pending");
      expect(retried.idempotency_key).toBe("retry-key");
      expect(retried.payload.local_stock_adjusted).toBe(true);
      expect((await db.inventory_items.get(item.id))?.quantity).toBe(0);
      const again = await resolveConflictAsOwner({
        ownerKey: "merchant-a",
        id: queued.id,
        action: "retry",
        note: "again",
        pin: "1234",
      });
      expect(again.resolution_log).toHaveLength(1);
      expect((await db.inventory_items.get(item.id))?.quantity).toBe(0);
    });

    it("does not retry a sale when restored stock is still short", async () => {
      await shop("0788111007", "Short Shop");
      const item = await addInventoryItem({
        item_name: "Amata",
        quantity: 0,
        cost_price: 500,
        selling_price: 1000,
      });
      const queued = await enqueueOutbox({
        operation: "create_sale_order",
        owner_key: "merchant-a",
        idempotency_key: "short-key",
        payload: {
          ...payload,
          local_stock_adjusted: true,
          items: [{ inventory_item_id: item.id, item_name: "Amata", quantity: 2, unit_price: 1000 }],
        },
      });
      await drainOutbox("merchant-a", async () => {
        throw new OutboxConflictError(STOCK);
      });
      await markOutbox(queued.id, { stock_restored: true });
      await expect(
        resolveConflictAsOwner({
          ownerKey: "merchant-a",
          id: queued.id,
          action: "retry",
          note: "try",
          pin: "1234",
        })
      ).rejects.toThrow(/ntibuhagije/);
      expect((await getOutboxItem(queued.id))?.status).toBe("conflict");
      expect((await db.inventory_items.get(item.id))?.quantity).toBe(0);
    });
  });

  describe("shop-wide MoMo references", () => {
    it("classifies same-debt, cross-debt, case, and blank references", () => {
      const rows = [
        { debt_id: "d1", payment_method: "momo", reference_number: " AB12 " },
      ];
      expect(
        paymentReferenceConflict(rows, { debtId: "d1", method: "momo", reference: "ab12" })
      ).toBe("same-debt");
      expect(
        paymentReferenceConflict(rows, { debtId: "d2", method: "momo", reference: "ab12" })
      ).toBe("shop-momo");
      expect(
        paymentReferenceConflict(rows, { debtId: "d2", method: "momo", reference: "other" })
      ).toBeNull();
      expect(
        paymentReferenceConflict(rows, { debtId: "d2", method: "cash", reference: "  " })
      ).toBeNull();
      expect(
        paymentReferenceConflict([], { debtId: "d2", method: "cash", reference: null })
      ).toBeNull();
    });

    it("rejects reuse across debts and allows cash without a reference", async () => {
      await shop("0788111008", "MoMo Shop");
      const first = await credit("Debt One");
      const second = await credit("Debt Two");
      await recordPayment({
        debtId: first.debtId,
        amount: 1000,
        paymentMethod: "momo",
        referenceNumber: "  AB12 ",
      });
      await expect(
        recordPayment({
          debtId: first.debtId,
          amount: 1000,
          paymentMethod: "momo",
          referenceNumber: "ab12",
        })
      ).rejects.toThrow(SAME_DEBT_REFERENCE_ERROR);
      await expect(
        recordPayment({
          debtId: second.debtId,
          amount: 1000,
          paymentMethod: "momo",
          referenceNumber: "ab12",
        })
      ).rejects.toThrow(SHOP_MOMO_REFERENCE_ERROR);
      await recordPayment({
        debtId: second.debtId,
        amount: 1000,
        paymentMethod: "momo",
        referenceNumber: "ZX-9",
      });
      await recordPayment({
        debtId: first.debtId,
        amount: 1000,
        paymentMethod: "cash",
      });
      await recordPayment({
        debtId: first.debtId,
        amount: 1000,
        paymentMethod: "cash",
        referenceNumber: "   ",
      });
      const payments = await db.payments.toArray();
      expect(payments.filter((row) => row.payment_method === "momo")).toHaveLength(2);
      expect(payments.filter((row) => row.payment_method === "cash")).toHaveLength(2);
    });

    it("keeps an idempotent replay from creating a second payment", async () => {
      await shop("0788111009", "Replay Shop");
      const { debtId } = await credit("Replay");
      const key = "pay-key-1";
      const first = await recordPayment({
        debtId,
        amount: 1500,
        paymentMethod: "momo",
        referenceNumber: "MM-1",
        idempotencyKey: key,
      });
      const second = await recordPayment({
        debtId,
        amount: 1500,
        paymentMethod: "momo",
        referenceNumber: "mm-1",
        idempotencyKey: key,
      });
      expect(second.id).toBe(first.id);
      expect(await db.payments.count()).toBe(1);
    });

    it("lets only one of two concurrent reuses succeed", async () => {
      await shop("0788111010", "Race Shop");
      const first = await credit("Race One");
      const second = await credit("Race Two");
      const results = await Promise.allSettled([
        recordPayment({
          debtId: first.debtId,
          amount: 1000,
          paymentMethod: "momo",
          referenceNumber: "CONC1",
        }),
        recordPayment({
          debtId: second.debtId,
          amount: 1000,
          paymentMethod: "momo",
          referenceNumber: "conc1",
        }),
      ]);
      expect(results.filter((row) => row.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((row) => row.status === "rejected")).toHaveLength(1);
      const momo = (await db.payments.toArray()).filter((row) => row.payment_method === "momo");
      expect(momo).toHaveLength(1);
    });

    it("allows the same MoMo reference in a different shop", async () => {
      const shopA = await shop("0788111011", "Shop A");
      const first = await credit("Shop A debt");
      await recordPayment({
        debtId: first.debtId,
        amount: 1000,
        paymentMethod: "momo",
        referenceNumber: "SHARED",
      });
      await shop("0788111012", "Shop B");
      const second = await credit("Shop B debt");
      await recordPayment({
        debtId: second.debtId,
        amount: 1000,
        paymentMethod: "momo",
        referenceNumber: "shared",
      });
      await setSession(shopA.id);
      const visible = await db.payments.filter((row) => row.profile_id === shopA.id).toArray();
      expect(visible).toHaveLength(1);
      const all = await db.payments.toArray();
      expect(all.filter((row) => row.payment_method === "momo")).toHaveLength(2);
    });
  });

  it("keeps the unapplied migration from restoring direct debt deletes", () => {
    const sql = readFileSync(
      "supabase/migrations/20261119210000_owner_debt_delete_and_momo_ref.sql",
      "utf8"
    );
    expect(sql).toContain("payments_shop_momo_reference_uidx");
    expect(sql).toContain("delete_debt_owner");
    expect(sql).toContain("DROP POLICY IF EXISTS debts_tenant");
    expect(sql).not.toContain("FOR DELETE");
  });
});
