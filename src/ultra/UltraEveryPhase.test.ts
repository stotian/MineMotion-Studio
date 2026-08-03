import { describe, expect, it } from "vitest";
import { createDefaultUltraProjectData, createUltraPhaseArtifact } from "./UltraDefaults";
import { ULTRA_PHASE_DEFINITIONS } from "./UltraPhaseRegistry";
import { getUltraPhaseRecords, validateUltraProjectData } from "./UltraSerializer";
import { runUltraCapabilityPhaseTest } from "./capabilities/UltraCapabilityEngine";
import type { UltraCapabilityRecord } from "./capabilities/UltraCapabilityTypes";

describe.each(ULTRA_PHASE_DEFINITIONS)("Ultra phase $number — $title", (definition) => {
  it(`passes ${definition.testId ?? `P${definition.number}_LEGACY_ACCEPTANCE`}`, () => {
    const initial = createDefaultUltraProjectData("2026-07-31T00:00:00.000Z");
    const data = createUltraPhaseArtifact(definition.number, 1, "2026-07-31T00:00:00.000Z")(initial);
    const records = getUltraPhaseRecords(data, definition.number);

    expect(records).toHaveLength(1);
    if (definition.number >= 84) {
      const result = runUltraCapabilityPhaseTest(records[0] as UltraCapabilityRecord);
      expect(result.testId).toBe(definition.testId);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
    } else {
      const report = validateUltraProjectData(data);
      expect(report.issues.filter((issue) => issue.phase === definition.number && issue.severity === "error")).toEqual([]);
    }
  });
});
