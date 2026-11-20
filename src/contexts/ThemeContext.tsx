import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { BRAND } from "@/lib/brand";

export type AppAppearance = "light" | "dark";

const STORAGE_KEY = "sella_appearance";

type ThemeContextValue = {
  appearance: AppAppearance;
  isDark: boolean;
  setAppearance: (next: AppAppearance) => void;
  toggleAppearance: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredAppearance(): AppAppearance {
  // This release always starts in light mode. A saved dark preference
  // or the system theme must not paint the desktop app dark on launch.
  return "light";
}

export function applyAppearanceToDom(appearance: AppAppearance) {
  const root = document.documentElement;
  root.classList.toggle("dark", appearance === "dark");
  root.style.colorScheme = appearance;
  root.dataset.appearance = appearance;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      appearance === "dark" ? BRAND.colors.ink : BRAND.colors.blue
    );
  }
}

/** Call before React paint to avoid a wrong-theme flash. */
export function bootstrapAppearance() {
  applyAppearanceToDom(readStoredAppearance());
}

async function syncNativeChrome(appearance: AppAppearance) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({
      style: appearance === "dark" ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: appearance === "dark" ? BRAND.colors.ink : BRAND.colors.blueDeep,
    });
  } catch {
    /* optional */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<AppAppearance>(() =>
    readStoredAppearance()
  );

  const setAppearance = useCallback((_next: AppAppearance) => {
    const forced: AppAppearance = "light";
    setAppearanceState(forced);
    try {
      localStorage.setItem(STORAGE_KEY, forced);
    } catch {
      /* ignore */
    }
    applyAppearanceToDom(forced);
    void syncNativeChrome(forced);
  }, []);

  const toggleAppearance = useCallback(() => {
    setAppearance(appearance === "dark" ? "light" : "dark");
  }, [appearance, setAppearance]);

  useEffect(() => {
    applyAppearanceToDom(appearance);
    void syncNativeChrome(appearance);
  }, [appearance]);

  const value = useMemo(
    () => ({
      appearance,
      isDark: appearance === "dark",
      setAppearance,
      toggleAppearance,
    }),
    [appearance, setAppearance, toggleAppearance]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

/** Safe for brand components that may render outside provider during tests. */
export function useThemeOptional(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  return {
    appearance: "light",
    isDark: false,
    setAppearance: () => undefined,
    toggleAppearance: () => undefined,
  };
}
