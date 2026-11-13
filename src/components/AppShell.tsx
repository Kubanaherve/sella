import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  List,
  TrendingUp,
  Package,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";
import { useAuth } from "@/contexts/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PageTransition } from "@/components/PageTransition";
import { labels } from "@/lib/kinyarwanda";
import { useEffect, useState } from "react";
import { startOutboxSyncListener } from "@/services/outboxSync";

const TABS = [
  { to: "/dashboard", label: labels.home, icon: Home },
  { to: "/debts", label: labels.debtsTab, icon: List },
  { to: "/sales", label: labels.salesTab, icon: TrendingUp },
  { to: "/inventory", label: labels.stockTab, icon: Package },
  { to: "/more", label: labels.moreTab, icon: MoreHorizontal },
] as const;

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    startOutboxSyncListener();
  }, []);

  const immersive =
    location.pathname.startsWith("/add-debt") ||
    location.pathname.startsWith("/new-sale") ||
    location.pathname.startsWith("/subscribe");

  const hideFab =
    immersive ||
    location.pathname.startsWith("/import") ||
    location.pathname.startsWith("/assistant") ||
    location.pathname.startsWith("/debts") ||
    location.pathname.startsWith("/inventory");

  return (
    <div className="sella-app-shell">
      <OfflineBanner />
      <div
        className={cn(
          "sella-app-content",
          immersive && "sella-app-content-immersive"
        )}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>

      {!hideFab && canWrite && (
        <div className="sella-fab-wrap">
          {fabOpen && (
            <div className="sella-fab-menu">
              <button
                type="button"
                className="sella-fab-menu-item"
                onClick={() => {
                  setFabOpen(false);
                  void hapticLight();
                  navigate("/new-sale");
                }}
              >
                {labels.newSale}
              </button>
              <button
                type="button"
                className="sella-fab-menu-item"
                onClick={() => {
                  setFabOpen(false);
                  void hapticLight();
                  navigate("/sales");
                }}
              >
                {labels.viewSales}
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label={labels.quickActions}
            className={cn("sella-fab", fabOpen && "rotate-45")}
            onClick={() => {
              void hapticLight();
              setFabOpen((v) => !v);
            }}
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {!immersive && (
        <nav className="sella-tabbar" aria-label="Main">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => void hapticLight()}
              className={({ isActive }) =>
                cn("sella-tab", isActive && "sella-tab-active")
              }
            >
              <Icon size={21} strokeWidth={2.2} aria-hidden />
              <span className="truncate max-w-full px-0.5 leading-tight">{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
