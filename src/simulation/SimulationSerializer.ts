import { createId } from "../core/ids/Id";
import { SIMULATION_BUDGETS, type SimulationBake, type SimulationDefinition, type SimulationKind, type SimulationProjectData, type SimulationQuality, type SimulationSample } from "./SimulationTypes";

const KINDS = new Set<SimulationKind>(["debris", "particle-collision", "cloth", "shockwave", "crowd-path", "camera-noise", "wind"]);

export function createDefaultSimulationProject(): SimulationProjectData {
  return { schemaVersion: 1, definitions: [], bakes: [], cacheLimitBytes: 96 * 1024 * 1024 };
}

export function createSimulationDefinition(kind: SimulationKind, options: Partial<SimulationDefinition> = {}): SimulationDefinition {
  const now = new Date().toISOString();
  return {
    id: options.id ?? createId("simulation"),
    name: options.name?.trim() || kind,
    kind,
    enabled: options.enabled ?? true,
    seed: integer(options.seed, 3001, 0, 0xffffffff),
    startFrame: integer(options.startFrame, 0, 0, Number.MAX_SAFE_INTEGER),
    endFrame: integer(options.endFrame, 120, 0, Number.MAX_SAFE_INTEGER),
    quality: options.quality === "final" ? "final" : "draft",
    targetIds: Array.isArray(options.targetIds) ? [...new Set(options.targetIds.filter((id): id is string => typeof id === "string"))].slice(0, 256) : [],
    parameters: sanitizeParameters(options.parameters),
    status: options.status === "baking" || options.status === "baked" || options.status === "error" ? options.status : "dirty",
    updatedAt: options.updatedAt ?? now
  };
}

export function sanitizeSimulationProject(value: Partial<SimulationProjectData> | undefined): SimulationProjectData {
  if (!value) return createDefaultSimulationProject();
  const definitions = Array.isArray(value.definitions) ? value.definitions.slice(0, 1000).flatMap((entry) => {
    if (!entry || !KINDS.has(entry.kind)) return [];
    const definition = createSimulationDefinition(entry.kind, entry);
    return [{ ...definition, endFrame: Math.max(definition.startFrame, definition.endFrame), status: definition.status === "baking" ? "dirty" as const : definition.status }];
  }) : [];
  const known = new Set(definitions.map((definition) => definition.id));
  const bakes = Array.isArray(value.bakes) ? value.bakes.slice(0, 1000).flatMap((entry) => sanitizeBake(entry, known)) : [];
  return {
    schemaVersion: 1,
    definitions,
    bakes,
    cacheLimitBytes: integer(value.cacheLimitBytes, 96 * 1024 * 1024, 4 * 1024 * 1024, 512 * 1024 * 1024)
  };
}

function sanitizeBake(value: Partial<SimulationBake>, known: Set<string>): SimulationBake[] {
  if (!value.id || !value.simulationId || !known.has(value.simulationId) || !value.fingerprint) return [];
  const quality: SimulationQuality = value.quality === "final" ? "final" : "draft";
  const budget = SIMULATION_BUDGETS[quality];
  const samples = Array.isArray(value.samples) ? value.samples.slice(0, budget.maxSamples).flatMap(sanitizeSample) : [];
  return [{
    id: value.id,
    simulationId: value.simulationId,
    version: 1,
    fingerprint: value.fingerprint,
    quality,
    startFrame: integer(value.startFrame, 0, 0, Number.MAX_SAFE_INTEGER),
    endFrame: integer(value.endFrame, 0, 0, Number.MAX_SAFE_INTEGER),
    samples,
    editable: value.editable ?? true,
    createdAt: value.createdAt ?? new Date(0).toISOString()
  }];
}

function sanitizeSample(sample: Partial<SimulationSample>): SimulationSample[] {
  if (!sample.subjectId || !isVector(sample.position) || !isVector(sample.rotation) || !isVector(sample.scale)) return [];
  return [{ frame: integer(sample.frame, 0, 0, Number.MAX_SAFE_INTEGER), subjectId: sample.subjectId, position: sample.position, rotation: sample.rotation, scale: sample.scale, velocity: isVector(sample.velocity) ? sample.velocity : undefined, intensity: typeof sample.intensity === "number" && Number.isFinite(sample.intensity) ? sample.intensity : undefined }];
}

function sanitizeParameters(parameters: SimulationDefinition["parameters"] | undefined): SimulationDefinition["parameters"] {
  if (!parameters || typeof parameters !== "object") return {};
  const entries: Array<[string, number | string | boolean | [number, number, number]]> = [];
  for (const [key, value] of Object.entries(parameters).slice(0, 128)) {
    if (typeof value === "number" && Number.isFinite(value)) entries.push([key, value]);
    else if (typeof value === "string") entries.push([key, value.slice(0, 256)]);
    else if (typeof value === "boolean") entries.push([key, value]);
    else if (isVector(value)) entries.push([key, value]);
  }
  return Object.fromEntries(entries);
}

function isVector(value: unknown): value is [number, number, number] { return Array.isArray(value) && value.length === 3 && value.every((entry) => typeof entry === "number" && Number.isFinite(entry)); }
function integer(value: unknown, fallback: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, Math.round(typeof value === "number" && Number.isFinite(value) ? value : fallback))); }
