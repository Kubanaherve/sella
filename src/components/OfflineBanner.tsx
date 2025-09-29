import { useEffect, useState } from "react";

/** Lightweight connectivity banner for mobile / PWA. */
export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className="sticky top-0 z-[70] bg-slate-900 text-white text-center text-xs px-3"
      style={{
        paddingTop:
          "calc(max(env(safe-area-inset-top, 0px), var(--sella-safe-top-floor, 0px)) + 0.35rem)",
        paddingBottom: "0.35rem",
      }}
    >
      Nta interineti — amakuru ya locale akora; sync izagaruka iyo wahuye.
    </div>
  );
}
