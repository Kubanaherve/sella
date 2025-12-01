import { describe, expect, it } from "vitest";
import {
  lineTotal,
  normalizePaymentSlices,
  paymentStatusFromBalances,
  sumRwf,
  toRwf,
} from "@/lib/money";

describe("money helpers", () => {
  it("rounds to integer RWF", () => {
    expect(toRwf(1000.4)).toBe(1000);
    expect(toRwf(1000.6)).toBe(1001);
  });

  it("computes line totals", () => {
    expect(lineTotal(25000, 2)).toBe(50000);
  });

  it("handles split payment MoMo + cash", () => {
    const r = normalizePaymentSlices(
      [
        { method: "momo", amount: 30000 },
        { method: "cash", amount: 20000 },
      ],
      50000
    );
    expect(r.paid).toBe(50000);
    expect(r.remaining).toBe(0);
    expect(r.slices).toHaveLength(2);
    expect(sumRwf(r.slices.map((s) => s.amount))).toBe(50000);
  });

  it("handles partial payment", () => {
    const r = normalizePaymentSlices([{ method: "cash", amount: 40000 }], 100000);
    expect(r.paid).toBe(40000);
    expect(r.remaining).toBe(60000);
    expect(paymentStatusFromBalances(100000, 60000)).toBe("partial");
  });

  it("handles overpayment as change", () => {
    const r = normalizePaymentSlices([{ method: "cash", amount: 55000 }], 50000);
    expect(r.paid).toBe(50000);
    expect(r.changeDue).toBe(5000);
    expect(r.remaining).toBe(0);
  });

  it("credit when nothing paid", () => {
    const r = normalizePaymentSlices([], 80000);
    expect(r.paid).toBe(0);
    expect(r.remaining).toBe(80000);
    expect(paymentStatusFromBalances(80000, 80000)).toBe("credit");
  });
});
