import { describe, expect, it } from "vitest";
import { compareSemVer, isValidSemVer, isValidSemVerRange } from "./SemVer";

describe("SemVer", () => {
  it.each([
    ["1.0.0-beta", "1.0.0"],
    ["1.0.0-alpha", "1.0.0-beta"],
    ["1.0.0-beta.2", "1.0.0-beta.11"],
    ["1.0.0", "1.0.1"],
    ["1.9.0", "2.0.0"]
  ])("orders %s before %s", (left, right) => {
    expect(compareSemVer(left, right)).toBeLessThan(0);
    expect(compareSemVer(right, left)).toBeGreaterThan(0);
  });

  it("ignores build metadata and recognizes equal releases", () => {
    expect(compareSemVer("1.2.3+build.1", "1.2.3+build.9")).toBe(0);
    expect(compareSemVer("1.2.3", "1.2.3")).toBe(0);
  });

  it.each(["1", "1.0", "01.0.0", "1.0.0-", "1.0.0-alpha..1", "1.0.0-01", "1.0.0+bad..build"])(
    "rejects invalid version %s",
    (version) => {
      expect(isValidSemVer(version)).toBe(false);
      expect(() => compareSemVer(version, "1.0.0")).toThrow("Invalid semantic version");
    }
  );

  it("validates the bounded dependency range forms", () => {
    expect(isValidSemVerRange("^1.2.3-beta.1")).toBe(true);
    expect(isValidSemVerRange(">=1.0.0")).toBe(true);
    expect(isValidSemVerRange("*" )).toBe(false);
  });
});
