import { describe, it, expect, beforeEach } from "vitest";
import {
  isPaymentInProgress,
  markPaymentInProgress,
  clearPaymentInProgress,
} from "@/services/billing";

describe("billing-realtime session helpers", () => {
  beforeEach(() => {
    clearPaymentInProgress();
  });

  it("reports no payment in progress by default", () => {
    expect(isPaymentInProgress()).toBe(false);
  });

  it("reports payment in progress once marked", () => {
    markPaymentInProgress(3);
    expect(isPaymentInProgress()).toBe(true);
  });

  it("clears payment in progress cleanly", () => {
    markPaymentInProgress(3);
    expect(isPaymentInProgress()).toBe(true);
    clearPaymentInProgress();
    expect(isPaymentInProgress()).toBe(false);
  });
});
