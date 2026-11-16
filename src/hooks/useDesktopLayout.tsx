import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";

/** Laptop / desktop web. Native phone and tablet builds stay on the mobile shell. */
export const DESKTOP_MIN_WIDTH = 1024;

function readDesktop(): boolean {
  if (typeof window === "undefined") return false;
  if (Capacitor.isNativePlatform()) return false;
  return window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches;
}

const DesktopLayoutContext = createContext(false);

export function DesktopLayoutProvider({ children }: { children: ReactNode }) {
  const [desktop, setDesktop] = useState(readDesktop);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.remove("sella-desktop");
      setDesktop(false);
      return;
    }
    const mql = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
    const apply = () => {
      const next = mql.matches;
      setDesktop(next);
      document.documentElement.classList.toggle("sella-desktop", next);
    };
    apply();
    mql.addEventListener("change", apply);
    return () => {
      mql.removeEventListener("change", apply);
      document.documentElement.classList.remove("sella-desktop");
    };
  }, []);

  return (
    <DesktopLayoutContext.Provider value={desktop}>
      {children}
    </DesktopLayoutContext.Provider>
  );
}

export function useDesktopLayout(): boolean {
  return useContext(DesktopLayoutContext);
}
