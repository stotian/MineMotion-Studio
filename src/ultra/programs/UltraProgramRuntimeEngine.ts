import type { UltraArcId, UltraEvidenceKind, UltraPhaseNumber } from "../UltraPhaseRegistry";

export type UltraProgramStrategy = "editor" | "graph" | "timeline" | "simulation" | "io" | "review" | "security";
export type UltraProgramExecutionMode = "preview" | "apply" | "validate";

export interface UltraProgramPhaseDescriptor {
  phase: UltraPhaseNumber;
  title: string;
  operatorId: string;
  testId: string;
  evidence: UltraEvidenceKind;
  deliverables: readonly [string, string, string];
}

export interface UltraProgramDescriptor {
  id: string;
  arc: UltraArcId;
  program: string;
  problem: string;
  fixture: string;
  inspiration: string;
  strategy: UltraProgramStrategy;
  sourceCore: string;
  maximumOperations: number;
  maximumResourceUnits: number;
  maximumSelection: number;
  supportsPreview: boolean;
  requiresConfirmation: boolean;
  phases: readonly UltraProgramPhaseDescriptor[];
}

export interface UltraProgramExecutionInput {
  mode: UltraProgramExecutionMode;
  selectionIds: readonly string[];
  frameRange: readonly [number, number];
  resourceUnits: number;
  seed: number;
  options?: Readonly<Record<string, string | number | boolean>>;
}

export interface UltraProgramExecutionResult {
  phase: UltraPhaseNumber;
  programId: string;
  operatorId: string;
  mode: UltraProgramExecutionMode;
  operationCount: number;
  changedIds: string[];
  outputIds: string[];
  resourceUnits: number;
  reversible: boolean;
  requiresConfirmation: boolean;
  diagnostics: string[];
  fingerprint: string;
}

export interface UltraProgramPhaseTestResult {
  phase: UltraPhaseNumber;
  passed: boolean;
  assertions: number;
  errors: string[];
  fingerprint: string;
}

export function defineUltraProgram(descriptor: UltraProgramDescriptor): UltraProgramDescriptor {
  const errors = validateUltraProgramDescriptor(descriptor);
  if (errors.length > 0) throw new Error(`Invalid Ultra program ${descriptor.id}: ${errors.join(", ")}`);
  return Object.freeze({
    ...descriptor,
    phases: Object.freeze(descriptor.phases.map((phase) => Object.freeze({
      ...phase,
      deliverables: Object.freeze([...phase.deliverables]) as readonly [string, string, string]
    })))
  });
}

export function validateUltraProgramDescriptor(descriptor: UltraProgramDescriptor): string[] {
  const errors: string[] = [];
  if (!/^[a-z][a-z0-9-]{2,80}$/.test(descriptor.id)) errors.push("PROGRAM_ID_INVALID");
  if (!descriptor.program || !descriptor.problem || !descriptor.fixture || !descriptor.inspiration) errors.push("PROGRAM_TEXT_MISSING");
  if (!descriptor.sourceCore.endsWith("Engine.ts")) errors.push("PROGRAM_SOURCE_CORE_INVALID");
  if (!Number.isInteger(descriptor.maximumOperations) || descriptor.maximumOperations < 1 || descriptor.maximumOperations > 64) errors.push("PROGRAM_OPERATION_BUDGET_INVALID");
  if (!Number.isInteger(descriptor.maximumResourceUnits) || descriptor.maximumResourceUnits < 16 || descriptor.maximumResourceUnits > 1_000_000) errors.push("PROGRAM_RESOURCE_BUDGET_INVALID");
  if (!Number.isInteger(descriptor.maximumSelection) || descriptor.maximumSelection < 1 || descriptor.maximumSelection > 100_000) errors.push("PROGRAM_SELECTION_BUDGET_INVALID");
  if (descriptor.phases.length !== 15) errors.push("PROGRAM_PHASE_COUNT_INVALID");
  const phaseIds = new Set<number>();
  const operators = new Set<string>();
  const tests = new Set<string>();
  for (const phase of descriptor.phases) {
    if (!Number.isInteger(phase.phase) || phase.phase < 136 || phase.phase > 600 || phaseIds.has(phase.phase)) errors.push("PROGRAM_PHASE_INVALID");
    phaseIds.add(phase.phase);
    if (!phase.title || !/^[a-z0-9]+(?:\.[a-z0-9]+)+$/.test(phase.operatorId) || operators.has(phase.operatorId)) errors.push("PROGRAM_OPERATOR_INVALID");
    operators.add(phase.operatorId);
    if (phase.testId !== `P${phase.phase}_${slug(phase.title).replace(/-/g, "_").toUpperCase()}_ACCEPTANCE` || tests.has(phase.testId)) errors.push("PROGRAM_TEST_ID_INVALID");
    tests.add(phase.testId);
    if (phase.deliverables.length !== 3 || phase.deliverables.some((item) => !item.trim())) errors.push("PROGRAM_DELIVERABLES_INVALID");
  }
  return [...new Set(errors)];
}

