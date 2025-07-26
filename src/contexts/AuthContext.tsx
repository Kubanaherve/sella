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
import { onAccountSwitch } from "@/lib/sessionIsolation";
import { setActiveWorkspaceId } from "@/db/workspaceSession";
import { clearAppUnlock, isAppUnlocked } from "@/lib/appUnlock";

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

function mapUserSub(row: Record<string, unknown> | null, userId: string): SubscriptionSnapshot | null {
  if (!row) return null;
  return {
    workspaceId: `user:${userId}`,
    userId,
    status: row.status as SubscriptionSnapshot["status"],
    planTier: row.plan_tier as SubscriptionSnapshot["planTier"],
    provider: mapProvider(row),
    priceRwf: getMonthlyPriceRwf(),
    trialEndsAt: (row.trial_ends_at as string) || null,
    currentPeriodEnd: (row.current_period_end as string) || null,
    cancelAtPeriodEnd: !(row.auto_renew as boolean),
  };
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
    const { data } = await sb
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSubscription(mapUserSub(data, user.id));
  }, [mode, user?.id]);

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
              await sb.auth.signOut({ scope: "local" });
            } catch {
              /* ignore */
            }
            clearAuthState();
          } else {
            const { data } = await sb.auth.getSession();
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

  // Native only: resume from background → PIN again (never wipe remembered shops)
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
          void lockToPin();
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      void handle?.remove();
    };
  }, [lockToPin]);

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
