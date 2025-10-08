import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isSubscriptionExpired } from "@/lib/entitlements";
import { isAppUnlocked } from "@/lib/appUnlock";

const OPEN_PATHS = new Set([
  "/",
  "/subscribe",
  "/billing",
  "/account",
  "/terms",
  "/privacy",
  "/forgot-password",
  "/reset-password",
  "/install",
]);

/** Routes that never require an authenticated+unlocked session. */
const PUBLIC_PATHS = new Set([
  "/",
  "/terms",
  "/privacy",
  "/forgot-password",
  "/reset-password",
  "/install",
]);

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, subscription, mode, canWrite } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen sella-hero-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const path = location.pathname;
  const unlocked = isAppUnlocked();

  // App-wide PIN gate: persisted session alone is not enough
  if (!PUBLIC_PATHS.has(path) && (!isAuthenticated || !unlocked)) {
    return <Navigate to="/" replace state={{ from: path }} />;
  }

  if (!isAuthenticated && !OPEN_PATHS.has(path)) {
    return <Navigate to="/" replace />;
  }

  const expired =
    isAuthenticated && mode === "cloud" && isSubscriptionExpired(subscription);

  if (expired && !canWrite && !OPEN_PATHS.has(path) && path !== "/debts") {
    const mutationPaths = [
      "/add-debt",
      "/new-sale",
      "/clients",
      "/inventory",
      "/import-customers",
      "/import-inventory",
      "/sales",
    ];
    if (mutationPaths.some((p) => path.startsWith(p))) {
      return <Navigate to="/subscribe" replace state={{ from: path }} />;
    }
  }

  // No sticky trial/expired banner — status stays on Dashboard / Subscribe only.
  return <>{children}</>;
}
