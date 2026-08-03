import rawRoadmap from "./UltraRoadmap84To600.json";
import type { UltraArcId, UltraPhaseDefinition, UltraPhaseNumber } from "../UltraPhaseRegistry";

interface RawRoadmapPhase {
  number: number;
  arc: string;
  title: string;
  program: string;
  objective: string;
  gate: string;
  dependencies: number[];
  deliverables: string[];
  inspiration: string;
  evidence: string;
  sourceCore: string;
  testId: string;
  maturity: string;
}

const SUPPORTED_EVIDENCE = new Set([
  "deterministic", "visual", "performance", "native", "security",
  "interoperability", "workflow", "reliability", "accessibility"
]);

function assertText(value: unknown, field: string, phase: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Ultra roadmap phase ${phase} has invalid ${field}.`);
  }
  return value.trim();
}

function normalizePhase(raw: RawRoadmapPhase): UltraPhaseDefinition {
  if (!Number.isInteger(raw.number) || raw.number < 84 || raw.number > 600) {
    throw new Error(`Ultra roadmap contains invalid phase number ${String(raw.number)}.`);
  }
  if (!Array.isArray(raw.dependencies) || raw.dependencies.some((dependency) => !Number.isInteger(dependency) || dependency < 36 || dependency >= raw.number)) {
    throw new Error(`Ultra roadmap phase ${raw.number} has invalid dependencies.`);
  }
  if (!Array.isArray(raw.deliverables) || raw.deliverables.length !== 3) {
    throw new Error(`Ultra roadmap phase ${raw.number} must define exactly three deliverables.`);
  }
  const evidence = assertText(raw.evidence, "evidence", raw.number);
  if (!SUPPORTED_EVIDENCE.has(evidence)) {
    throw new Error(`Ultra roadmap phase ${raw.number} uses unsupported evidence kind ${evidence}.`);
  }
  return Object.freeze({
    number: raw.number as UltraPhaseNumber,
    arc: assertText(raw.arc, "arc", raw.number) as UltraArcId,
    title: assertText(raw.title, "title", raw.number),
    program: assertText(raw.program, "program", raw.number),
    objective: assertText(raw.objective, "objective", raw.number),
    gate: assertText(raw.gate, "gate", raw.number),
    dependencies: Object.freeze([...raw.dependencies]) as readonly UltraPhaseNumber[],
    deliverables: Object.freeze(raw.deliverables.map((item) => assertText(item, "deliverable", raw.number))) as readonly string[],
    inspiration: assertText(raw.inspiration, "inspiration", raw.number),
    evidence: evidence as UltraPhaseDefinition["evidence"],
    sourceCore: assertText(raw.sourceCore, "sourceCore", raw.number),
    testId: assertText(raw.testId, "testId", raw.number),
    maturity: raw.maturity === "source-foundation" ? "source-foundation" : "planned"
  });
}

const normalized = (rawRoadmap as RawRoadmapPhase[]).map(normalizePhase);
const expectedCount = 600 - 84 + 1;
if (normalized.length !== expectedCount) {
  throw new Error(`Ultra roadmap contains ${normalized.length} phases, expected ${expectedCount}.`);
}
for (let index = 0; index < normalized.length; index += 1) {
  const expected = 84 + index;
  if (normalized[index].number !== expected) {
    throw new Error(`Ultra roadmap is not contiguous at index ${index}; expected phase ${expected}.`);
  }
}

export const ULTRA_ROADMAP_PHASES_84_600: readonly UltraPhaseDefinition[] = Object.freeze(normalized);
