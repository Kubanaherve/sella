import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/integrations/supabase/client";
import { registerPushDevice } from "@/services/pushNotifications";
import { toast } from "sonner";

interface NotifRow {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { mode, isAuthenticated } = useAuth();
  const [rows, setRows] = useState<NotifRow[]>([]);
  const [pushMsg, setPushMsg] = useState("");

  const load = useCallback(async () => {
    if (mode !== "cloud" || !isAuthenticated) return;
    const sb = getSupabase();
    const { data, error } = await sb
      .from("billing_notifications")
      .select("id, kind, title, body, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    else setRows((data as NotifRow[]) || []);
  }, [mode, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (mode !== "cloud" || !isAuthenticated) return;
    const sb = getSupabase();
    const channel = sb
      .channel("sella-billing-notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "billing_notifications" },
        () => {
          void load();
        }
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [mode, isAuthenticated, load]);

  const markRead = async (id: string) => {
    const sb = getSupabase();
    await sb
      .from("billing_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    await load();
  };

  const enablePush = async () => {
    const res = await registerPushDevice();
    setPushMsg(res.ok ? "Device registered for push" : res.reason || "Push not ready");
    if (res.ok) toast.success("Push enabled");
    else toast.message(res.reason || "Push scaffolding only — add FCM keys later");
  };

  return (
    <div className="min-h-screen sella-hero-bg pb-10">
      <header className="sella-app-header">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold flex-1 truncate">Notifications</h1>
        <Bell size={18} className="text-primary" />
      </header>

      <main className="p-4 max-w-md mx-auto space-y-3">
        <div className="glass-card p-3 space-y-2">
          <p className="text-sm font-semibold">Push notifications</p>
          <p className="text-[11px] text-muted-foreground">
            FCM/APNs scaffolding is ready. Install the Capacitor push plugin and
            Firebase keys when you go live.
          </p>
          <Button variant="outline" className="w-full" onClick={() => void enablePush()}>
            Register this device
          </Button>
          {pushMsg && (
            <p className="text-[11px] text-muted-foreground">{pushMsg}</p>
          )}
        </div>

        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No notifications yet
          </p>
        )}

        {rows.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => void markRead(n.id)}
            className={`sella-list-card w-full text-left p-4 space-y-1 ${
              n.read_at ? "opacity-70" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">{n.title}</p>
              {!n.read_at && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </div>
            {n.body && (
              <p className="text-xs text-muted-foreground">{n.body}</p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {n.kind} · {new Date(n.created_at).toLocaleString()}
            </p>
          </button>
        ))}
      </main>
    </div>
  );
};

export default NotificationsPage;
