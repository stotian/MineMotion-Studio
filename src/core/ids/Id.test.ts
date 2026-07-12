import { hashStringToUint32 } from "../random/DeterministicRandom";
import { createDeterministicId, createId, normalizeIdPrefix } from "./Id";

describe("core IDs", () => {
  it("creates testable time-based IDs from injected entropy", () => {
    expect(
      createId("render job", {
        now: () => 1234,
        randomToken: () => "ABC-def-123"
      })
    ).toBe("render_job_ya_abcdef123");
  });

  it("creates the same deterministic ID for the same seed", () => {
    expect(createDeterministicId("vfx", "project:frame:42")).toBe(
      createDeterministicId("vfx", "project:frame:42")
    );
    expect(createDeterministicId("vfx", "project:frame:42")).not.toBe(
      createDeterministicId("vfx", "project:frame:43")
    );
  });

  it("preserves the existing deterministic ID hash output", () => {
    expect(hashStringToUint32("project:frame:42")).toBe(0x7fa0ed6f);
    expect(createDeterministicId("vfx", "project:frame:42")).toBe("vfx_zeuhdb");
  });

  it("rejects empty prefixes", () => {
    expect(() => normalizeIdPrefix("---")).toThrow(RangeError);
  });
});
