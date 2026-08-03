import { describe, expect, it } from "vitest";
import { validateFeatureTruth } from "./FeatureTruthMatrix";
import { runMigrationMatrix } from "./MigrationFixtures";
import { runSessionStress } from "./SessionStressHarness";
import { validateGoldenProjects } from "./GoldenProjectCatalog";
import { openReleaseBlockingIssues } from "./BetaIssueRegistry";
import { WORLD_COMPATIBILITY_MATRIX } from "./WorldCompatibilityMatrix";
describe("Phase 34 public beta QA", () => {
  it("keeps feature truth and issue decisions explicit", () => { expect(validateFeatureTruth()).toEqual([]); expect(openReleaseBlockingIssues()).toEqual([]); });
  it("migrates every historical project schema", () => { expect(runMigrationMatrix()).toHaveLength(10); });
  it("keeps repeated project/package work bounded", () => { const report = runSessionStress(50); expect(report.deterministic).toBe(true); expect(Math.abs(report.packageSizeDriftBytes)).toBeLessThan(4096); });
  it("validates golden projects and world claims", () => { expect(validateGoldenProjects()).toEqual([]); expect(WORLD_COMPATIBILITY_MATRIX.some((entry) => entry.status === "unsupported")).toBe(true); });
});
