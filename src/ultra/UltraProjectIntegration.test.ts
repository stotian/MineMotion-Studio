import { describe, expect, it } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import { ProjectSerializer } from "../project/ProjectSerializer";
import { createUltraPhaseArtifact } from "./UltraDefaults";
import { ULTRA_PHASE_NUMBERS } from "./UltraPhaseRegistry";
import { getUltraPhaseRecords, validateUltraProjectData } from "./UltraSerializer";

describe("Ultra project integration", () => {
  it("round-trips phases 36 through 600 through the schema-10 project serializer", () => {
    let project = createInitialProject();
    for (const phase of ULTRA_PHASE_NUMBERS) {
      project = {
        ...project,
        ultra: createUltraPhaseArtifact(phase, 1, "2026-07-30T17:00:00.000Z")(project.ultra)
      };
    }

    const parsed = ProjectSerializer.parse(ProjectSerializer.serialize(project));
    const report = validateUltraProjectData(parsed.ultra);

    expect(report.valid).toBe(true);
    expect(report.configuredPhases).toBe(ULTRA_PHASE_NUMBERS.length);
    expect(Object.keys(parsed.ultra.phaseStates)).toHaveLength(ULTRA_PHASE_NUMBERS.length);
    expect(ULTRA_PHASE_NUMBERS.every((phase) => getUltraPhaseRecords(parsed.ultra, phase).length === 1)).toBe(true);
  });

  it("migrates a schema-10 project that predates Ultra data", () => {
    const project = createInitialProject();
    const legacy = JSON.parse(ProjectSerializer.serialize(project)) as Record<string, unknown>;
    delete legacy.ultra;

    const parsed = ProjectSerializer.parse(JSON.stringify(legacy));

    expect(parsed.ultra.schemaVersion).toBe(1);
    expect(Object.keys(parsed.ultra.phaseStates)).toHaveLength(ULTRA_PHASE_NUMBERS.length);
    expect(Object.values(parsed.ultra.phaseStates).every((state) => state.status === "planned")).toBe(true);
  });

  it("blocks invalid domain records instead of marking them validated", () => {
    const project = createInitialProject();
    const withContact = {
      ...project,
      ultra: createUltraPhaseArtifact(38, 1, "2026-07-30T17:00:00.000Z")(project.ultra)
    };
    const invalid = {
      ...withContact.ultra,
      performance: {
        ...withContact.ultra.performance,
        contactConstraints: [{ ...withContact.ultra.performance.contactConstraints[0], maximumReach: 0 }]
      }
    };

    const report = validateUltraProjectData(invalid);

    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.phase === 38)).toBe(true);
  });
});