export function executeUltraProgramPhase(
  descriptor: UltraProgramDescriptor,
  phase: UltraPhaseNumber,
  input: UltraProgramExecutionInput
): UltraProgramExecutionResult {
  const phaseDescriptor = descriptor.phases.find((candidate) => candidate.phase === phase);
  if (!phaseDescriptor) throw new Error(`PROGRAM_PHASE_NOT_OWNED:${descriptor.id}:${phase}`);
  const mode: UltraProgramExecutionMode = input.mode === "apply" || input.mode === "validate" ? input.mode : "preview";
  const selectionIds = [...new Set(input.selectionIds.filter((id) => /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id)))]
    .sort()
    .slice(0, descriptor.maximumSelection);
  const startFrame = clampInt(Math.min(input.frameRange[0], input.frameRange[1]), 0, 10_000_000);
  const endFrame = clampInt(Math.max(input.frameRange[0], input.frameRange[1]), startFrame, 10_000_000);
  const requestedResourceUnits = clampInt(input.resourceUnits, 1, 1_000_000_000);
  const resourceUnits = Math.min(descriptor.maximumResourceUnits, strategyResourceUnits(descriptor.strategy, requestedResourceUnits, endFrame - startFrame + 1));
  const operationCount = 1 + (mix32(input.seed, hashString(phaseDescriptor.operatorId)) % descriptor.maximumOperations);
  const diagnostics: string[] = [];
  const unsafe = input.options?.unsafe === true;
  const missingSource = input.options?.missingSource === true;
  if (requestedResourceUnits > descriptor.maximumResourceUnits) diagnostics.push("PROGRAM_RESOURCE_BUDGET_CLAMPED");
  if (selectionIds.length < input.selectionIds.length) diagnostics.push("PROGRAM_SELECTION_SANITIZED");
  if (mode === "preview" && !descriptor.supportsPreview) diagnostics.push("PROGRAM_PREVIEW_UNAVAILABLE");
  if (descriptor.strategy === "security" && unsafe) diagnostics.push("PROGRAM_FAIL_CLOSED_UNSAFE_INPUT");
  if (descriptor.strategy === "io" && missingSource) diagnostics.push("PROGRAM_FAIL_CLOSED_MISSING_SOURCE");

  const failClosed = diagnostics.some((diagnostic) => diagnostic.startsWith("PROGRAM_FAIL_CLOSED"));
  const changedIds = mode === "apply" && !failClosed
    ? selectChangedIds(selectionIds, descriptor.strategy, phase, input.seed)
    : [];
  const outputCount = outputCountForStrategy(descriptor.strategy, selectionIds.length, endFrame - startFrame + 1);
  const outputIds = Array.from({ length: outputCount }, (_, index) => `${descriptor.id}:${phase}:output:${index + 1}`);
  const reversible = mode !== "validate" && descriptor.strategy !== "security";
  const resultWithoutFingerprint = {
    phase,
    programId: descriptor.id,
    operatorId: phaseDescriptor.operatorId,
    mode,
    operationCount,
    changedIds,
    outputIds,
    resourceUnits,
    reversible,
    requiresConfirmation: descriptor.requiresConfirmation && mode === "apply",
    diagnostics: [...new Set(diagnostics)].sort()
  };
  return { ...resultWithoutFingerprint, fingerprint: fingerprint({ ...resultWithoutFingerprint, seed: input.seed | 0 }) };
}

