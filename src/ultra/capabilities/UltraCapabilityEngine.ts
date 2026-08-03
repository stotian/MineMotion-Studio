import { getUltraPhaseDefinition, type UltraPhaseDefinition, type UltraPhaseNumber } from "../UltraPhaseRegistry";
import { getUltraProgramDescriptor, runUltraProgramPhaseTest } from "../programs/UltraProgramRegistry";
import type {
  UltraCapabilityExecutionPlan,
  UltraCapabilityExecutionStep,
  UltraCapabilityRecord,
  UltraCapabilityTestResult
} from "./UltraCapabilityTypes";

const MAX_OPERATORS = 16;
const MAX_LIST_ITEMS = 32;
const MAX_TEXT = 4096;

export function createUltraCapabilityRecord(
  phase: UltraPhaseNumber,
  sequence = 1,
  now = new Date().toISOString()
): UltraCapabilityRecord {
  const definition = getUltraPhaseDefinition(phase);
  if (phase < 84) throw new Error(`Phase ${phase} uses a dedicated legacy Ultra record.`);
  const deliverables = [...(definition.deliverables ?? [])];
  if (deliverables.length !== 3 || !definition.testId || !definition.sourceCore || !definition.evidence) {
    throw new Error(`Phase ${phase} is missing its capability blueprint.`);
  }
  const id = `ultra_${phase}_${sequence}`;
  const operatorStem = slug(definition.title);
  const acceptanceSeed = mix32(phase, hashString(definition.testId));
  const recordWithoutFingerprint: Omit<UltraCapabilityRecord, "sourceFingerprint"> = {
    id,
    name: `${definition.title} ${sequence}`,
    enabled: true,
    notes: "",
    tags: [...new Set([definition.arc, definition.evidence, "source-foundation"])],
    createdAt: now,
    updatedAt: now,
    phase,
    arc: definition.arc,
    program: definition.program ?? definition.arc,
    objective: definition.objective,
    deliverables,
    operators: [
      `${operatorStem}.configure`,
      `${operatorStem}.evaluate`,
      `${operatorStem}.validate`
    ],
    inputs: ["MineMotionProject.ultra", `phase:${phase}:settings`, `phase:${phase}:fixture`],
    outputs: [`phase:${phase}:artifact`, `phase:${phase}:diagnostics`, `phase:${phase}:evidence`],
    automationHooks: [`before:${operatorStem}`, `after:${operatorStem}`],
    fallbacks: ["preserve-source", "disable-capability", "emit-actionable-diagnostic"],
    evidence: definition.evidence,
    sourceCore: definition.sourceCore,
    inspiration: definition.inspiration ?? "MineMotion production design",
    budget: createBudget(definition),
    acceptance: {
      testId: definition.testId,
      fixture: extractFixture(definition.gate),
      deterministicSeed: acceptanceSeed,
      assertions: [
        "record validates without errors",
        "execution plan is deterministic",
        "save reload and undo metadata remain stable",
        "resource budgets and fallback paths are explicit"
      ]
    }
  };
  return {
    ...recordWithoutFingerprint,
    sourceFingerprint: fingerprint(recordWithoutFingerprint)
  };
}


export function refreshUltraCapabilityFingerprint(record: UltraCapabilityRecord): UltraCapabilityRecord {
  const { sourceFingerprint: _ignored, ...withoutFingerprint } = record;
  return { ...record, sourceFingerprint: fingerprint(withoutFingerprint) };
}

