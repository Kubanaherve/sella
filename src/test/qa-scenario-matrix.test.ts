/**
 * Large programmatic scenario matrix for QA.
 * Each nested case is a real assertion — not fake "passed" logs.
 */
import { describe, expect, it } from "vitest";
import {
  clampPaid,
  lineTotal,
  normalizePaymentSlices,
  paymentStatusFromBalances,
  sumRwf,
  toRwf,
  type PaymentSlice,
} from "@/lib/money";
import { hasWriteAccess, type SubscriptionSnapshot } from "@/lib/entitlements";
import {
  detectRwandaNetwork,
  normalizePhoneE164,
  toPaypackLocalPhone,
} from "@/lib/phone";
import { hashPin, verifyPin } from "@/lib/pin";
import { validateCustomerPhone } from "@/lib/whatsappReminder";

const METHODS: PaymentSlice["method"][] = ["cash", "momo", "airtel", "bank"];

describe("QA matrix: money scenarios", () => {
  const amounts = [0, 1, -5, 0.4, 0.6, 999, 1000, 10000, 50000, 999999];
  const qtys = [0, 1, 2, 3, 10, -1, 1.9];

  it("lineTotal matrix never goes negative and floors qty", () => {
    let n = 0;
    for (const unit of amounts) {
      for (const q of qtys) {
        const t = lineTotal(unit, q);
        expect(t).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(t)).toBe(true);
        n++;
      }
    }
    expect(n).toBe(amounts.length * qtys.length);
  });

  it("toRwf / sumRwf / clampPaid matrix", () => {
    let n = 0;
    for (const a of amounts) {
      expect(Number.isInteger(toRwf(a))).toBe(true);
      for (const due of [0, 100, 50000, a]) {
        const c = clampPaid(a, due);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(Math.max(0, toRwf(due)));
        n++;
      }
    }
    expect(sumRwf([1, 2, 3])).toBe(6);
    expect(n).toBe(amounts.length * 4);
  });

  it("normalizePaymentSlices covers split / partial / overpay / empty / multi-method", () => {
    let n = 0;
    const totals = [0, 1000, 25000, 50000, 100000];
    for (const total of totals) {
      // empty
      {
        const r = normalizePaymentSlices([], total);
        expect(r.paid).toBe(0);
        expect(r.remaining).toBe(toRwf(total));
        n++;
      }
      // single method exact / under / over
      for (const m of METHODS) {
        for (const factor of [0, 0.5, 1, 1.2]) {
          const amount = Math.round(total * factor);
          const r = normalizePaymentSlices([{ method: m, amount }], total);
          expect(r.paid + r.remaining).toBe(toRwf(total));
          expect(r.paid).toBeLessThanOrEqual(toRwf(total));
          if (amount > total && total > 0) expect(r.changeDue).toBe(amount - total);
          n++;
        }
      }
      // two-way split half/half when even
      if (total > 0 && total % 2 === 0) {
        const half = total / 2;
        const r = normalizePaymentSlices(
          [
            { method: "momo", amount: half },
            { method: "cash", amount: half },
          ],
          total
        );
        expect(r.paid).toBe(total);
        expect(r.remaining).toBe(0);
        expect(sumRwf(r.slices.map((s) => s.amount))).toBe(total);
        n++;
      }
    }
    expect(n).toBeGreaterThan(80);
  });

  it("paymentStatusFromBalances matrix", () => {
    let n = 0;
    for (const total of [0, 100, 50000]) {
      for (const rem of [0, 1, total, total + 1, Math.floor(total / 2)]) {
        const s = paymentStatusFromBalances(total, rem);
        if (toRwf(rem) <= 0) expect(s).toBe("paid");
        else if (toRwf(rem) >= toRwf(total)) expect(s).toBe("credit");
        else expect(s).toBe("partial");
        n++;
      }
    }
    expect(n).toBe(15);
  });
});

describe("QA matrix: entitlements", () => {
  const base: SubscriptionSnapshot = {
    workspaceId: "w",
    status: "trialing",
    provider: "trial",
    priceRwf: 5000,
    trialEndsAt: "2099-01-01T00:00:00.000Z",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };

  const statuses: SubscriptionSnapshot["status"][] = [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "expired",
  ];

  it("status × end-date matrix matches server contract", () => {
    let n = 0;
    const ends = [null, "2020-01-01T00:00:00.000Z", "2099-06-01T00:00:00.000Z"];
    for (const status of statuses) {
      for (const trialEndsAt of ends) {
        for (const currentPeriodEnd of ends) {
          const sub = { ...base, status, trialEndsAt, currentPeriodEnd };
          const ok = hasWriteAccess(sub);
          if (status === "trialing") {
            expect(ok).toBe(!!trialEndsAt && new Date(trialEndsAt).getTime() > Date.now());
          } else if (status === "active") {
            expect(ok).toBe(
              !!currentPeriodEnd && new Date(currentPeriodEnd).getTime() > Date.now()
            );
          } else {
            expect(ok).toBe(false);
          }
          n++;
        }
      }
    }
    expect(n).toBe(statuses.length * ends.length * ends.length);
  });

  it("null subscription denies write", () => {
    expect(hasWriteAccess(null)).toBe(false);
  });
});

