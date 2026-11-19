import { describe, it, expect, beforeEach } from "vitest";
import { isCashierModeActive, setCashierModeActive } from "@/lib/cashierMode";

describe("cashierMode staff role segregation", () => {
  beforeEach(() => {
    setCashierModeActive(false);
  });

  it("defaults to inactive (owner full access)", () => {
    expect(isCashierModeActive()).toBe(false);
  });

  it("activates cashier mode and persists state", () => {
    setCashierModeActive(true);
    expect(isCashierModeActive()).toBe(true);
  });

  it("deactivates cashier mode cleanly back to owner access", () => {
    setCashierModeActive(true);
    expect(isCashierModeActive()).toBe(true);
    setCashierModeActive(false);
    expect(isCashierModeActive()).toBe(false);
  });
});
