import { useEffect, useState } from "react";
import { countPendingOutbox } from "@/db/outbox";
import { isCloudMode } from "@/integrations/supabase/client";

/** Connectivity banner + offline outbox pending count (cloud). */
export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refreshPending = () => {
      if (!isCloudMode()) {
        setPending(0);
        return;
      }
      void countPendingOutbox().then(setPending).catch(() => setPending(0));
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

  if (online && pending === 0) return null;

  return (
    <div
      className="sticky top-0 z-[70] bg-slate-900 text-white text-center text-xs px-3"
      style={{
        paddingTop:
          "calc(max(env(safe-area-inset-top, 0px), var(--sella-safe-top-floor, 0px)) + 0.35rem)",
        paddingBottom: "0.35rem",
      }}
    >
      {!online
        ? "Nta interineti — amakuru ya locale akora; sync izagaruka iyo wahuye."
        : `${pending} offline action(s) waiting to sync`}
    </div>
  );
}
