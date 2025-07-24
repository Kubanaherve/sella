import { describe, expect, it } from "vitest";
import { validateCustomerPhone } from "@/lib/whatsappReminder";

describe("validateCustomerPhone", () => {
  it("rejects missing phone", () => {
    const r = validateCustomerPhone(null);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/nta numero/i);
  });

  it("accepts Rwandan local format", () => {
    const r = validateCustomerPhone("0781234567");
    expect(r.ok).toBe(true);
    expect(r.e164).toBe("+250781234567");
    expect(r.waDigits).toBe("250781234567");
  });

  it("accepts +250 format", () => {
    const r = validateCustomerPhone("+250 788 123 456");
    expect(r.ok).toBe(true);
    expect(r.waDigits).toBe("250788123456");
  });

  it("rejects incomplete Rwanda numbers", () => {
    const r = validateCustomerPhone("07812");
    expect(r.ok).toBe(false);
  });

  it("rejects overlong local numbers instead of truncating into collisions", () => {
    const r = validateCustomerPhone("07881111001");
    expect(r.ok).toBe(false);
  });
});
