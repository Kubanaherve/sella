import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase, isCloudMode } from "@/integrations/supabase/client";
import { accessLabel } from "@/lib/entitlements";
import { deleteAccountRemote } from "@/services/billing";
import { ChangePinCard } from "@/components/ChangePinCard";
import { PageHeader } from "@/components/PageHeader";
import {
  wipeAllBusinessData,
  logoutLocal,
  factoryResetKeepClients,
  resetSalesMoney,
  setAppSetting,
} from "@/db/api";
import { db } from "@/db/localDb";
import { removeRememberedAccount } from "@/lib/rememberedAccounts";
import { toast } from "sonner";

const AccountPage = () => {
  const navigate = useNavigate();
  const { profile, subscription, logout, mode, refreshProfile, isSuperAdmin } = useAuth();
  const [fullName, setFullName] = useState(
    (profile && "owner_name" in profile && profile.owner_name) ||
      (profile && "display_name" in profile && profile.display_name) ||
      ""
  );
  const [busy, setBusy] = useState(false);

  const shopName =
    (profile && "business_name" in profile && profile.business_name) || null;
  const shopCode =
    (profile && "shop_code" in profile && profile.shop_code) || null;
  const email = (profile && "email" in profile && profile.email) || null;
  const phone =
    (profile && "phone" in profile && profile.phone) ||
    (profile && "phone_normalized" in profile && profile.phone_normalized) ||
    null;

  const saveProfile = async () => {
    if (mode !== "cloud") return toast.message("Profile edit is for cloud accounts");
    setBusy(true);
    try {
      const sb = getSupabase();
      const { data: user } = await sb.auth.getUser();
      if (!user.user) throw new Error("Not signed in");
      const { error } = await sb
        .from("profiles")
        .update({ owner_name: fullName.trim() })
        .eq("user_id", user.user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        "Ihanagure Konti n'Amakuru Yose?\n\nThis permanently deletes your account and all business data. This cannot be undone."
      )
    ) {
      return;
    }
    if (!confirm("Final confirmation: delete everything?")) return;
    setBusy(true);
    try {
      if (mode === "cloud" && isCloudMode()) {
        await deleteAccountRemote();
      } else if (profile?.id) {
        await wipeAllBusinessData();
        await db.profiles.delete(profile.id);
        await logoutLocal();
      }
      if (phone) removeRememberedAccount(String(phone));
      await logout();
      toast.success("Account deleted");
      navigate("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const runDangerous = async (label: string, fn: () => Promise<void>) => {
    if (!confirm(`${label}\n\nContinue?`)) return;
    setBusy(true);
    try {
      await fn();
      toast.success("Byakozwe");
      window.dispatchEvent(new CustomEvent("paymentMade"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sella-page">
      <PageHeader title="Account" subtitle="PIN, plan & shop data" backTo="/more" />
      <main className="sella-page-body space-y-4">
        <div className="glass-card rounded-2xl border border-border/60 p-4 space-y-1 text-sm">
          {shopName && <p className="font-semibold text-base">{shopName}</p>}
          {shopCode && (
            <p className="text-xs text-primary font-semibold tracking-wider">{shopCode}</p>
          )}
          {email && <p className="text-muted-foreground break-all">{email}</p>}
          {phone && <p className="text-muted-foreground">{phone}</p>}
        </div>

        <div className="glass-card rounded-2xl border border-border/60 p-4 space-y-2 text-sm">
          <p className="font-semibold">Subscription</p>
          <p>{accessLabel(subscription)}</p>
          <Button className="w-full" onClick={() => navigate("/subscribe")}>
            Billing / renew
          </Button>
        </div>

        <ChangePinCard />

        <div className="glass-card rounded-2xl border border-border/60 p-4 space-y-2">
          <p className="font-semibold text-sm">Advanced data tools</p>
          <p className="text-[11px] text-muted-foreground">
            Use carefully — these clear sales or business records.
          </p>
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() =>
              runDangerous("Reset sales money (keep unpaid debts)?", async () => {
                await resetSalesMoney();
                await setAppSetting("total_paid", "0");
              })
            }
          >
            Reset sales money
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() =>
              runDangerous("Factory reset (keep clients)?", async () => {
                await factoryResetKeepClients();
                await setAppSetting("total_capital", "0");
                await setAppSetting("total_paid", "0");
              })
            }
          >
            Factory reset (keep clients)
          </Button>
          <Button
            variant="outline"
            className="w-full border-destructive/40 text-destructive"
            disabled={busy}
            onClick={() =>
              runDangerous("Wipe ALL business data (clients, stock, debts)?", async () => {
                await wipeAllBusinessData();
              })
            }
          >
            Wipe all business data
          </Button>
        </div>

        {isSuperAdmin && (
          <Button variant="outline" className="w-full" onClick={() => navigate("/admin/payments")}>
            Admin · pending payments
          </Button>
        )}

        {mode === "cloud" && (
          <div className="glass-card rounded-2xl border border-border/60 p-4 space-y-3">
            <label className="text-xs text-muted-foreground">Owner name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Button className="w-full" disabled={busy} onClick={saveProfile}>
              Save profile
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex gap-3">
          <Link to="/terms" className="underline">
            Terms
          </Link>
          <Link to="/privacy" className="underline">
            Privacy
          </Link>
        </div>

        <Button variant="destructive" className="w-full" disabled={busy} onClick={deleteAccount}>
          Ihanagure Konti n&apos;Amakuru Yose
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => logout().then(() => navigate("/"))}
        >
          Sign out
        </Button>
      </main>
    </div>
  );
};

export default AccountPage;
