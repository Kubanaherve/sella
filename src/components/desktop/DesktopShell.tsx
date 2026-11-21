import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronsRight, LogOut, PanelLeft, Plus, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useCashierMode } from "@/hooks/useCashierMode";
import { useOwnerPin } from "@/hooks/useOwnerPin";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PageTransition } from "@/components/PageTransition";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { labels } from "@/lib/kinyarwanda";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import { showWebOnlyTools } from "@/lib/platform";
import { startOutboxSyncListener } from "@/services/outboxSync";
import {
  DESKTOP_GROUPS,
  isNavActive,
  visibleDesktopNav,
} from "@/components/desktop/desktopNav";
import { CommandPalette, modLabel } from "@/components/desktop/CommandPalette";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SIDEBAR_KEY = "sella_sidebar_collapsed";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  );
}

export function DesktopShell() {
  useAppLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout, canWrite, isSuperAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { isCashierMode, enterCashierMode, exitCashierMode } = useCashierMode();
  const { askOwnerPin, ownerPinDialog } = useOwnerPin();

  const shopName =
    (profile && "business_name" in profile && profile.business_name) ||
    (profile && "display_name" in profile && profile.display_name) ||
    "Sella";
  const shopCode =
    profile && "shop_code" in profile && profile.shop_code
      ? String(profile.shop_code)
      : null;

  const nav = useMemo(
    () =>
      visibleDesktopNav({
        isSuperAdmin,
        canWrite,
        webOnly: showWebOnlyTools(),
      }),
    [isSuperAdmin, canWrite]
  );

  useEffect(() => {
    startOutboxSyncListener();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const typing = isTypingTarget(event.target);

      if (meta && key === "k") {
        event.preventDefault();
        setHelpOpen(false);
        setPaletteOpen(true);
        return;
      }
      if (meta && key === "n") {
        event.preventDefault();
        if (canWrite) navigate("/new-sale");
        return;
      }
      if (meta && key === "\\") {
        event.preventDefault();
        setCollapsed((value) => !value);
        return;
      }
      if (meta && ["1", "2", "3", "4", "5"].includes(event.key)) {
        const destination = {
          "1": "/dashboard",
          "2": "/debts",
          "3": "/sales",
          "4": "/inventory",
          "5": "/clients",
        }[event.key];
        if (destination) {
          event.preventDefault();
          navigate(destination);
        }
        return;
      }
      if (typing || meta || event.altKey) return;
      if (event.key === "/") {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (event.key === "?") {
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canWrite, navigate]);

  const mod = modLabel();

  return (
    <div className={cn("sella-desktop-root", collapsed && "is-collapsed")}>
      {ownerPinDialog}
      <a href="#sella-main" className="sella-skip-link">
        Simbuka ujye ku birimo
      </a>
      <aside className="sella-desktop-sidebar" aria-label="Main">
        <div className="sella-desktop-brand">
          <BrandMark variant="icon" size="sm" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">Sella</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {shopName}
              </p>
            </div>
          )}
        </div>

        {canWrite && (
          <button
            type="button"
            className="sella-desktop-new"
            title={labels.newSale}
            onClick={() => navigate("/new-sale")}
          >
            <Plus size={18} strokeWidth={2.4} />
            {!collapsed && <span>{labels.newSale}</span>}
            {!collapsed && <kbd className="sella-kbd sella-kbd-on-brand">{mod}N</kbd>}
          </button>
        )}

        <nav className="sella-desktop-nav">
          {DESKTOP_GROUPS.map((group) => {
            const items = nav.filter((item) => item.group === group.id);
            if (items.length === 0) return null;
            return (
              <div key={group.id} className="sella-desktop-group">
                {!collapsed && (
                  <p className="sella-desktop-group-label">{group.label}</p>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(location.pathname, item);
                  return (
                    <NavLink
                      key={item.id}
                      to={item.to}
                      end
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "sella-desktop-link",
                        active && "is-active"
                      )}
                    >
                      <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sella-desktop-sidebar-foot">
          {!collapsed && shopCode && (
            <p className="px-2 text-[11px] font-semibold tracking-wider text-primary">
              {shopCode}
            </p>
          )}
          <button
            type="button"
            className="sella-desktop-link sella-desktop-signout"
            onClick={() => {
              void logout().then(() => navigate("/"));
            }}
          >
            <LogOut size={18} />
            {!collapsed && <span>{labels.signOut}</span>}
          </button>
        </div>
      </aside>

      <div className="sella-desktop-column">
        <header className="sella-desktop-topbar">
          <button
            type="button"
            className="sella-icon-btn"
            aria-label={collapsed ? "Fungura menu" : "Funga menu"}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronsRight size={18} /> : <PanelLeft size={18} />}
          </button>
          <button
            type="button"
            className="sella-desktop-search"
            onClick={() => setPaletteOpen(true)}
          >
            <Search size={15} />
            <span>Shakisha cyangwa jya ahandi…</span>
            <kbd className="sella-kbd">{mod}K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  if (isCashierMode) {
                    const pin = await askOwnerPin(
                      "PIN y'umuyobozi kugira ngo usohoke muri Cashier Mode"
                    );
                    if (!pin) return;
                    const ok = await exitCashierMode(pin);
                    if (!ok) {
                      toast.error("PIN y'umuyobozi sibyo");
                      return;
                    }
                    toast.success("Muvuye muri Cashier Mode (Ububiko n'inyungu biragaragara)");
                  } else {
                    enterCashierMode();
                    toast.info("Mwinjiye muri Cashier Mode (Inyungu n'ibiciro byo kurangura bihishwe)");
                  }
                })();
              }}
              className={cn(
                "h-9 px-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all",
                isCashierMode
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/50"
                  : "sella-btn-glass"
              )}
              title={isCashierMode ? "Gukuraho Cashier Mode" : "Gushyiraho Cashier Mode"}
            >
              <ShieldCheck size={14} />
              <span>{isCashierMode ? "Cashier Mode" : "Owner"}</span>
            </button>
            <button
              type="button"
              className="sella-icon-btn text-sm font-semibold"
              aria-label="Ibikoresho by'ibuto"
              onClick={() => setHelpOpen(true)}
            >
              ?
            </button>
            <ThemeToggle compact className="h-9 w-9 rounded-xl" />
          </div>
        </header>
        <OfflineBanner />
        <div id="sella-main" className="sella-desktop-canvas">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={nav}
        canWrite={canWrite}
      />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ibikoresho by'ibuto</DialogTitle>
            <DialogDescription>
              Bikora igihe utari uri mu gice cyo kwandika.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {[
              [`${mod}K`, "Shakisha / command palette"],
              ["/", "Fungura command palette"],
              [`${mod}N`, labels.newSale],
              [`${mod}1–5`, "Ahabanza, Ideni, Amafaranga, Ububiko, Abakiriya"],
              [`${mod}\\`, "Funga cyangwa fungura menu"],
              ["?", "Iyi lisiti"],
            ].map(([keys, text]) => (
              <li key={keys} className="flex items-center justify-between gap-3">
                <span>{text}</span>
                <kbd className="sella-kbd">{keys}</kbd>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
