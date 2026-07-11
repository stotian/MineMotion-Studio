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

  it("rejects empty prefixes", () => {
    expect(() => normalizeIdPrefix("---")).toThrow(RangeError);
  });
});