export function runUltraProgramDescriptorPhaseTest(
  descriptor: UltraProgramDescriptor,
  phase: UltraPhaseNumber
): UltraProgramPhaseTestResult {
  const errors = validateUltraProgramDescriptor(descriptor);
  const selectionIds = Array.from({ length: 12 }, (_, index) => `fixture_${phase}_${index + 1}`);
  const input: UltraProgramExecutionInput = {
    mode: "apply",
    selectionIds,
    frameRange: [phase, phase + 24],
    resourceUnits: descriptor.maximumResourceUnits + 5,
    seed: phase * 31,
    options: descriptor.strategy === "security" ? { unsafe: false } : descriptor.strategy === "io" ? { missingSource: false } : {}
  };
  const first = executeUltraProgramPhase(descriptor, phase, input);
  const second = executeUltraProgramPhase(descriptor, phase, input);
  if (first.fingerprint !== second.fingerprint || stableStringify(first) !== stableStringify(second)) errors.push("PROGRAM_EXECUTION_NON_DETERMINISTIC");
  if (first.operationCount < 1 || first.operationCount > descriptor.maximumOperations) errors.push("PROGRAM_OPERATION_BUDGET_EXCEEDED");
  if (first.resourceUnits < 1 || first.resourceUnits > descriptor.maximumResourceUnits) errors.push("PROGRAM_RESOURCE_BUDGET_EXCEEDED");
  if (first.changedIds.length > descriptor.maximumSelection) errors.push("PROGRAM_SELECTION_BUDGET_EXCEEDED");
  if (new Set(first.outputIds).size !== first.outputIds.length || first.outputIds.length < 1) errors.push("PROGRAM_OUTPUT_INVALID");
  if (first.diagnostics.includes("PROGRAM_RESOURCE_BUDGET_CLAMPED") === false) errors.push("PROGRAM_RESOURCE_CLAMP_NOT_REPORTED");
  if (descriptor.strategy === "security") {
    const blocked = executeUltraProgramPhase(descriptor, phase, { ...input, options: { unsafe: true } });
    if (blocked.changedIds.length !== 0 || !blocked.diagnostics.includes("PROGRAM_FAIL_CLOSED_UNSAFE_INPUT")) errors.push("PROGRAM_SECURITY_FAIL_CLOSED_INVALID");
  }
  if (descriptor.strategy === "io") {
    const blocked = executeUltraProgramPhase(descriptor, phase, { ...input, options: { missingSource: true } });
    if (blocked.changedIds.length !== 0 || !blocked.diagnostics.includes("PROGRAM_FAIL_CLOSED_MISSING_SOURCE")) errors.push("PROGRAM_IO_FAIL_CLOSED_INVALID");
  }
  return {
    phase,
    passed: errors.length === 0,
    assertions: descriptor.strategy === "security" || descriptor.strategy === "io" ? 8 : 7,
    errors: [...new Set(errors)],
    fingerprint: fingerprint({ descriptor: descriptor.id, phase, execution: first.fingerprint })
  };
}

function strategyResourceUnits(strategy: UltraProgramStrategy, requested: number, frameSpan: number): number {
  if (strategy === "timeline") return requested + Math.min(frameSpan, 100_000);
  if (strategy === "simulation") return requested * 2 + Math.min(frameSpan * 4, 250_000);
  if (strategy === "graph") return requested + 32;
  if (strategy === "io") return requested + 64;
  if (strategy === "security") return Math.max(16, Math.ceil(requested / 2));
  if (strategy === "review") return requested + 8;
  return requested;
}

function selectChangedIds(ids: readonly string[], strategy: UltraProgramStrategy, phase: number, seed: number): string[] {
  if (strategy === "review") return ids.slice(0, Math.min(1, ids.length));
  const divisor = strategy === "simulation" ? 2 : strategy === "graph" ? 3 : strategy === "timeline" ? 4 : 5;
  const selected = ids.filter((id) => mix32(hashString(id), seed ^ phase) % divisor !== 0);
  return selected.length > 0 || ids.length === 0 ? selected : [ids[0]];
}

function outputCountForStrategy(strategy: UltraProgramStrategy, selectionCount: number, frameSpan: number): number {
  if (strategy === "simulation") return clampInt(Math.ceil(frameSpan / 24), 1, 64);
  if (strategy === "graph") return clampInt(Math.ceil(selectionCount / 4), 1, 32);
  if (strategy === "timeline") return clampInt(Math.ceil(frameSpan / 48), 1, 32);
  if (strategy === "io") return 3;
  if (strategy === "security") return 2;
  return 1;
}

function fingerprint(value: unknown): string {
  return hashString(stableStringify(value)).toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
}

function slug(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mix32(a: number, b: number): number {
  let value = (a ^ b) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}

function clampInt(value: number, minimum: number, maximum: number): number {
  return Math.round(Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum)));
}
