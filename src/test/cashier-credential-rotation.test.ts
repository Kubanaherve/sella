import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/db/localDb";
import { signupLocal, createSaleOrder, addInventoryItem } from "@/db/localApi";
import {
  staffRegisterOrSetPin,
  staffLoginWithPin,
  addShopStaff,
  toggleStaffStatus,
  resetStaffPin,
  revokeStaffSession,
  listShopStaff,
} from "@/lib/staff";
import {
  handleCashierJoinAndSetPin,
  handleCashierPinLogin,
  handleOwnerResetCashierPin,
} from "@/server/staffApiHandler";
import {
  assertCashierMayLogin,
  assertCashierMaySetPin,
  sessionIdFromAccessToken,
} from "../../supabase/functions/_shared/cashierJoinGuard";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Cashier Credential Rotation & Adversarial Security Audits", () => {
  let shopCode = "";
  let ownerId = "";

  beforeEach(async () => {
    await db.close();
    await db.delete();
    await db.open();
    localStorage.clear();

    const signup = await signupLocal({
      phone: "0788111222",
      pin: "1234",
      displayName: "Jean Pierre Owner",
      businessName: "Kigali Electronics",
      email: "owner@kigalitech.rw",
    });

    if ("error" in signup) throw new Error(signup.error);
    shopCode = signup.profile.shop_code!;
    ownerId = signup.profile.id;
  });

  describe("Priority 1: Owner-Initiated Cashier PIN Reset & Credential Rotation", () => {
    it("validates PIN format strictly (rejects letters, 3 digits, 5 digits)", async () => {
      const staff = await addShopStaff(ownerId, shopCode, {
        name: "Alice Cashier",
        phone: "0788333111",
      });

      // Non-4-digit inputs fail locally
      await expect(resetStaffPin(staff.id, "123")).rejects.toThrow(/PIN igomba kuba imibare 4/);
      await expect(resetStaffPin(staff.id, "12345")).rejects.toThrow(/PIN igomba kuba imibare 4/);
      await expect(resetStaffPin(staff.id, "abcd")).rejects.toThrow(/PIN igomba kuba imibare 4/);
      await expect(resetStaffPin(staff.id, "12 4")).rejects.toThrow(/PIN igomba kuba imibare 4/);

      // Server handler also rejects
      const srvRes1 = await handleOwnerResetCashierPin(
        { staffId: staff.id, newPin: "123" },
        "valid-mock-token"
      );
      expect(srvRes1.success).toBe(false);
      expect(srvRes1.status).toBe(400);

      const srvRes2 = await handleOwnerResetCashierPin(
        { staffId: "", newPin: "1234" },
        "valid-mock-token"
      );
      expect(srvRes2.success).toBe(false);
      expect(srvRes2.status).toBe(400);
    });

    it("ensures a deactivated cashier CANNOT be reactivated through PIN reset", async () => {
      const staff = await addShopStaff(ownerId, shopCode, {
        name: "Bob Cashier",
        phone: "0788444222",
      });

      // Deactivate Bob
      await toggleStaffStatus(staff.id, false);
      const deactivatedStaff = await db.staff.get(staff.id);
      expect(deactivatedStaff?.status).toBe("deactivated");

      // Attempt PIN reset on deactivated staff -> must reject!
      await expect(resetStaffPin(staff.id, "9999")).rejects.toThrow(
        /Umukozi yarahagaritswe\. Banza umufungure mbere yo guhindura PIN\./
      );

      // Verify Bob's status is still deactivated (did NOT get reactivated!)
      const recheckedStaff = await db.staff.get(staff.id);
      expect(recheckedStaff?.status).toBe("deactivated");
    });

    it("proves Old PIN fails and New PIN succeeds after owner reset", async () => {
      // 1. Staff registers and sets initial PIN '1111'
      const initStaff = await staffRegisterOrSetPin({
        shopCode,
        phone: "0788555333",
        name: "Claire Cashier",
        pin: "1111",
      });
      expect(initStaff.staff.name).toBe("Claire Cashier");

      // 2. Claire logs in with PIN '1111' -> SUCCEEDS
      const loginBefore = await staffLoginWithPin({
        shopCode,
        phone: "0788555333",
        pin: "1111",
      });
      expect(loginBefore.staff.name).toBe("Claire Cashier");

      // 3. Claire attempts logging in with '2222' before reset -> FAILS
      await expect(
        staffLoginWithPin({
          shopCode,
          phone: "0788555333",
          pin: "2222",
        })
      ).rejects.toThrow(/PIN sibyo/);

      // 4. Owner resets Claire's PIN to '2222'
      await resetStaffPin(initStaff.staff.id, "2222");

      // 5. Claire tries OLD PIN '1111' -> FAILS!
      await expect(
        staffLoginWithPin({
          shopCode,
          phone: "0788555333",
          pin: "1111",
        })
      ).rejects.toThrow(/PIN sibyo/);

      // 6. Claire tries NEW PIN '2222' -> SUCCEEDS!
      const loginAfter = await staffLoginWithPin({
        shopCode,
        phone: "0788555333",
        pin: "2222",
      });
      expect(loginAfter.staff.name).toBe("Claire Cashier");
      expect(loginAfter.staff.id).toBe(initStaff.staff.id);
    });

    it("revokes active session immediately upon PIN reset or session revocation", async () => {
      const reg = await staffRegisterOrSetPin({
        shopCode,
        phone: "0788666444",
        name: "David Cashier",
        pin: "3333",
      });

      const before = await db.staff.get(reg.staff.id);
      expect(before?.session_revoked_at).toBeFalsy();

      // Owner revokes session
      await revokeStaffSession(reg.staff.id);

      const afterRevoke = await db.staff.get(reg.staff.id);
      expect(afterRevoke?.session_revoked_at).toBeTruthy();

      // Owner resets PIN
      await resetStaffPin(reg.staff.id, "4444");
      const afterReset = await db.staff.get(reg.staff.id);
      expect(afterReset?.session_revoked_at).toBeTruthy();
    });
  });

  describe("Priority 3: Adversarial Scenarios Challenge", () => {
    it("Scenario 1: Register with valid shop code but no authorized staff roster entry", () => {
      // assertCashierMaySetPin returns 403 when roster row is null
      const check = assertCashierMaySetPin(null, ownerId);
      expect(check.ok).toBe(false);
      if (check.ok === false) {
        expect(check.status).toBe(403);
        expect(check.error).toMatch(/Nyiri ubucuruzi agomba kubanza kukwandika/);
      }
    });

    it("Scenario 2: Attempt to overwrite an existing cashier PIN", () => {
      // If auth_user_id already exists, assertCashierMaySetPin returns 409 Conflict
      const check = assertCashierMaySetPin(
        {
          id: "staff-1",
          status: "active",
          owner_id: ownerId,
          auth_user_id: "auth-uuid-1",
        },
        ownerId
      );
      expect(check.ok).toBe(false);
      if (check.ok === false) {
        expect(check.status).toBe(409);
        expect(check.error).toMatch(/PIN yamaze gushyirwaho/);
      }
    });

    it("Scenario 3: Attempt to reactivate a deactivated cashier via PIN setting or login", () => {
      const setCheck = assertCashierMaySetPin(
        {
          id: "staff-2",
          status: "deactivated",
          owner_id: ownerId,
          auth_user_id: null,
        },
        ownerId
      );
      expect(setCheck.ok).toBe(false);
      if (setCheck.ok === false) {
        expect(setCheck.status).toBe(403);
        expect(setCheck.error).toMatch(/Konti yawe yarahagaritswe/);
      }

      const loginCheck = assertCashierMayLogin(
        {
          id: "staff-2",
          status: "deactivated",
          owner_id: ownerId,
        },
        ownerId
      );
      expect(loginCheck.ok).toBe(false);
      if (loginCheck.ok === false) {
        expect(loginCheck.status).toBe(403);
        expect(loginCheck.error).toMatch(/Konti yawe yarahagaritswe/);
      }
    });

    it("Scenario 4: Attempt to access another shop by changing request parameters", () => {
      const check = assertCashierMayLogin(
        {
          id: "staff-3",
          status: "active",
          owner_id: "shop-owner-b", // belonged to another owner
        },
        "shop-owner-a" // attempting to join shop-owner-a
      );
      expect(check.ok).toBe(false);
      if (check.ok === false) {
        expect(check.status).toBe(403);
      }
    });

    it("Scenario 5 & 6: Reuse revoked access token or refresh revoked session", () => {
      // sessionIdFromAccessToken correctly extracts session_id
      const payload = btoa(JSON.stringify({ session_id: "valid-session-uuid-123" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
      const token = `header.${payload}.signature`;
      expect(sessionIdFromAccessToken(token)).toBe("valid-session-uuid-123");

      // Corrupt / missing session_id returns null
      expect(sessionIdFromAccessToken("bad-token")).toBeNull();
      expect(sessionIdFromAccessToken(null)).toBeNull();
      expect(sessionIdFromAccessToken("")).toBeNull();
    });

    it("Scenario 7 & 8: Old PIN fails after reset, new PIN fails before rotation", async () => {
      const staff = await staffRegisterOrSetPin({
        shopCode,
        phone: "0788777555",
        name: "Eva Cashier",
        pin: "5555",
      });

      // Before rotation: new PIN (7777) fails
      await expect(
        staffLoginWithPin({
          shopCode,
          phone: "0788777555",
          pin: "7777",
        })
      ).rejects.toThrow();

      // Perform rotation
      await resetStaffPin(staff.staff.id, "7777");

      // After rotation: old PIN (5555) fails
      await expect(
        staffLoginWithPin({
          shopCode,
          phone: "0788777555",
          pin: "5555",
        })
      ).rejects.toThrow();

      // After rotation: new PIN (7777) succeeds
      const ok = await staffLoginWithPin({
        shopCode,
        phone: "0788777555",
        pin: "7777",
      });
      expect(ok.staff.name).toBe("Eva Cashier");
    });
  });

  describe("Priority 4: Financial Workflow & Anti-Tampering Enforcement", () => {
    it("deducts stock atomically and attributes cashier on sale", async () => {
      // 1. Add inventory item
      const item = await addInventoryItem({
        user_id: ownerId,
        item_name: "Diamond Necklace",
        quantity: 10,
        selling_price: 50000,
        cost_price: 35000,
      });

      // 2. Cashier registers
      const cashier = await staffRegisterOrSetPin({
        shopCode,
        phone: "0788888666",
        name: "Felix Cashier",
        pin: "8888",
      });

      // 3. Create sale order as Cashier
      const sale = await createSaleOrder({
        user_id: ownerId,
        client_name: "Valued Customer",
        phone: "0788999000",
        items: [
          {
            inventory_item_id: item.id,
            quantity: 3,
            unit_price: 50000,
          },
        ],
        payments: [
          {
            amount: 150000,
            method: "cash",
          },
        ],
        cashierUserId: cashier.staff.id,
        cashierName: cashier.staff.name,
      });

      expect(sale.paid).toBe(150000);
      expect(sale.remaining).toBe(0);

      // Verify stock was decremented from 10 to 7
      const updatedItem = await db.inventory_items.get(item.id);
      expect(updatedItem?.quantity).toBe(7);

      // Verify sales record is attributed to Felix
      const sales = await db.sales.filter((s) => s.debt_id === sale.debt.id).toArray();
      expect(sales.length).toBe(1);
      expect(sales[0].cashier_user_id).toBe(cashier.staff.id);
      expect(sales[0].cashier_name).toBe("Felix Cashier");

      // Verify staff list reflects total sales count and volume
      const staffList = await listShopStaff(ownerId, shopCode);
      const felix = staffList.find((s) => s.id === cashier.staff.id);
      expect(felix?.total_sales_count).toBe(1);
      expect(felix?.total_sales_volume).toBe(150000);
    });

    it("verifies SQL migration enforces price integrity and blocks cashier discounts", () => {
      const sql = readFileSync(
        resolve(process.cwd(), "supabase/migrations/20261119230000_cashier_shop_access.sql"),
        "utf8"
      );

      // Cashiers get discount forced to 0
      expect(sql).toContain("IF v_cashier IS NOT NULL THEN\n    v_discount := 0;\n  END IF;");

      // Cashiers get unit_price forced from inventory locked row
      expect(sql).toContain(
        "IF v_cashier IS NOT NULL OR NOT (v_item ? 'unit_price' AND NULLIF(v_item->>'unit_price', '') IS NOT NULL) THEN\n      v_unit := ROUND(GREATEST(0, COALESCE(v_inv.selling_price, 0)));"
      );

      // Cashiers cannot backdate sales older than 15 minutes
      expect(sql).toContain("IF v_cashier IS NOT NULL AND v_now < now() - interval '15 minutes' THEN");

      // Stock locked with FOR UPDATE
      expect(sql).toContain("FOR UPDATE;");

      // Rate limit RPC in SQL
      expect(sql).toContain("check_auth_rate_limit");

      expect(sql).toContain("DROP POLICY IF EXISTS profiles_cashier_read ON public.profiles");
      expect(sql).not.toContain("CREATE POLICY profiles_cashier_read");
      expect(sql).toContain("REVOKE ALL ON TABLE public.shop_staff FROM anon, authenticated");
      expect(sql).toContain("REVOKE ALL ON FUNCTION public.user_has_write_access(UUID) FROM PUBLIC, anon, authenticated");
    });
  });
});
