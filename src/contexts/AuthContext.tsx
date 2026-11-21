import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { getSessionProfile, logoutLocal } from "@/db/api";
import type { Profile as LocalProfile } from "@/db/types";
import {
  getSupabase,
  hasSupabaseConfig,
  isCloudMode,
} from "@/integrations/supabase/client";
import {
  type SubscriptionSnapshot,
  type PaymentProvider,
  hasWriteAccess,
  getMonthlyPriceRwf,
} from "@/lib/entitlements";
import {
  isCashierIdentity,
  profileFromShopLookup,
  subscriptionFromWriteAccess,
  type ShopLookup,
} from "@/lib/cashierShop";
import { onAccountSwitch } from "@/lib/sessionIsolation";
import { setActiveWorkspaceId } from "@/db/workspaceSession";
import { clearAppUnlock, isAppUnlocked } from "@/lib/appUnlock";
import { isPaymentInProgress } from "@/services/billing";
import { toast } from "sonner";

export interface CloudProfile {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string | null;
  phone: string;
  phone_normalized: string;
  email?: string | null;
  email_verified?: boolean;
  national_id?: string | null;
  shop_code?: string | null;
  business_category?: string | null;
  currency: string;
  role: string;
  is_superadmin: boolean;
}

interface AuthContextType {
  mode: "local" | "cloud";
  isAuthenticated: boolean;
  user: { id: string; email?: string | null } | null;
  profile: LocalProfile | CloudProfile | null;
  workspaceId: string | null;
  subscription: SubscriptionSnapshot | null;
  canWrite: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  logout: () => Promise<void>;
  lockToPin: () => Promise<void>;
  setSessionFromTokens: (access: string, refresh: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapProvider(row: Record<string, unknown>): PaymentProvider {
  const raw = String(row.payment_provider || row.provider || "").toLowerCase();
  if (raw === "trial" || row.status === "trialing") return "trial";
  if (raw === "flutterwave") return "flutterwave";
  if (raw === "apple") return "apple";
  if (raw === "google_play" || raw === "google") return "google_play";
  if (raw === "manual") return "manual";
  if (raw === "paypack") return "paypack";
  return row.status === "trialing" ? "trial" : "paypack";
}

async function cashierShopCode(): Promise<string> {
  const { db } = await import("@/db/localDb");
  const staff = await db.staff.filter((row) => row.status === "active").first();
  return staff?.shop_code || "";
}

async function lookupShop(
  sb: ReturnType<typeof getSupabase>,
  shopCode: string
): Promise<ShopLookup | null> {
  if (!shopCode) return null;
  const { data, error } = await sb.rpc("get_shop_info_by_code", { p_shop_code: shopCode });
  if (error || !data || typeof data !== "object") return null;
  return data as ShopLookup;
}

function mapUserSub(row: Record<string, unknown> | null, userId: string): SubscriptionSnapshot | null {
  if (!row) return null;
  return {
    workspaceId: `user:${userId}`,
    userId,
    status: row.status as SubscriptionSnapshot["status"],
    planTier: row.plan_tier as SubscriptionSnapshot["planTier"],
    productPlan: row.product_plan === "pro" ? "pro" : row.product_plan === "normal" ? "normal" : undefined,
    provider: mapProvider(row),
    priceRwf: getMonthlyPriceRwf(),
    trialEndsAt: (row.trial_ends_at as string) || null,
    currentPeriodEnd: (row.current_period_end as string) || null,
    cancelAtPeriodEnd: !(row.auto_renew as boolean),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode = isCloudMode() && hasSupabaseConfig() ? "cloud" : "local";
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [profile, setProfile] = useState<LocalProfile | CloudProfile | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevUserId = useRef<string | null>(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setWorkspaceId(null);
    setSubscription(null);
    setActiveWorkspaceId(null);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (mode !== "cloud" || !user?.id) {
      if (mode === "local") return;
      setSubscription(null);
      return;
    }
    const sb = getSupabase();
    if (isCashierIdentity({ email: user.email })) {
      const shopCode = await cashierShopCode();
      const lookup = await lookupShop(sb, shopCode);
      const ownerId = lookup?.owner_id || user.id;
      setSubscription(subscriptionFromWriteAccess(ownerId, Boolean(lookup?.has_write_access)));
      return;
    }
    const { data } = await sb
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSubscription(mapUserSub(data, user.id));
  }, [mode, user?.id, user?.email]);

  const loadCloudSession = useCallback(
    async (sessionUser: User | null) => {
      // Locked app: never treat a restored session as authenticated
      if (sessionUser && !isAppUnlocked()) {
        clearAuthState();
        return;
      }

      const nextId = sessionUser?.id ?? null;
      if (prevUserId.current && nextId && prevUserId.current !== nextId) {
        onAccountSwitch(prevUserId.current, nextId);
      }
      prevUserId.current = nextId;

      if (!sessionUser) {
        clearAuthState();
        return;
      }

      const sb = getSupabase();
      setUser({ id: sessionUser.id, email: sessionUser.email });
      setWorkspaceId(`user:${sessionUser.id}`);
      setActiveWorkspaceId(`user:${sessionUser.id}`);

      const appRole = (sessionUser.app_metadata as { role?: unknown } | undefined)?.role;
      if (
        isCashierIdentity({
          email: sessionUser.email,
          appRole: typeof appRole === "string" ? appRole : null,
        })
      ) {
        const meta = sessionUser.user_metadata as { shop_code?: unknown } | undefined;
        const shopCode =
          typeof meta?.shop_code === "string" && meta.shop_code
            ? meta.shop_code
            : await cashierShopCode();
        const lookup = await lookupShop(sb, shopCode);
        const profile = profileFromShopLookup(lookup, shopCode, sessionUser.id);
        setProfile(profile);
        setSubscription(
          subscriptionFromWriteAccess(profile.user_id, Boolean(lookup?.has_write_access))
        );
        return;
      }

      const { data: prof } = await sb
        .from("profiles")
        .select("*")
        .eq("user_id", sessionUser.id)
        .maybeSingle();

      setProfile(prof as CloudProfile | null);

      const { data: sub } = await sb
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", sessionUser.id)
        .maybeSingle();
      setSubscription(mapUserSub(sub, sessionUser.id));
    },
    [clearAuthState]
  );

  const refreshProfile = useCallback(async () => {
    if (mode === "local") {
      if (!isAppUnlocked()) {
        clearAuthState();
        return;
      }
      const next = await getSessionProfile();
      setProfile(next);
      setUser(next ? { id: next.id } : null);
      const localWs = next ? `local:${next.id}` : null;
      setWorkspaceId(localWs);
      setActiveWorkspaceId(localWs);
      setSubscription(
        next
          ? {
              workspaceId: `local:${next.id}`,
              status: "active",
              provider: "manual",
              priceRwf: 0,
              trialEndsAt: null,
              currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
              cancelAtPeriodEnd: false,
            }
          : null
      );
      return;
    }

    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    await loadCloudSession(data.session?.user ?? null);
  }, [mode, loadCloudSession, clearAuthState]);

  const setSessionFromTokens = useCallback(
    async (access: string, refresh: string) => {
      const sb = getSupabase();
      const { data, error } = await sb.auth.setSession({
        access_token: access,
        refresh_token: refresh,
      });
      if (error) throw error;
      await loadCloudSession(data.user);
    },
    [loadCloudSession]
  );

  /** Lock to PIN dialer without wiping remembered shops. */
  const lockToPin = useCallback(async () => {
    clearAppUnlock();
    if (mode === "cloud" && hasSupabaseConfig()) {
      try {
        await getSupabase().auth.signOut({ scope: "local" });
      } catch {
        /* ignore */
      }
    } else {
      await logoutLocal();
    }
    prevUserId.current = null;
    clearAuthState();
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.assign("/");
    }
  }, [mode, clearAuthState]);

  const logout = useCallback(async () => {
    clearAppUnlock();
    const prev = prevUserId.current;
    if (mode === "cloud") {
      const sb = getSupabase();
      await sb.auth.signOut();
    } else {
      await logoutLocal();
    }
    // Soft logout — keep remembered accounts for PIN unlock
    if (prev) onAccountSwitch(prev, null);
    prevUserId.current = null;
    clearAuthState();
  }, [mode, clearAuthState]);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      try {
        if (mode === "cloud") {
          const sb = getSupabase();
          if (!isAppUnlocked()) {
            try {
              await withTimeout(sb.auth.signOut({ scope: "local" }), 4000);
            } catch {
              /* ignore */
            }
            clearAuthState();
          } else {
            const { data } = await withTimeout(sb.auth.getSession(), 4000);
            await loadCloudSession(data.session?.user ?? null);
          }
          const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
            void loadCloudSession(session?.user ?? null);
          });
          unsub = () => listener.subscription.unsubscribe();
        } else {
          if (!isAppUnlocked()) {
            await logoutLocal();
            clearAuthState();
          } else {
            await refreshProfile();
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => unsub?.();
  }, [mode, loadCloudSession, refreshProfile, clearAuthState]);

