import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CreditCard,
  Download,
  FileText,
  Home,
  List,
  MessageCircle,
  Package,
  Receipt,
  Shield,
  AlertTriangle,
  TrendingUp,
  Upload,
  UserCircle,
  Users,
} from "lucide-react";
import { labels } from "@/lib/kinyarwanda";

export type DesktopNavGroup = "work" | "people" | "shop";

export type DesktopNavItem = {
  id: string;
  to: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: DesktopNavGroup;
  /** Shown in the command palette and shortcut help. */
  keys?: string;
  keywords?: string;
  webOnly?: boolean;
  writeOnly?: boolean;
  superAdmin?: boolean;
  /** Also highlight this item for these path prefixes. */
  alsoActive?: string[];
};

export const DESKTOP_GROUPS: { id: DesktopNavGroup; label: string }[] = [
  { id: "work", label: "Akazi" },
  { id: "people", label: "Abantu" },
  { id: "shop", label: "Shop" },
];

export const DESKTOP_NAV: DesktopNavItem[] = [
  {
    id: "home",
    to: "/dashboard",
    label: labels.home,
    hint: "Imibare y'uyu munsi",
    icon: Home,
    group: "work",
    keys: "⌘1",
    keywords: "home dashboard ahabanza",
  },
  {
    id: "debts",
    to: "/debts",
    label: labels.debtsTab,
    hint: "Ideni ritarishyurwa",
    icon: List,
    group: "work",
    keys: "⌘2",
    keywords: "debt credit ideni list",
  },
  {
    id: "sales",
    to: "/sales",
    label: labels.salesTab,
    hint: "Raporo y'amafaranga",
    icon: TrendingUp,
    group: "work",
    keys: "⌘3",
    keywords: "sales money report amafaranga",
  },
  {
    id: "inventory",
    to: "/inventory",
    label: labels.stockTab,
    hint: labels.inventorySubtitle,
    icon: Package,
    group: "work",
    keys: "⌘4",
    keywords: "stock inventory ububiko products",
  },
  {
    id: "conflicts",
    to: "/sync-conflicts",
    label: "Sales zitegereje",
    hint: "Conflict zo gusuzuma",
    icon: AlertTriangle,
    group: "work",
    keywords: "conflict outbox sync stock review",
  },
  {
    id: "clients",
    to: "/clients",
    label: labels.clientsRow,
    hint: labels.clientsHint,
    icon: Users,
    group: "people",
    keys: "⌘5",
    keywords: "customers clients abakiriya",
  },
  {
    id: "staff",
    to: "/staff",
    label: "Abakozi",
    hint: "Gucunga abacuruzi na PIN",
    icon: Users,
    group: "people",
    keys: "⌘6",
    keywords: "staff cashiers abakozi employees pin",
  },
  {
    id: "inbox",
    to: "/inbox",
    label: labels.inboxRow,
    hint: labels.inboxHint,
    icon: Bell,
    group: "people",
    keywords: "inbox alerts ubutumwa notifications",
  },
  {
    id: "assistant",
    to: "/assistant",
    label: labels.assistantRow,
    hint: labels.assistantHint,
    icon: MessageCircle,
    group: "people",
    keywords: "chatsella assistant ai",
  },
  {
    id: "billing",
    to: "/subscribe",
    label: labels.billingRow,
    hint: "Plan na MoMo",
    icon: CreditCard,
    group: "shop",
    keywords: "billing subscribe plan payment momo",
  },
  {
    id: "account",
    to: "/account",
    label: labels.accountRow,
    hint: labels.accountHint,
    icon: UserCircle,
    group: "shop",
    keywords: "account pin konti profile",
  },
  {
    id: "receipts",
    to: "/receipt-settings",
    label: labels.receiptRow,
    hint: labels.receiptHint,
    icon: Receipt,
    group: "shop",
    keywords: "receipt resi pdf print",
  },
  {
    id: "notifications",
    to: "/notifications",
    label: "Notifications",
    hint: "Amakuru ya system",
    icon: Bell,
    group: "shop",
    keywords: "notifications push",
  },
  {
    id: "import-customers",
    to: "/import-customers",
    label: labels.importRow,
    hint: labels.importHint,
    icon: Upload,
    group: "shop",
    webOnly: true,
    writeOnly: true,
    keywords: "import customers json",
  },
  {
    id: "import-inventory",
    to: "/import-inventory",
    label: labels.importInventoryRow,
    hint: labels.importInventoryHint,
    icon: Download,
    group: "shop",
    writeOnly: true,
    keywords: "import inventory csv excel ububiko",
  },
  {
    id: "install",
    to: "/install",
    label: labels.installRow,
    hint: labels.installHint,
    icon: Download,
    group: "shop",
    webOnly: true,
    keywords: "install pwa phone",
  },
  {
    id: "more",
    to: "/more",
    label: labels.moreTitle,
    hint: labels.moreSubtitle,
    icon: FileText,
    group: "shop",
    keywords: "settings more ibindi theme",
  },
  {
    id: "admin",
    to: "/admin",
    label: "Admin dashboard",
    icon: Shield,
    group: "shop",
    superAdmin: true,
    keywords: "admin",
  },
  {
    id: "admin-payments",
    to: "/admin/payments",
    label: "Admin payments",
    icon: Shield,
    group: "shop",
    superAdmin: true,
    keywords: "admin payments",
  },
];

export type NavFlags = {
  isSuperAdmin: boolean;
  canWrite: boolean;
  webOnly: boolean;
};

export function visibleDesktopNav(flags: NavFlags): DesktopNavItem[] {
  return DESKTOP_NAV.filter((item) => {
    if (item.superAdmin && !flags.isSuperAdmin) return false;
    if (item.webOnly && !flags.webOnly) return false;
    if (item.writeOnly && !flags.canWrite) return false;
    return true;
  });
}

export function isNavActive(pathname: string, item: DesktopNavItem): boolean {
  if (pathname === item.to) return true;
  return (item.alsoActive ?? []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
