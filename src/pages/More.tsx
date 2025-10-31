import { useNavigate } from "react-router-dom";
import {
  Users,
  Bell,
  CreditCard,
  UserCircle,
  Download,
  Shield,
  LogOut,
  ChevronRight,
  FileText,
  MessageCircle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { showWebOnlyTools } from "@/lib/platform";
import { hapticLight } from "@/lib/haptics";
import { accessLabel } from "@/lib/entitlements";
import { BrandMark } from "@/components/BrandMark";
import { labels } from "@/lib/kinyarwanda";

const MorePage = () => {
  const navigate = useNavigate();
  const { profile, logout, subscription, mode, isSuperAdmin, canWrite } = useAuth();

  const shopName =
    (profile && "business_name" in profile && profile.business_name) ||
    (profile && "display_name" in profile && profile.display_name) ||
    "Sella";
  const shopCode =
    profile && "shop_code" in profile && profile.shop_code
      ? String(profile.shop_code)
      : null;

  const rows: Array<{
    icon: typeof Users;
    label: string;
    hint?: string;
    path?: string;
    onClick?: () => void;
    danger?: boolean;
    hide?: boolean;
  }> = [
    {
      icon: MessageCircle,
      label: labels.assistantRow,
      hint: labels.assistantHint,
      path: "/assistant",
    },
    {
      icon: Users,
      label: labels.clientsRow,
      hint: labels.clientsHint,
      path: "/clients",
    },
    {
      icon: Bell,
      label: labels.inboxRow,
      hint: labels.inboxHint,
      path: "/inbox",
    },
    {
      icon: CreditCard,
      label: labels.billingRow,
      hint: accessLabel(subscription),
      path: "/subscribe",
    },
    {
      icon: UserCircle,
      label: labels.accountRow,
      hint: labels.accountHint,
      path: "/account",
    },
    {
      icon: FileText,
      label: labels.receiptRow,
      hint: labels.receiptHint,
      path: "/receipt-settings",
    },
    {
      icon: Download,
      label: labels.installRow,
      hint: labels.installHint,
      path: "/install",
      hide: !showWebOnlyTools(),
    },
    {
      icon: FileText,
      label: labels.importRow,
      hint: labels.importHint,
      path: "/import-customers",
      hide: !showWebOnlyTools() || !canWrite,
    },
    {
      icon: Download,
      label: labels.importInventoryRow,
      hint: labels.importInventoryHint,
      path: "/import-inventory",
      hide: !canWrite,
    },
    {
      icon: Shield,
      label: "Admin payments",
      path: "/admin/payments",
      hide: !isSuperAdmin,
    },
    {
      icon: LogOut,
      label: labels.signOut,
      danger: true,
      onClick: async () => {
        await logout();
        navigate("/");
      },
    },
  ];

  return (
    <div className="sella-page">
      <PageHeader title={labels.moreTitle} subtitle={labels.moreSubtitle} hideBack />

      <div className="sella-page-body space-y-4">
        <div className="sella-list-card p-4 flex items-center gap-3">
          <BrandMark variant="icon" size="md" />
          <div className="min-w-0">
            <p className="font-bold truncate">{shopName}</p>
            {shopCode && (
              <p className="text-[11px] text-primary font-semibold tracking-wider">
                {shopCode}
              </p>
            )}
            {mode === "cloud" && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {accessLabel(subscription)}
              </p>
            )}
          </div>
        </div>

        <div className="sella-list-card p-0 divide-y divide-border/60">
          {rows
            .filter((r) => !r.hide)
            .map((row) => {
              const Icon = row.icon;
              return (
                <button
                  key={row.label}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-muted/50 transition-colors"
                  onClick={() => {
                    void hapticLight();
                    if (row.onClick) void row.onClick();
                    else if (row.path) navigate(row.path);
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      row.danger ? "bg-rose-50 text-rose-600" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        row.danger ? "text-rose-600" : ""
                      }`}
                    >
                      {row.label}
                    </p>
                    {row.hint && (
                      <p className="text-[11px] text-muted-foreground truncate">{row.hint}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </button>
              );
            })}
        </div>

        <p className="text-center text-[11px] text-muted-foreground pb-2">
          {labels.madeForRwanda}
        </p>
      </div>
    </div>
  );
};

export default MorePage;