  // Resume / tab focus / native foreground: re-read entitlement (covers missed websocket or browser checkout)
  useEffect(() => {
    if (mode !== "cloud" || !user?.id) return;
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void refreshSubscription();
      }
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    let removeNativeListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app")
        .then(({ App }) => {
          const handle = App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) {
              void refreshSubscription();
            }
          });
          removeNativeListener = () => {
            handle.then((h) => h.remove()).catch(() => {});
          };
        })
        .catch(() => {});
    }

    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      if (removeNativeListener) removeNativeListener();
    };
  }, [mode, user?.id, refreshSubscription]);

  // Real-time unlock: webhook → user_subscriptions / billing_notifications
  useEffect(() => {
    if (mode !== "cloud" || !user?.id) return;
    const sb = getSupabase();
    const userId = user.id;

    const channel = sb
      .channel(`user-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = (payload.new || null) as Record<string, unknown> | null;
          if (row && row.user_id === userId) {
            setSubscription(mapUserSub(row, userId));
          } else {
            void refreshSubscription();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "billing_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as {
            kind?: string;
            title?: string;
            body?: string | null;
          };
          if (
            notif?.kind === "payment_success" ||
            notif?.kind === "subscription_activated"
          ) {
            toast.success(notif.title || "Kwishyura byagenze neza!", {
              description: notif.body || "Subscription yemejwe — wishimire gukoresha Sella.",
            });
            void refreshSubscription();
          } else if (
            notif?.kind === "payment_failed" ||
            notif?.kind === "payment_cancelled"
          ) {
            toast.error(notif.title || "Kwishyura ntibyakunze", {
              description: notif.body || undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [mode, user?.id, refreshSubscription]);

  // Native only: resume from background → PIN again (never wipe remembered shops)
  // Grace-period if a MoMo/Airtel USSD payment prompt or bank 3D-secure was active
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => Promise<void> } | undefined;
    let wasBackground = false;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) {
            wasBackground = true;
            return;
          }
          if (!wasBackground) return;
          wasBackground = false;

          void refreshSubscription();

          // If a payment or USSD prompt is in-flight, keep user in-session
          if (isPaymentInProgress()) return;

          void lockToPin();
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      void handle?.remove();
    };
  }, [lockToPin, refreshSubscription]);

  const isSuperAdmin =
    mode === "cloud" &&
    !!profile &&
    "is_superadmin" in profile &&
    Boolean(profile.is_superadmin);

  return (
    <AuthContext.Provider
      value={{
        mode,
        isAuthenticated: !!user && isAppUnlocked(),
        user,
        profile,
        workspaceId,
        subscription,
        canWrite: mode === "local" || hasWriteAccess(subscription),
        isSuperAdmin,
        isLoading,
        refreshProfile,
        refreshSubscription,
        logout,
        lockToPin,
        setSessionFromTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { User };
