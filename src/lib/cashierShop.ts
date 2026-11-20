import type { SubscriptionSnapshot } from "@/lib/entitlements";

export type CashierShopProfile = {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string | null;
  phone: string;
  phone_normalized: string;
  shop_code?: string | null;
  currency: string;
  role: string;
  is_superadmin: boolean;
};

export type ShopLookup = {
  business_name?: string | null;
  owner_name?: string | null;
  owner_id?: string | null;
  shop_code?: string | null;
  has_write_access?: boolean | null;
};

/** A cashier must not read the owner's profile or subscription row. */
export function isCashierIdentity(input: {
  email?: string | null;
  appRole?: string | null;
}): boolean {
  if (input.appRole === "cashier") return true;
  return (input.email ?? "").toLowerCase().endsWith("@staff.sella.app");
}

export function profileFromShopLookup(
  lookup: ShopLookup | null,
  shopCode: string,
  fallbackOwnerId: string
): CashierShopProfile {
  const ownerId = lookup?.owner_id || fallbackOwnerId;
  return {
    id: ownerId,
    user_id: ownerId,
    business_name: lookup?.business_name || "Iduka",
    owner_name: lookup?.owner_name || null,
    phone: "",
    phone_normalized: "",
    shop_code: lookup?.shop_code || shopCode,
    currency: "RWF",
    role: "cashier",
    is_superadmin: false,
  };
}

/** A yes/no write flag, with no billing dates or payment history. */
export function subscriptionFromWriteAccess(
  ownerId: string,
  canWrite: boolean,
  now = new Date()
): SubscriptionSnapshot {
  const days = canWrite ? 1 : -(3 + 1);
  const end = new Date(now.getTime() + days * 86400000).toISOString();
  return {
    workspaceId: `user:${ownerId}`,
    userId: ownerId,
    status: canWrite ? "active" : "expired",
    provider: "manual",
    priceRwf: 0,
    trialEndsAt: null,
    currentPeriodEnd: end,
    cancelAtPeriodEnd: false,
  };
}
