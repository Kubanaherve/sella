import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldAlert,
  UserX,
  UserCheck,
  Clock,
  TrendingUp,
  Receipt,
  Store,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCashierMode } from "@/hooks/useCashierMode";
import { useOwnerPin } from "@/hooks/useOwnerPin";
import { formatCurrency } from "@/lib/kinyarwanda";
import {
  listShopStaff,
  addShopStaff,
  toggleStaffStatus,
  resetStaffPin,
  revokeStaffSession,
} from "@/lib/staff";
import type { ShopStaff, StaffRole } from "@/db/types";
import { toast } from "sonner";

export const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isCashierMode } = useCashierMode();
  const { askOwnerPin, ownerPinDialog } = useOwnerPin();

  const [staffList, setStaffList] = useState<ShopStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<StaffRole>("cashier");
  const [submitting, setSubmitting] = useState(false);

  // PIN Reset Modal State
  const [resetModalStaff, setResetModalStaff] = useState<ShopStaff | null>(null);
  const [resetPinValue, setResetPinValue] = useState("");

  const shopCode =
    profile && "shop_code" in profile && profile.shop_code
      ? String(profile.shop_code)
      : "";
  const shopName =
    profile && "business_name" in profile && profile.business_name
      ? String(profile.business_name)
      : "Iduka";
  const ownerId = profile ? String(profile.id) : "";

  const loadStaff = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const data = await listShopStaff(ownerId, shopCode);
      setStaffList(data);
    } catch (e) {
      console.error("Error loading staff:", e);
      toast.error("Ntibyashobotse kubona urutonde rw'abakozi");
    } finally {
      setLoading(false);
    }
  }, [ownerId, shopCode]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const copyShopCode = () => {
    if (!shopCode) return;
    navigator.clipboard.writeText(shopCode);
    setCopiedCode(true);
    toast.success("Shop Code yakopiwemo neza!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Uzuza izina na telefone by'umukozi");
      return;
    }
    setSubmitting(true);
    try {
      await addShopStaff(ownerId, shopCode, {
        name: newName.trim(),
        phone: newPhone.trim(),
        role: newRole,
      });
      toast.success(
        `Umukozi ${newName.trim()} yongewemo! Azashyiraho PIN ye ubwo azaba yinjira.`
      );
      setNewName("");
      setNewPhone("");
      setAddModalOpen(false);
      await loadStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ntibyashobotse kongera umukozi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: ShopStaff) => {
    const nextActive = staff.status !== "active";
    const actionLabel = nextActive ? "gufungura" : "guhagarika";
    if (
      !confirm(
        `Wizeye neza ko ushaka ${actionLabel} umukozi witwa ${staff.name}?`
      )
    ) {
      return;
    }
    try {
      await toggleStaffStatus(staff.id, nextActive);
      toast.success(
        nextActive
          ? `Konti ya ${staff.name} yongeye gukora!`
          : `Konti ya ${staff.name} yahagaritswe!`
      );
      await loadStaff();
    } catch (e) {
      toast.error("Habaye ikosa mu guhindura status");
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStaff) return;
    if (!/^\d{4}$/.test(resetPinValue.trim())) {
      toast.error("PIN igomba kuba imibare 4");
      return;
    }
    setSubmitting(true);
    try {
      await resetStaffPin(resetModalStaff.id, resetPinValue.trim());
      toast.success(`PIN ya ${resetModalStaff.name} yahinduwe neza!`);
      setResetModalStaff(null);
      setResetPinValue("");
      await loadStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Habaye ikosa mu guhindura PIN");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeSession = async (staff: ShopStaff) => {
    if (
      !confirm(
        `Gusohora ${staff.name} ako kanya?\n\nKuri telefone ye azasohorwa ako kanya asabwe kongera kwinjira.`
      )
    ) {
      return;
    }
    try {
      await revokeStaffSession(staff.id);
      toast.success(`Session ya ${staff.name} yasheshwe ako kanya!`);
      await loadStaff();
    } catch (e) {
      toast.error("Habaye ikosa mu gusesa session");
    }
  };

  const formatLastActive = (iso: string | null) => {
    if (!iso) return "Ntarinjira";
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 2) return "Arakora ubu (Active now)";
      if (diffMins < 60) return `Iminota ${diffMins} ishize`;
      if (diffHours < 24) return `Amasaha ${diffHours} ashize`;
      if (diffDays === 1) return "Ejo hashize";
      return `${diffDays} iminsi ishize`;
    } catch {
      return "—";
    }
  };

  // If viewing in Cashier Mode, protect with Owner PIN
  if (isCashierMode) {
    return (
      <div className="sella-page flex flex-col items-center justify-center p-6 text-center space-y-4">
        {ownerPinDialog}
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold">Urupapuro rw'Umuyobozi</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Cashier Mode irakora. Ugomba gushyiramo PIN y'umuyobozi kugira ngo
          ufungure urupapuro rw'abakozi.
        </p>
        <Button
          onClick={async () => {
            const pin = await askOwnerPin(
              "PIN y'umuyobozi kugira ngo urebe abakozi"
            );
            if (!pin) return;
            navigate("/staff");
          }}
          className="btn-navy"
        >
          Injiza PIN y'Umuyobozi
        </Button>
      </div>
    );
  }

  const activeStaffCount = staffList.filter((s) => s.status === "active").length;
  const totalSalesRecorded = staffList.reduce(
    (sum, s) => sum + (s.total_sales_volume || 0),
    0
  );

  return (
    <div className="sella-page">
      {ownerPinDialog}
      <PageHeader
        title="Abakozi bo mu Iduka"
        subtitle={`${staffList.length} abakozi bose · ${activeStaffCount} bari ku kazi`}
        right={
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="btn-navy gap-1.5 h-9"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Ongera Umukozi</span>
          </Button>
        }
      />

      <div className="space-y-4 max-w-4xl mx-auto pb-12">
        {/* Shop Code Instruction Banner for Cashier Onboarding */}
        <div className="glass-card rounded-2xl p-4 border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-primary" />
              <p className="font-bold text-sm">Shop Code yo guha abakozi:</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Umukozi iyo amanuye Sella kuri telephone ye, yandikamo iyi Code agashyiraho PIN ye y'akazi.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-background/80 border border-border/80 px-3 py-1.5 rounded-xl">
            <code className="text-sm font-extrabold tracking-wider text-primary">
              {shopCode || "SEL-••••"}
            </code>
            <button
              type="button"
              onClick={copyShopCode}
              className="p-1 hover:text-primary transition-colors text-muted-foreground"
              title="Kopi Shop Code"
            >
              {copiedCode ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-3 border border-border/60">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users size={14} /> Abakozi bose
            </p>
            <p className="text-xl font-bold mt-1 tabular-nums">{staffList.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-3 border border-border/60">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={14} /> Abari ku kazi
            </p>
            <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
              {activeStaffCount}
            </p>
          </div>
          <div className="glass-card rounded-2xl p-3 border border-border/60 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp size={14} /> Amafaranga baciye
            </p>
            <p className="text-xl font-bold mt-1 text-primary tabular-nums">
              {formatCurrency(totalSalesRecorded)}
            </p>
          </div>
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin" />
            <span>Turi gushaka urutonde rw'abakozi…</span>
          </div>
        ) : staffList.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-3 border border-dashed border-border/80">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-base">Nta bakozi barongerwamo</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Kanda kuri <strong>"Ongera Umukozi"</strong> kugira ngo wandike umukozi wemerewe gucuruza mu iduka ryawe.
            </p>
            <Button
              onClick={() => setAddModalOpen(true)}
              size="sm"
              className="btn-navy gap-1.5"
            >
              <UserPlus size={15} /> Ongera Umukozi wa Mbere
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map((staff) => {
              const isActive = staff.status === "active";
              return (
                <div
                  key={staff.id}
                  className={`glass-card rounded-2xl p-4 border transition-all ${
                    isActive
                      ? "border-border/60 hover:border-primary/40"
                      : "border-rose-300/40 bg-rose-50/20 opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Avatar + Details */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-foreground">{staff.name}</p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isActive
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                            }`}
                          >
                            {isActive ? "Ku Kazi (Active)" : "Yahagaritswe"}
                          </span>
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground capitalize">
                            {staff.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{staff.phone}</p>
                        <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 pt-1">
                          <Clock size={12} />
                          <span>Last active: {formatLastActive(staff.last_active_at)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Middle: Sales Performance */}
                    <div className="sm:text-right bg-background/50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                      <p className="text-[11px] text-muted-foreground flex items-center sm:justify-end gap-1">
                        <Receipt size={12} />
                        <span>Sales bakoze</span>
                      </p>
                      <p className="text-sm font-extrabold text-foreground tabular-nums">
                        {formatCurrency(staff.total_sales_volume || 0)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {staff.total_sales_count || 0} igurisha ryose
                      </p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-end gap-2 flex-wrap">
                    {/* Reset PIN */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!isActive}
                      onClick={() => {
                        if (!isActive) return;
                        setResetModalStaff(staff);
                        setResetPinValue("");
                      }}
                      className="h-8 text-xs gap-1 disabled:opacity-50"
                      title={!isActive ? "Banza ufungure umukozi mbere yo guhindura PIN" : "Hindura PIN"}
                    >
                      <KeyRound size={13} />
                      <span>Hindura PIN</span>
                    </Button>

                    {/* Revoke Session Immediately */}
                    {isActive && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleRevokeSession(staff)}
                        className="h-8 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-300"
                        title="Sohora umukozi kuri telephone ye ako kanya"
                      >
                        <ShieldAlert size={13} />
                        <span>Sohora Ako Kanya</span>
                      </Button>
                    )}

                    {/* Deactivate / Reactivate */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleToggleStatus(staff)}
                      className={`h-8 text-xs gap-1 ${
                        isActive
                          ? "border-rose-200 text-rose-700 hover:bg-rose-50 dark:text-rose-400"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
                      }`}
                    >
                      {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      <span>{isActive ? "Hagarika" : "Subizaho"}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add New Staff Member */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-md p-6 bg-card border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Ongera Umukozi</h3>
                  <p className="text-xs text-muted-foreground">{shopName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Izina ry'Umukozi *</label>
                <Input
                  required
                  placeholder="urugero: Aline Mutesi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Telefone y'Umukozi *</label>
                <Input
                  required
                  type="tel"
                  placeholder="0788..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Iyi nimero azayikoresha yinjira muri Sella na Shop Code yawe.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Inshingano (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as StaffRole)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
                >
                  <option value="cashier">Umucuruzi (Cashier - Kugurisha gusa)</option>
                  <option value="manager">Manager (Gucunga iduka)</option>
                </select>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">💡 Uko bishyiraho PIN:</p>
                <p>
                  Umukozi azashyiraho PIN ye y'akazi kuri telephone ye ubwo azaba yinjira akoresheje Shop Code <strong>{shopCode}</strong>.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
                  className="w-1/2 h-10"
                >
                  Reka
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 h-10 btn-navy"
                >
                  {submitting ? "Tegereza…" : "Emeza Umukozi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Staff PIN */}
      {resetModalStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-sm p-6 bg-card border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Hindura PIN y'Umukozi</h3>
                  <p className="text-xs text-muted-foreground">{resetModalStaff.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalStaff(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold">PIN Nshya (Imibare 4) *</label>
                <Input
                  required
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={resetPinValue}
                  onChange={(e) => setResetPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="h-11 text-center text-xl tracking-widest font-mono"
                />
                <p className="text-[11px] text-muted-foreground text-center">
                  Umukozi azakoresha iyi PIN nshya ubutaha yinjira.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetModalStaff(null)}
                  className="w-1/2 h-10"
                >
                  Reka
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || resetPinValue.length !== 4}
                  className="w-1/2 h-10 btn-navy"
                >
                  {submitting ? "Tegereza…" : "Hindura PIN"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
