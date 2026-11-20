import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { applyAppearanceToDom, bootstrapAppearance } from "@/contexts/ThemeContext";

describe("desktop light launch", () => {
  it("sale screen imports useCallback", () => {
    const src = readFileSync(resolve(process.cwd(), "src/pages/AddDebt.tsx"), "utf8");
    expect(src).toMatch(/import React, \{[^}]*useCallback/);
  });

  it("starts light even when a dark preference was stored", () => {
    localStorage.setItem("sella_appearance", "dark");
    document.documentElement.classList.add("dark");
    bootstrapAppearance();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.appearance).toBe("light");
    applyAppearanceToDom("light");
  });
});
