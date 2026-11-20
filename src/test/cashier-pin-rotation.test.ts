import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { handleOwnerResetCashierPin, type OwnerResetIO } from "@/server/staffApiHandler";
import {
  applyCashierPinRotation,
  staffLoginEmail,
  staffLoginPassword,
  type RotationPorts,
  type RotationStaff,
} from "../../supabase/functions/_shared/cashierPinRotation";

const phone = "+250788111222";
const shop = "SEL-MXA8TT";
const ownerId = "owner-a";

type AuthUser = { id: string; email: string; password: string; sessions: string[] };

function world(extra?: Partial<RotationStaff>) {
  const staff: RotationStaff & { current_session_id: string | null; pin_hash: string | null } = {
    id: "11111111-1111-4111-8111-111111111111",
    status: "active",
    owner_id: ownerId,
    shop_code: shop,
    name: "Claire",
    phone,
    phone_normalized: phone,
    auth_user_id: "cashier-auth",
    current_session_id: "session-old",
    pin_hash: "old-hash",
    ...extra,
  };
  const users: AuthUser[] = [
    {
      id: "cashier-auth",
      email: staffLoginEmail(shop, phone),
      password: staffLoginPassword("1111", phone),
      sessions: ["session-old"],
    },
  ];
  const state = { staff, users, failDelete: false, failPassword: false };
  const ports: RotationPorts = {
    async clearSession(staffId, owner) {
      if (state.staff.id !== staffId || state.staff.owner_id !== owner) return false;
      if (state.staff.status !== "active") return false;
      state.staff.current_session_id = null;
      return true;
    },
    async commitCredential({ staffId, ownerId: owner, authUserId, pinHash }) {
      if (state.staff.id !== staffId || state.staff.owner_id !== owner) return false;
      if (state.staff.status !== "active") return false;
      state.staff.auth_user_id = authUserId;
      state.staff.pin_hash = pinHash;
      state.staff.current_session_id = null;
      return true;
    },
    async findAuthUserById(id) {
      const user = state.users.find((row) => row.id === id);
      return user ? { id: user.id, email: user.email } : null;
    },
    async findAuthUserByEmail(email) {
      const user = state.users.find((row) => row.email === email);
      return user ? { id: user.id, email: user.email } : null;
    },
    async setPassword(id, password) {
      if (state.failPassword) throw new Error("password update failed");
      const user = state.users.find((row) => row.id === id);
      if (!user) throw new Error("missing user");
      user.password = password;
    },
    async createAuthUser(email, password) {
      const id = "created-auth";
      state.users.push({ id, email, password, sessions: [] });
      return { id };
    },
    async deleteSessions({ userId }) {
      if (state.failDelete) throw new Error("session revoke failed");
      const user = state.users.find((row) => row.id === userId);
      if (user) user.sessions = [];
    },
  };
  return { state, ports };
}

function canSignIn(users: AuthUser[], pin: string) {
  const email = staffLoginEmail(shop, phone);
  const password = staffLoginPassword(pin, phone);
  return users.some((user) => user.email === email && user.password === password);
}

const caller = { id: ownerId, email: "owner@shop.rw", appRole: null };
const profile = { user_id: ownerId, shop_code: shop };

