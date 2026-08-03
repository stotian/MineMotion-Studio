import type { Vector3Tuple } from "../project/ProjectFile";

export type SimulationKind = "debris" | "particle-collision" | "cloth" | "shockwave" | "crowd-path" | "camera-noise" | "wind";
export type SimulationQuality = "draft" | "final";
export type SimulationStatus = "idle" | "dirty" | "baking" | "baked" | "error";

export interface SimulationDefinition {
  id: string;
  name: string;
  kind: SimulationKind;
  enabled: boolean;
  seed: number;
  startFrame: number;
  endFrame: number;
  quality: SimulationQuality;
  targetIds: string[];
  parameters: Record<string, number | string | boolean | Vector3Tuple>;
  status: SimulationStatus;
  updatedAt: string;
}

export interface SimulationSample {
  frame: number;
  subjectId: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  velocity?: Vector3Tuple;
  intensity?: number;
}

export interface SimulationBake {
  id: string;
  simulationId: string;
  version: 1;
  fingerprint: string;
  quality: SimulationQuality;
  startFrame: number;
  endFrame: number;
  samples: SimulationSample[];
  editable: boolean;
  createdAt: string;
}

export interface SimulationProjectData {
  schemaVersion: 1;
  definitions: SimulationDefinition[];
  bakes: SimulationBake[];
  cacheLimitBytes: number;
}

export interface SimulationBudget {
  maxSubjects: number;
  maxSamples: number;
  maxFrames: number;
  maxBakeBytes: number;
}

export const SIMULATION_BUDGETS: Readonly<Record<SimulationQuality, SimulationBudget>> = Object.freeze({
  draft: { maxSubjects: 80, maxSamples: 80_000, maxFrames: 2_400, maxBakeBytes: 16 * 1024 * 1024 },
  final: { maxSubjects: 256, maxSamples: 500_000, maxFrames: 12_000, maxBakeBytes: 96 * 1024 * 1024 }
});
