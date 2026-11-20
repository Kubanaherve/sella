import { describe, it, expect, beforeEach } from "vitest";
import {
  isCashierModeActive,
  resetCashierModeForTests,
  setCashierModeActive,
} from "@/lib/cashierMode";

describe("cashierMode staff role segregation", () => {
  beforeEach(() => {
    resetCashierModeForTests();
  });

  it("defaults to inactive (owner full access)", () => {
    expect(isCashierModeActive()).toBe(false);
  });

  it("activates cashier mode and persists state", () => {
    setCashierModeActive(true);
    expect(isCashierModeActive()).toBe(true);
  });

  it("does not leave cashier mode without the owner PIN path", () => {
    setCashierModeActive(true);
    setCashierModeActive(false);
    expect(isCashierModeActive()).toBe(true);
  });
});
