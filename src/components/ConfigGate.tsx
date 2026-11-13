import type { ReactNode } from "react";
import { hasSupabaseConfig, isCloudMode } from "@/integrations/supabase/client";

/** Fail loudly when cloud mode is on but Supabase env is missing — avoids silent white screens. */
export function ConfigGate({ children }: { children: ReactNode }) {
  if (isCloudMode() && !hasSupabaseConfig()) {
    return (
      <div className="min-h-screen sella-hero-bg flex items-center justify-center p-6">
        <div className="glass-card max-w-md p-6 space-y-3 text-center">
          <h1 className="text-lg font-bold">Configuration required</h1>
          <p className="text-sm text-muted-foreground">
            Cloud mode is enabled but Supabase is not configured. Set{" "}
            <code className="text-xs">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> in{" "}
            <code className="text-xs">.env</code>, then restart the app.
          </p>
          <p className="text-[11px] text-muted-foreground">
            For offline-only demo use <code>VITE_DATA_MODE=local</code>.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
