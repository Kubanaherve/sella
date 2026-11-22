import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isSubscriptionExpired } from "@/lib/entitlements";
import { isAppUnlocked } from "@/lib/appUnlock";
import { isMarketingPath } from "@/lib/site";
import { isNativeApp } from "@/lib/platform";
import { ProMembershipNotice } from "@/components/ProMembershipNotice";

const OPEN_PATHS = new Set([
  "/",
  "/app",
  "/login",
  "/signup",
  "/subscribe",
  "/billing",
  "/account",
  "/settings",
  "/notifications",
  "/terms",
  "/privacy",
  "/support",
  "/contact",
  "/docs",
  "/delete-account",
  "/forgot-password",
  "/reset-password",
  "/install",
  "/marketplace",
  "/orders",
]);

/** Routes that never require an authenticated+unlocked session. */
const PUBLIC_PATHS = new Set([
  "/",
  "/app",
  "/login",
  "/signup",
  "/subscribe",
  "/billing",
  "/account",
  "/settings",
  "/support",
  "/contact",
  "/terms",
  "/privacy",
  "/docs",
  "/delete-account",
  "/forgot-password",
  "/reset-password",
  "/install",
  "/marketplace",
  "/orders",
]);

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, subscription, mode, canWrite } = useAuth();
  const location = useLocation();

  const path = location.pathname;
  const marketing = isMarketingPath(path);
  const isMarketplace = path === "/marketplace" || path.startsWith("/store/") || path.startsWith("/orders");
  const isPublic = PUBLIC_PATHS.has(path) || marketing || isMarketplace;
  const isOpen = OPEN_PATHS.has(path) || marketing || isMarketplace;

  if (isLoading && !isPublic) {
    return (
      <div className="min-h-screen sella-hero-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6FFF]/25 border-t-[#1A6FFF] rounded-full animate-spin" />
      </div>
    );
  }
  const unlocked = isAppUnlocked();

  // App-wide PIN gate: persisted session alone is not enough
  if (!isPublic && (!isAuthenticated || !unlocked)) {
    return <Navigate to="/" replace state={{ from: path }} />;
  }

  if (!isAuthenticated && !isOpen) {
    return <Navigate to="/" replace />;
  }

  const expired =
    isAuthenticated && mode === "cloud" && isSubscriptionExpired(subscription);

  if (expired && !canWrite && !isOpen && path !== "/debts") {
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
      if (isNativeApp()) {
        return (
          <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex items-center justify-center p-6">
            <ProMembershipNotice />
          </div>
        );
      }
      return <Navigate to="/subscribe" replace state={{ from: path }} />;
    }
  }

  // No sticky trial/expired banner — status stays on Dashboard / Subscribe only.
  return <>{children}</>;
}
