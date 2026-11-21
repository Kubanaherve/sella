import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { offlineBannerText } from "@/i18n/customerMessages";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import { countOutboxAttention } from "@/db/outbox";
import { getSupabase, isCloudMode } from "@/integrations/supabase/client";

/** Connectivity banner + offline outbox pending count (cloud). */
export function OfflineBanner() {
  useAppLanguage();
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [pending, setPending] = useState(0);
  const [conflicts, setConflicts] = useState(0);

  useEffect(() => {
    const refreshPending = () => {
      if (!isCloudMode()) {
        setPending(0);
        setConflicts(0);
        return;
      }
      void (async () => {
        try {
          const { data } = await getSupabase().auth.getSession();
          const owner = data.session?.user?.id;
          if (!owner) {
            setPending(0);
            setConflicts(0);
            return;
          }
          const counts = await countOutboxAttention(owner);
          setPending(counts.pending);
          setConflicts(counts.conflicts);
        } catch {
          setPending(0);
          setConflicts(0);
        }
      })();
    };
    const on = () => {
      setOnline(true);
      refreshPending();
      // Drain is wired by callers with RPC access; banner only surfaces status.
      window.dispatchEvent(new CustomEvent("sella:online"));
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    refreshPending();
    const t = window.setInterval(refreshPending, 8000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.clearInterval(t);
    };
  }, []);

  if (online && pending === 0 && conflicts === 0) return null;

  return (
    <div
      className="sticky top-0 z-[70] mx-2 mt-1 rounded-2xl bg-slate-900/95 text-white text-center text-xs px-3 shadow-lg shadow-black/20 backdrop-blur-md border border-white/10"
      style={{
        paddingTop:
          "calc(max(env(safe-area-inset-top, 0px), var(--sella-safe-top-floor, 0px)) * 0.15 + 0.45rem)",
        paddingBottom: "0.45rem",
      }}
    >
      {conflicts > 0 ? (
        <Link to="/sync-conflicts" className="underline font-semibold">
          {offlineBannerText("conflict", conflicts)}
        </Link>
      ) : !online ? (
        offlineBannerText("offline")
      ) : (
        offlineBannerText("pending", pending)
      )}
    </div>
  );
}