export function validateUltraCapabilityRecord(
  record: UltraCapabilityRecord,
  expectedPhase: UltraPhaseNumber = record.phase
): string[] {
  const errors: string[] = [];
  const definition = getUltraPhaseDefinition(expectedPhase);
  if (expectedPhase < 84) errors.push("CAPABILITY_PHASE_BELOW_84");
  if (record.phase !== expectedPhase) errors.push("CAPABILITY_PHASE_MISMATCH");
  if (record.arc !== definition.arc) errors.push("CAPABILITY_ARC_MISMATCH");
  if (!record.id || !record.name) errors.push("CAPABILITY_IDENTITY_MISSING");
  if (!record.program || !record.objective) errors.push("CAPABILITY_INTENT_MISSING");
  if (record.deliverables.length !== 3) errors.push("CAPABILITY_DELIVERABLE_COUNT");
  if (record.operators.length < 1 || record.operators.length > MAX_OPERATORS) errors.push("CAPABILITY_OPERATOR_COUNT");
  if (new Set(record.operators).size !== record.operators.length) errors.push("CAPABILITY_OPERATOR_DUPLICATE");
  if (record.inputs.length < 1 || record.inputs.length > MAX_LIST_ITEMS) errors.push("CAPABILITY_INPUT_COUNT");
  if (record.outputs.length < 1 || record.outputs.length > MAX_LIST_ITEMS) errors.push("CAPABILITY_OUTPUT_COUNT");
  if (record.fallbacks.length < 1 || record.fallbacks.length > MAX_LIST_ITEMS) errors.push("CAPABILITY_FALLBACK_COUNT");
  if (!record.sourceCore || !record.acceptance.testId || !record.acceptance.fixture) errors.push("CAPABILITY_EVIDENCE_MISSING");
  if (record.acceptance.testId !== definition.testId) errors.push("CAPABILITY_TEST_ID_MISMATCH");
  if (expectedPhase >= 136) {
    const program = getUltraProgramDescriptor(expectedPhase);
    if (record.program !== program.program) errors.push("CAPABILITY_PROGRAM_MISMATCH");
    if (record.sourceCore !== program.sourceCore) errors.push("CAPABILITY_SOURCE_CORE_MISMATCH");
    if (!program.phases.some((phase) => phase.phase === expectedPhase && phase.testId === record.acceptance.testId)) errors.push("CAPABILITY_PROGRAM_PHASE_MISMATCH");
  }
  if (!Number.isInteger(record.acceptance.deterministicSeed)) errors.push("CAPABILITY_SEED_INVALID");
  if (record.acceptance.assertions.length < 1) errors.push("CAPABILITY_ASSERTION_MISSING");
  if (!Number.isFinite(record.budget.maximumOperations) || record.budget.maximumOperations < 1) errors.push("CAPABILITY_OPERATION_BUDGET_INVALID");
  if (!Number.isFinite(record.budget.maximumMemoryMb) || record.budget.maximumMemoryMb < 16) errors.push("CAPABILITY_MEMORY_BUDGET_INVALID");
  if (!Number.isFinite(record.budget.maximumSerializedBytes) || record.budget.maximumSerializedBytes < 1024) errors.push("CAPABILITY_SERIALIZATION_BUDGET_INVALID");
  for (const text of collectText(record)) {
    if (text.length > MAX_TEXT) errors.push("CAPABILITY_TEXT_LIMIT");
  }
  const { sourceFingerprint: _ignored, ...withoutFingerprint } = record;
  if (fingerprint(withoutFingerprint) !== record.sourceFingerprint) errors.push("CAPABILITY_FINGERPRINT_MISMATCH");
  return [...new Set(errors)];
}

export function createUltraCapabilityExecutionPlan(
  record: UltraCapabilityRecord,
  workload = 1
): UltraCapabilityExecutionPlan {
  const safeWorkload = clamp(Math.round(workload), 1, 10_000);
  const baseMemory = Math.max(1, Math.floor(record.budget.maximumMemoryMb / Math.max(1, record.deliverables.length)));
  const steps: UltraCapabilityExecutionStep[] = record.deliverables.map((label, index) => ({
    id: `${record.id}:step:${index + 1}`,
    label,
    order: index,
    reversible: true,
    estimatedMemoryMb: clamp(baseMemory + ((safeWorkload + record.phase + index) % 7), 1, record.budget.maximumMemoryMb)
  }));
  steps.push({
    id: `${record.id}:step:validate`,
    label: `Run ${record.acceptance.testId}`,
    order: steps.length,
    reversible: false,
    estimatedMemoryMb: clamp(Math.ceil(baseMemory / 2), 1, record.budget.maximumMemoryMb)
  });
  const totalEstimatedMemoryMb = steps.reduce((sum, step) => sum + step.estimatedMemoryMb, 0);
  return {
    phase: record.phase,
    recordId: record.id,
    steps,
    totalEstimatedMemoryMb,
    fingerprint: fingerprint({
      phase: record.phase,
      recordId: record.id,
      steps,
      workload: safeWorkload,
      seed: record.acceptance.deterministicSeed
    })
  };
}

