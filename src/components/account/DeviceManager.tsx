import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { getSupabase, isCloudMode } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Laptop, ShieldCheck, Smartphone, LogOut } from "lucide-react";
import { toast } from "sonner";

export function DeviceManager() {
  const [revoking, setRevoking] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  const getDeviceLabel = () => {
    if (isNative) {
      return platform === "android" ? "Android App (Capacitor)" : "iOS App (Capacitor)";
    }
    const ua = navigator.userAgent;
    if (/Macintosh/i.test(ua)) return "macOS (Web / Desktop)";
    if (/Windows/i.test(ua)) return "Windows (Web / Desktop)";
    if (/iPhone|iPad/i.test(ua)) return "iOS Safari (Mobile Web)";
    if (/Android/i.test(ua)) return "Android Chrome (Mobile Web)";
    return "Web Browser";
  };

  const handleRevokeOtherDevices = async () => {
    if (!isCloudMode()) {
      toast.info("Offline mode only runs on this local device.");
      return;
    }
    if (
      !confirm(
        "Log out all other devices?\n\nThis will invalidate sessions on any other phones or computers logged into your shop."
      )
    ) {
      return;
    }

    setRevoking(true);
    try {
      const sb = getSupabase();
      // Supabase signOut with scope 'others' terminates all other active refresh sessions
      const { error } = await sb.auth.signOut({ scope: "others" });
      if (error) throw error;
      toast.success("Other device sessions have been revoked.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to revoke other devices");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-border/60 p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Security & connected devices</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <ShieldCheck size={12} />
          Active Session
        </span>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-white/40 dark:bg-white/[0.02]">
        <div className="w-9 h-9 rounded-xl bg-[#1A6FFF]/10 text-[#1A6FFF] flex items-center justify-center shrink-0">
          {isNative || /iPhone|Android/i.test(navigator.userAgent) ? (
            <Smartphone size={18} />
          ) : (
            <Laptop size={18} />
          )}
        </div>
        <div className="space-y-0.5 flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{getDeviceLabel()}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            Current terminal · Verified
          </p>
        </div>
      </div>

      {isCloudMode() && (
        <Button
          variant="outline"
          size="sm"
          disabled={revoking}
          onClick={handleRevokeOtherDevices}
          className="w-full text-xs h-9 text-slate-700 dark:text-white/80 border-border/70 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center gap-1.5"
        >
          <LogOut size={13} />
          <span>{revoking ? "Revoking…" : "Log out other devices"}</span>
        </Button>
      )}
    </div>
  );
}
