import { describe, expect, it } from "vitest";
import { bakeSimulation, createSimulationFingerprint, editSimulationBakeSample, isSimulationBakeCurrent } from "./SimulationBake";
import { createSimulationDefinition, sanitizeSimulationProject } from "./SimulationSerializer";
import { sampleSimulation } from "./SimulationSolvers";
import { storeSimulationBake, invalidateStaleSimulationBakes } from "./SimulationController";

describe("phase 30 deterministic simulation", () => {
  it("samples all supported systems deterministically", () => {
    const kinds = ["debris", "particle-collision", "cloth", "shockwave", "crowd-path", "camera-noise", "wind"] as const;
    for (const kind of kinds) {
      const definition = createSimulationDefinition(kind, { targetIds: ["a", "b"], seed: 42, startFrame: 0, endFrame: 20 });
      expect(sampleSimulation(definition, 10, 24)).toEqual(sampleSimulation(definition, 10, 24));
    }
  });

  it("bakes, edits, invalidates and bounds cached samples", async () => {
    const definition = createSimulationDefinition("debris", { id: "sim", targetIds: ["a"], startFrame: 0, endFrame: 10, seed: 5 });
    const bake = await bakeSimulation(definition, { fps: 24 });
    expect(isSimulationBakeCurrent(bake, definition, 24)).toBe(true);
    expect(editSimulationBakeSample(bake, 0, { intensity: 0.5 }).samples[0].intensity).toBe(0.5);
    const stored = storeSimulationBake(sanitizeSimulationProject({ definitions: [definition], bakes: [] }), bake);
    expect(stored.bakes).toHaveLength(1);
    expect(invalidateStaleSimulationBakes(stored, 30).bakes).toHaveLength(0);
    expect(createSimulationFingerprint(definition, 24)).not.toBe(createSimulationFingerprint({ ...definition, seed: 6 }, 24));
  });

  it("recovers interrupted bake state as dirty", () => {
    const definition = createSimulationDefinition("wind", { status: "baking" });
    expect(sanitizeSimulationProject({ definitions: [definition], bakes: [] }).definitions[0].status).toBe("dirty");
  });
});