export function runUltraCapabilityPhaseTest(record: UltraCapabilityRecord): UltraCapabilityTestResult {
  const errors = validateUltraCapabilityRecord(record);
  const first = createUltraCapabilityExecutionPlan(record, 3);
  const second = createUltraCapabilityExecutionPlan(record, 3);
  if (stableStringify(first) !== stableStringify(second)) errors.push("CAPABILITY_PLAN_NON_DETERMINISTIC");
  if (first.steps.length < 2) errors.push("CAPABILITY_PLAN_EMPTY");
  if (first.steps.some((step, index) => step.order !== index)) errors.push("CAPABILITY_PLAN_ORDER_INVALID");
  if (first.totalEstimatedMemoryMb > record.budget.maximumMemoryMb * first.steps.length) errors.push("CAPABILITY_PLAN_MEMORY_EXCEEDED");
  if (record.operators.length > record.budget.maximumOperations) errors.push("CAPABILITY_OPERATOR_BUDGET_EXCEEDED");
  let programAssertions = 0;
  let programFingerprint = "";
  if (record.phase >= 136) {
    const programResult = runUltraProgramPhaseTest(record.phase);
    errors.push(...programResult.errors);
    programAssertions = programResult.assertions;
    programFingerprint = programResult.fingerprint;
  }
  const fingerprintValue = fingerprint({ record: record.sourceFingerprint, plan: first.fingerprint, program: programFingerprint });
  return {
    phase: record.phase,
    testId: record.acceptance.testId,
    passed: errors.length === 0,
    assertions: record.acceptance.assertions.length + 5 + programAssertions,
    errors: [...new Set(errors)],
    fingerprint: fingerprintValue
  };
}

export function buildUltraDependencyPlan(phases: readonly UltraPhaseNumber[]): UltraPhaseNumber[] {
  const visited = new Set<UltraPhaseNumber>();
  const active = new Set<UltraPhaseNumber>();
  const ordered: UltraPhaseNumber[] = [];
  const visit = (phase: UltraPhaseNumber) => {
    if (visited.has(phase)) return;
    if (active.has(phase)) throw new Error(`Ultra phase dependency cycle at ${phase}.`);
    active.add(phase);
    for (const dependency of getUltraPhaseDefinition(phase).dependencies) {
      visit(dependency);
    }
    active.delete(phase);
    visited.add(phase);
    ordered.push(phase);
  };
  for (const phase of phases) visit(phase);
  return ordered;
}

export function searchUltraCapabilities(query: string, phases: readonly UltraPhaseDefinition[]): UltraPhaseDefinition[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...phases];
  return phases
    .map((phase) => {
      const haystack = [phase.title, phase.program, phase.objective, phase.gate, phase.arc, ...(phase.deliverables ?? [])]
        .filter((value): value is string => typeof value === "string")
        .join(" ")
        .toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { phase, score };
    })
    .filter((entry) => entry.score === terms.length)
    .sort((a, b) => b.score - a.score || a.phase.number - b.phase.number)
    .map((entry) => entry.phase);
}

function createBudget(definition: UltraPhaseDefinition): UltraCapabilityRecord["budget"] {
  const evidenceMultiplier = definition.evidence === "performance" ? 2 : definition.evidence === "visual" ? 1.5 : 1;
  return {
    maximumOperations: 8,
    maximumMemoryMb: Math.round((128 + (definition.number % 8) * 32) * evidenceMultiplier),
    maximumBackgroundTasks: 1 + (definition.number % 4),
    maximumSerializedBytes: 32_768 + (definition.number % 16) * 4096
  };
}

function collectText(record: UltraCapabilityRecord): string[] {
  return [
    record.id, record.name, record.notes, record.program, record.objective, record.sourceCore,
    record.inspiration, record.acceptance.testId, record.acceptance.fixture,
    ...record.tags, ...record.deliverables, ...record.operators, ...record.inputs,
    ...record.outputs, ...record.automationHooks, ...record.fallbacks, ...record.acceptance.assertions
  ];
}

function extractFixture(gate: string): string {
  const match = /^The (.+?) fixture /i.exec(gate);
  return match?.[1]?.trim() || "Ultra acceptance fixture";
}

function fingerprint(value: unknown): string {
  return hashString(stableStringify(value)).toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`);
  return `{${entries.join(",")}}`;
}

function slug(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 64);
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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