describe("cashier credential rotation", () => {
  it("rejects the old PIN and accepts the new PIN, and drops the stored session", async () => {
    const { state, ports } = world();
    expect(canSignIn(state.users, "2222")).toBe(false);

    const result = await applyCashierPinRotation(
      { caller, profile, staff: state.staff, newPin: "2222", phoneE164: phone },
      ports
    );

    expect(result.ok).toBe(true);
    expect(canSignIn(state.users, "1111")).toBe(false);
    expect(canSignIn(state.users, "2222")).toBe(true);
    expect(state.users[0].sessions).toEqual([]);
    expect(state.staff.current_session_id).toBeNull();
    expect(state.staff.status).toBe("active");
  });

  it("does not change a deactivated cashier or another shop's cashier", async () => {
    const deactivated = world({ status: "deactivated" });
    const denied = await applyCashierPinRotation(
      { caller, profile, staff: deactivated.state.staff, newPin: "2222", phoneE164: phone },
      deactivated.ports
    );
    expect(denied.ok).toBe(false);
    expect(canSignIn(deactivated.state.users, "1111")).toBe(true);
    expect(deactivated.state.staff.status).toBe("deactivated");
    expect(deactivated.state.staff.current_session_id).toBe("session-old");

    const otherShop = world({ shop_code: "SEL-OTHER1" });
    const cross = await applyCashierPinRotation(
      { caller, profile, staff: otherShop.state.staff, newPin: "2222", phoneE164: phone },
      otherShop.ports
    );
    expect(cross.ok).toBe(false);
    expect(canSignIn(otherShop.state.users, "1111")).toBe(true);
  });

  it("refuses a cashier caller and keeps the previous password if the auth update fails", async () => {
    const { state, ports } = world();
    const cashier = await applyCashierPinRotation(
      {
        caller: { id: "cashier-auth", email: "a@staff.sella.app", appRole: "cashier" },
        profile,
        staff: state.staff,
        newPin: "2222",
        phoneE164: phone,
      },
      ports
    );
    expect(cashier.ok).toBe(false);
    expect(canSignIn(state.users, "1111")).toBe(true);

    state.failPassword = true;
    const failed = await applyCashierPinRotation(
      { caller, profile, staff: state.staff, newPin: "2222", phoneE164: phone },
      ports
    );
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.credentialRotated).toBe(false);
    expect(canSignIn(state.users, "1111")).toBe(true);
    expect(canSignIn(state.users, "2222")).toBe(false);
    expect(state.staff.current_session_id).toBeNull();
  });

  it("keeps the new PIN if session deletion fails, and a revoked session id no longer matches", async () => {
    const { state, ports } = world();
    state.failDelete = true;
    const result = await applyCashierPinRotation(
      { caller, profile, staff: state.staff, newPin: "3333", phoneE164: phone },
      ports
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.credentialRotated).toBe(true);
    expect(canSignIn(state.users, "1111")).toBe(false);
    expect(canSignIn(state.users, "3333")).toBe(true);
    expect(state.staff.current_session_id).toBeNull();
    expect(state.staff.current_session_id).not.toBe("session-old");
  });

  it("ends with one password after two overlapping resets", async () => {
    const { state, ports } = world();
    await Promise.all([
      applyCashierPinRotation(
        { caller, profile, staff: state.staff, newPin: "4444", phoneE164: phone },
        ports
      ),
      applyCashierPinRotation(
        { caller, profile, staff: state.staff, newPin: "5555", phoneE164: phone },
        ports
      ),
    ]);
    expect(canSignIn(state.users, "1111")).toBe(false);
    const winners = ["4444", "5555"].filter((pin) => canSignIn(state.users, pin));
    expect(winners).toHaveLength(1);
    expect(state.staff.current_session_id).toBeNull();
  });

  it("fails closed on a rate-limit outage and does not touch the password", async () => {
    let passwordWrites = 0;
    const { ports } = world();
    const io: OwnerResetIO = {
      rateLimit: async () => "unavailable",
      getCaller: async () => caller,
      getProfile: async () => profile,
      getStaff: async () => world().state.staff,
      ports: {
        ...ports,
        setPassword: async () => {
          passwordWrites += 1;
        },
      },
    };
    const unavailable = await handleOwnerResetCashierPin(
      { staffId: "11111111-1111-4111-8111-111111111111", newPin: "2222" },
      "owner-token",
      undefined,
      undefined,
      io
    );
    expect(unavailable.status).toBe(503);
    expect(unavailable.success).toBe(false);
    expect(passwordWrites).toBe(0);

    io.rateLimit = async () => "locked";
    const locked = await handleOwnerResetCashierPin(
      { staffId: "11111111-1111-4111-8111-111111111111", newPin: "2222" },
      "owner-token",
      undefined,
      undefined,
      io
    );
    expect(locked.status).toBe(429);
    expect(passwordWrites).toBe(0);
  });

  it("does not keep a service-role key in the server handler", () => {
    const src = readFileSync(resolve(process.cwd(), "src/server/staffApiHandler.ts"), "utf8");
    expect(src).not.toMatch(/sb_secret_/);
    expect(src).not.toMatch(/signOut\([^)]*"all"/);
    const edge = readFileSync(
      resolve(process.cwd(), "supabase/functions/owner-reset-cashier-pin/index.ts"),
      "utf8"
    );
    expect(edge).toContain("deleteAuthUserSessions");
    expect(edge).toContain("check_auth_rate_limit");
    expect(edge).not.toMatch(/signOut\(/);
  });
});
