import { describe, expect, it } from "vitest";
import { claimedPlatforms, PLATFORM_SUPPORT_MATRIX, validatePlatformClaim } from "./PlatformSupport";
import { codecAvailability, normalizePortableRelativePath, portableFilename } from "./CrossPlatformAudit";
describe("Phase 33 distribution", () => {
  it("does not claim an untested platform", () => {
    expect(claimedPlatforms()).toEqual([]);
    expect(PLATFORM_SUPPORT_MATRIX.flatMap(validatePlatformClaim)).toEqual([]);
  });
  it("normalizes portable paths and Windows names", () => {
    expect(normalizePortableRelativePath("assets\\audio\\mix.wav")).toBe("assets/audio/mix.wav");
    expect(() => normalizePortableRelativePath("../secret")).toThrow();
    expect(portableFilename("CON")).toBe("_CON");
  });
  it("keeps codec claims capability-driven", () => {
    expect(codecAvailability("linux-x64", false).webm).toBe(false);
    expect(codecAvailability("windows-x64", true).mp4).toBe(true);
  });
});
