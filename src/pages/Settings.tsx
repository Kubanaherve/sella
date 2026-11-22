import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  ShieldAlert,
  Trash2,
  Loader2,
  Save,
  CreditCard,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/integrations/supabase/client";
import { deleteAccountRemote } from "@/services/billing";
import { clearAppUnlock } from "@/lib/appUnlock";
import { removeRememberedAccount } from "@/lib/rememberedAccounts";
import { toast } from "sonner";
import { businessCategoryLabel } from "@/lib/businessCategories";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, user, logout, refreshProfile, mode } = useAuth();

  const [ownerName, setOwnerName] = useState(
    (profile && "owner_name" in profile && profile.owner_name) || ""
  );
  const [businessName, setBusinessName] = useState(
    (profile && "business_name" in profile && profile.business_name) || ""
  );

  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Self-Service Deletion Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const shopCode =
    profile && "shop_code" in profile && profile.shop_code
      ? String(profile.shop_code)
      : null;
  const phone =
    profile && "phone" in profile && profile.phone
      ? String(profile.phone)
      : profile && "phone_normalized" in profile && profile.phone_normalized
      ? String(profile.phone_normalized)
      : "";
  const email =
    user?.email || (profile && "email" in profile && profile.email) || "";
  const category =
    profile && "business_category" in profile && profile.business_category
      ? String(profile.business_category)
      : "general_merchandise";

  const handleCopyCode = () => {
    if (!shopCode) return;
    navigator.clipboard.writeText(shopCode);
    setCopiedCode(true);
    toast.success("Shop code copied to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !businessName.trim()) {
      toast.error("Please fill in both owner name and business name");
      return;
    }

    setSaving(true);
    try {
      const sb = getSupabase();
      const { data: authUser } = await sb.auth.getUser();
      if (!authUser.user) throw new Error("Authentication required");

      const { error } = await sb
        .from("profiles")
        .update({
          owner_name: ownerName.trim(),
          business_name: businessName.trim(),
        })
        .eq("user_id", authUser.user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Shop profile updated successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePermanentAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");

    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") {
      setDeleteError("Please type DELETE to confirm permanent erasure.");
      return;
    }

    setDeleting(true);
    try {
      if (mode === "cloud") {
        await deleteAccountRemote();
      } else {
        const { wipeAllBusinessData, logoutLocal } = await import("@/db/api");
        const { db } = await import("@/db/localDb");
        await wipeAllBusinessData();
        if (profile?.id) await db.profiles.delete(profile.id);
        await logoutLocal();
      }

      if (phone) removeRememberedAccount(String(phone));
      clearAppUnlock();
      await logout();

      toast.success("Account and all associated business data permanently erased.");
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Account deletion failed";
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] font-sans selection:bg-[#0F172A] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-[#E5E7EB]">/</span>
            <span className="text-sm font-bold text-[#0F172A]">Account Settings</span>
          </div>

          <Link
            to="/billing"
            className="text-xs font-semibold text-[#0F172A] bg-[#FAFAFA] hover:bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB] transition-colors flex items-center gap-1.5"
          >
            <CreditCard size={14} />
            <span>Billing Hub</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Account & Settings</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage your shop identity, profile credentials, and data privacy options.
          </p>
        </div>

        {!user && !profile && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-950">
            <div>
              <strong className="font-bold">Signed out:</strong> Please sign in with your phone or email to edit your shop profile and settings.
            </div>
            <Link
              to="/login"
              className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold rounded-lg shrink-0 shadow-xs"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Shop Information</h2>
              <p className="text-xs text-[#6B7280]">
                Public and administrative identity for your retail business.
              </p>
            </div>

            {shopCode && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase text-[#6B7280]">Shop Code</div>
                  <div className="text-sm font-mono font-bold text-[#0F172A]">{shopCode}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#6B7280] hover:text-[#111827] transition-colors"
                  aria-label="Copy shop code"
                >
                  {copiedCode ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">
                  Shop / Business Name
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3 text-[#6B7280]" size={16} />
                  <Input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="pl-10 h-11 text-sm bg-white border-[#E5E7EB] rounded-xl focus-visible:ring-1 focus-visible:ring-[#0F172A]"
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">
                  Owner / Manager Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-[#6B7280]" size={16} />
                  <Input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="pl-10 h-11 text-sm bg-white border-[#E5E7EB] rounded-xl focus-visible:ring-1 focus-visible:ring-[#0F172A]"
                    disabled={saving}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">
                  Registered Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-[#6B7280]" size={16} />
                  <Input
                    type="text"
                    value={phone}
                    disabled
                    className="pl-10 h-11 text-sm bg-[#FAFAFA] border-[#E5E7EB] rounded-xl text-[#6B7280]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-[#6B7280]" size={16} />
                  <Input
                    type="text"
                    value={email}
                    disabled
                    className="pl-10 h-11 text-sm bg-[#FAFAFA] border-[#E5E7EB] rounded-xl text-[#6B7280]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111827]">
                Commercial Sector / Category
              </label>
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-xs font-medium text-[#111827]">
                {businessCategoryLabel(category, "en")}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold h-10 px-5 rounded-xl shadow-xs"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving…</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save size={14} />
                    <span>Save Changes</span>
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Security & Access Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/receipt-settings"
            className="p-5 rounded-2xl border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] transition-colors space-y-1.5 block shadow-xs"
          >
            <div className="font-semibold text-sm text-[#0F172A]">Receipt Customization</div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Add your shop logo, footer note, and return policy for printed and digital receipts.
            </p>
          </Link>

          <Link
            to="/staff"
            className="p-5 rounded-2xl border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] transition-colors space-y-1.5 block shadow-xs"
          >
            <div className="font-semibold text-sm text-[#0F172A]">Staff & Cashier PINs</div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Add staff members and set 4-digit PINs for shift registers and cashiers.
            </p>
          </Link>
        </div>

        {/* Mandatory Self-Service Account Deletion Section (Apple & Google Compliant) */}
        <section className="bg-white rounded-2xl border border-red-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#0F172A]">Delete Account & Erase All Data</h2>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                In compliance with Apple App Store Guideline 5.1.1(v), Google Play Data Safety requirements, and Rwanda Law Nº 058/2021, you can permanently delete your shop account, authentication records, customer credit books, inventory, and sales history directly from this portal.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
            <strong>Warning:</strong> This action is permanent and immediate. Once deleted, all cloud ledgers, customer records, and receipt histories cannot be recovered.
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setDeleteConfirmationText("");
                setDeleteError("");
                setDeleteModalOpen(true);
              }}
              className="text-xs font-semibold h-10 px-4 rounded-xl gap-2"
            >
              <Trash2 size={14} />
              <span>Permanently Delete Account</span>
            </Button>
          </div>
        </section>
      </main>

      {/* Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 max-w-md w-full space-y-4 shadow-xl text-left">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <Trash2 size={18} />
                <span>Confirm Permanent Deletion</span>
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                This will delete your entire shop account (<strong>{businessName || "Shop"}</strong>), all client credit records, inventory items, and transaction logs.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {deleteError}
              </div>
            )}

            <form onSubmit={handlePermanentAccountDeletion} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">
                  Type <span className="font-mono text-red-600 font-bold">DELETE</span> to confirm:
                </label>
                <Input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  disabled={deleting}
                  className="h-11 text-sm bg-white border-[#E5E7EB] rounded-xl focus-visible:ring-1 focus-visible:ring-red-500 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                  className="text-xs border-[#E5E7EB] bg-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={deleting || deleteConfirmationText.trim().toUpperCase() !== "DELETE"}
                  className="text-xs font-semibold"
                >
                  {deleting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Erasing all data…</span>
                    </span>
                  ) : (
                    <span>Permanently Erase Everything</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
