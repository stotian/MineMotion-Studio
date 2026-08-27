import { describe, expect, it } from "vitest";
import { evaluateOfflineLeaseClock } from "./OfflineLeaseClock";

describe("evaluateOfflineLeaseClock", () => {
  it("updates the latest trusted time while a lease is valid", () => {
    const result = evaluateOfflineLeaseClock({ lastTrustedAt: null }, new Date("2026-08-20T12:00:00.000Z"), "2026-08-25T00:00:00.000Z");
    expect(result).toEqual({ allowed: true, next: { lastTrustedAt: "2026-08-20T12:00:00.000Z" } });
  });

  it("rejects a meaningful backwards clock change", () => {
    const result = evaluateOfflineLeaseClock({ lastTrustedAt: "2026-08-20T12:00:00.000Z" }, new Date("2026-08-20T11:50:00.000Z"), "2026-08-25T00:00:00.000Z");
    expect(result).toMatchObject({ allowed: false, reason: "CLOCK_ROLLBACK" });
  });

  it("rejects an expired lease", () => {
    const result = evaluateOfflineLeaseClock({ lastTrustedAt: null }, new Date("2026-08-26T00:00:00.000Z"), "2026-08-25T00:00:00.000Z");
    expect(result).toMatchObject({ allowed: false, reason: "LEASE_EXPIRED" });
  });
});