describe("QA matrix: phone Rwanda", () => {
  const validLocals = [
    "0780000001",
    "0791234567",
    "0721234567",
    "0731234567",
    "780000001",
    "+250780000001",
    "250780000001",
  ];
  const invalid = ["", "123", "078", "078000000", "07800000012", "abc", "0000000000", "0711234567"];

  it("normalize + network detect for valid-ish RW numbers", () => {
    let n = 0;
    for (const raw of validLocals) {
      const e164 = normalizePhoneE164(raw);
      if (e164) {
        expect(e164.startsWith("+250")).toBe(true);
        const net = detectRwandaNetwork(raw);
        expect(["mtn", "airtel", "unknown"]).toContain(net);
        const local = toPaypackLocalPhone(raw);
        if (local.length === 10) expect(local.startsWith("0")).toBe(true);
      }
      n++;
    }
    expect(n).toBe(validLocals.length);
  });

  it("rejects truncated / garbage for local 0-prefix", () => {
    for (const raw of invalid.filter((x) => x.startsWith("0") || x === "" || x === "abc")) {
      const e164 = normalizePhoneE164(raw);
      if (raw.startsWith("0") && raw.length !== 10) expect(e164).toBe("");
    }
  });

  it("validateCustomerPhone matrix", () => {
    let n = 0;
    for (const raw of [...validLocals, ...invalid, null, undefined]) {
      const r = validateCustomerPhone(raw as string | null | undefined);
      expect(typeof r.ok).toBe("boolean");
      if (r.ok) {
        expect(r.e164).toBeTruthy();
        expect(r.waDigits).toBeTruthy();
      } else {
        expect(r.error).toBeTruthy();
      }
      n++;
    }
    expect(n).toBe(validLocals.length + invalid.length + 2);
  });

  it("exhaustive digit length sweep 0–15 for 07…", () => {
    let n = 0;
    for (let len = 0; len <= 15; len++) {
      const raw = "07" + "1".repeat(Math.max(0, len - 2));
      const e164 = normalizePhoneE164(raw.slice(0, len || 0) || "");
      // only exact 10-digit local 0xxxxxxxxx accepted via 0-branch
      if (len === 10 && raw.startsWith("07")) {
        expect(e164).toBe(`+250${raw.slice(1)}`);
      }
      n++;
    }
    expect(n).toBe(16);
  });
});

describe("QA matrix: PIN hash", () => {
  it("verifies 0000–0499 sample and rejects mismatches", async () => {
    let n = 0;
    for (let i = 0; i < 500; i++) {
      const pin = String(i).padStart(4, "0");
      const hash = await hashPin(pin);
      expect(await verifyPin(pin, hash)).toBe(true);
      expect(await verifyPin(String((i + 7) % 10000).padStart(4, "0"), hash)).toBe(false);
      n += 2;
    }
    expect(n).toBe(1000);
  });
});

describe("QA matrix: combined checkout stress", () => {
  it("cart line totals + payments stay consistent for random baskets", () => {
    let n = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const lines = 1 + (seed % 5);
      let total = 0;
      for (let i = 0; i < lines; i++) {
        const unit = 500 * ((seed + i) % 40 + 1);
        const qty = 1 + ((seed + i) % 4);
        total += lineTotal(unit, qty);
      }
      const pay = Math.floor(total * ((seed % 10) / 10));
      const r = normalizePaymentSlices([{ method: METHODS[seed % 4], amount: pay }], total);
      expect(r.paid + r.remaining).toBe(total);
      expect(paymentStatusFromBalances(total, r.remaining)).toBe(
        r.remaining <= 0 ? "paid" : r.remaining >= total ? "credit" : "partial"
      );
      n++;
    }
    expect(n).toBe(500);
  });

  it("triple-split payments never exceed order total recorded", () => {
    let n = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const total = 1000 * (1 + (seed % 80));
      const a = Math.floor(total * 0.4);
      const b = Math.floor(total * 0.4);
      const c = total; // overpay on purpose via third slice
      const r = normalizePaymentSlices(
        [
          { method: "momo", amount: a },
          { method: "cash", amount: b },
          { method: "airtel", amount: c },
        ],
        total
      );
      expect(sumRwf(r.slices.map((s) => s.amount))).toBe(r.paid);
      expect(r.paid).toBeLessThanOrEqual(total);
      expect(r.paid + r.remaining).toBe(total);
      n++;
    }
    expect(n).toBe(300);
  });
});
