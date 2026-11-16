import { useEffect } from "react";
import { installAnalytics } from "@/lib/analytics";

export function Analytics() {
  useEffect(() => {
    installAnalytics();
  }, []);
  return null;
}
