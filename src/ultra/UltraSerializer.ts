import { createDefaultUltraProjectData } from "./UltraDefaults";
import { validateUltraPhaseRecords } from "./UltraDomainValidation";
import {
  ULTRA_PHASE_DEFINITIONS,
  ULTRA_PHASE_NUMBERS,
  isUltraArcId,
  isUltraPhaseNumber,
  type UltraArcId,
  type UltraPhaseNumber,
  type UltraPhaseStatus
} from "./UltraPhaseRegistry";
import { refreshUltraCapabilityFingerprint, validateUltraCapabilityRecord } from "./capabilities/UltraCapabilityEngine";
import type { UltraCapabilityRecord } from "./capabilities/UltraCapabilityTypes";
import type { UltraBaseRecord, UltraProjectData, UltraValidationIssue, UltraValidationReport } from "./UltraTypes";

const MAX_RECORDS_PER_PHASE = 512;
const MAX_TOTAL_RECORDS = 16_384;
const MAX_STRING_LENGTH = 4096;
const MAX_ARRAY_LENGTH = 8192;
const MAX_OBJECT_KEYS = 512;
const MAX_DEPTH = 8;
const FIRST_CAPABILITY_PHASE = 84;

type LegacyArcId = "performance" | "directing" | "entities" | "world" | "rendering";
type LegacyPhasePath = readonly [LegacyArcId, string];

const ARC_KEYS = {
  performance: [
    "facialProfiles", "correctiveRules", "contactConstraints", "animationLayers",
    "retargetProfiles", "locomotionPlans", "performancePresets", "mocapSessions",
    "curvePresets", "animationGraphs"
  ],
  directing: [
    "cameraProfiles", "cameraRigs", "compositionChecks", "continuityAxes", "focusCues",
    "blockingSnapshots", "storyboardLinks", "takeGroups", "annotations", "sequences"
  ],
  entities: [
    "catalogEntries", "customMobs", "equipmentSets", "secondaryMotionProfiles",
    "attentionCues", "locomotionProfiles", "combatSequences", "parkourPaths",
    "actingBeats", "crowdGroups"
  ],
  world: [
    "setLayers", "destructionEvents", "debrisProfiles", "rigidBodies", "fluidVolumes",
    "combustionSources", "redstoneGraphs", "vehicles", "weatherPresets", "battleScenarios"
  ],
  rendering: [
    "materialProfiles", "lights", "volumetricProfiles", "skyProfiles", "vfxGraphs",
    "minecraftEffects", "compositingGraphs", "colorProfiles"
  ]
} as const;

const LEGACY_PHASE_DEFINITIONS = ULTRA_PHASE_DEFINITIONS.filter((definition) => definition.number < FIRST_CAPABILITY_PHASE);
const PHASE_PATHS: Readonly<Partial<Record<UltraPhaseNumber, LegacyPhasePath>>> = Object.freeze(Object.fromEntries(
  LEGACY_PHASE_DEFINITIONS.map((definition, index) => {
    const arc = definition.arc as LegacyArcId;
    const arcIndex = index % 10;
    const key = ARC_KEYS[arc][arcIndex];
    if (!key) throw new Error(`Ultra legacy phase ${definition.number} has no storage key.`);
    return [definition.number, [arc, key] as const];
  })
));

export function sanitizeUltraProjectData(value: unknown, now = new Date().toISOString()): UltraProjectData {
  const defaults = createDefaultUltraProjectData(now);
  if (!isRecord(value)) return defaults;
  const schemaVersion = value.schemaVersion === 1 ? 1 : defaults.schemaVersion;
  const activeArc = isUltraArcId(value.activeArc) ? value.activeArc : defaults.activeArc;
  const sourcePhaseStates = isRecord(value.phaseStates) ? value.phaseStates : {};

  let totalRecords = 0;
  const sanitizedArcs: Record<LegacyArcId, Record<string, UltraBaseRecord[]>> = {
    performance: {},
    directing: {},
    entities: {},
    world: {},
    rendering: {}
  };

  for (const arc of Object.keys(ARC_KEYS) as LegacyArcId[]) {
    const sourceArc = isRecord(value[arc]) ? value[arc] : {};
    for (const key of ARC_KEYS[arc]) {
      if (totalRecords >= MAX_TOTAL_RECORDS) {
        sanitizedArcs[arc][key] = [];
        continue;
      }
      const remaining = Math.min(MAX_RECORDS_PER_PHASE, MAX_TOTAL_RECORDS - totalRecords);
      const records = sanitizeRecordArray(sourceArc[key], remaining, now);
      sanitizedArcs[arc][key] = records;
      totalRecords += records.length;
    }
  }

  const capabilityRemaining = Math.max(0, MAX_TOTAL_RECORDS - totalRecords);
  const capabilityCounts = new Map<UltraPhaseNumber, number>();
  const capabilities = sanitizeRecordArray(value.capabilities, capabilityRemaining, now)
    .filter((record) => {
      const phase = (record as unknown as { phase?: unknown }).phase;
      if (!isUltraPhaseNumber(phase) || phase < FIRST_CAPABILITY_PHASE) return false;
      const count = capabilityCounts.get(phase) ?? 0;
      if (count >= MAX_RECORDS_PER_PHASE) return false;
      capabilityCounts.set(phase, count + 1);
      return true;
    })
    .map((record) => record as UltraCapabilityRecord);

  const phaseStates = Object.fromEntries(ULTRA_PHASE_NUMBERS.map((phase) => {
    const phaseStateCandidate = sourcePhaseStates[String(phase)];
    const source: Record<string, unknown> = isRecord(phaseStateCandidate) ? phaseStateCandidate : {};
    const artifactCount = getPhaseRecordsFromParts(sanitizedArcs, capabilities, phase).length;
    const configuredStatus: UltraPhaseStatus = artifactCount > 0 ? "configured" : "planned";
    const status = isUltraPhaseStatus(source.status) ? source.status : configuredStatus;
    return [String(phase), {
      phase,
      status: artifactCount === 0 && status === "validated" ? "planned" : status,
      artifactCount,
      validationErrors: sanitizeStringArray(source.validationErrors, 64, 512),
      validationWarnings: sanitizeStringArray(source.validationWarnings, 64, 512),
      updatedAt: sanitizeDate(source.updatedAt, now)
    }];
  }));

  return {
    schemaVersion,
    phaseStates,
    performance: sanitizedArcs.performance as unknown as UltraProjectData["performance"],
    directing: sanitizedArcs.directing as unknown as UltraProjectData["directing"],
    entities: sanitizedArcs.entities as unknown as UltraProjectData["entities"],
    world: sanitizedArcs.world as unknown as UltraProjectData["world"],
    rendering: sanitizedArcs.rendering as unknown as UltraProjectData["rendering"],
    capabilities,
    activeArc,
    updatedAt: sanitizeDate(value.updatedAt, now)
  };
}

export function validateUltraProjectData(data: UltraProjectData): UltraValidationReport {
  const issues: UltraValidationIssue[] = [];
  let configuredPhases = 0;

  for (const definition of ULTRA_PHASE_DEFINITIONS) {
    const records = getUltraPhaseRecords(data, definition.number);
    if (records.length > 0) configuredPhases += 1;
    const duplicateIds = findDuplicateIds(records);
    for (const duplicate of duplicateIds) {
      issues.push({
        phase: definition.number,
        severity: "error",
        code: "DUPLICATE_ID",
        message: `Phase ${definition.number} contains duplicate record id ${duplicate}.`,
        recordId: duplicate
      });
    }
    if (records.length > MAX_RECORDS_PER_PHASE) {
      issues.push({
        phase: definition.number,
        severity: "error",
        code: "RECORD_LIMIT",
        message: `Phase ${definition.number} exceeds ${MAX_RECORDS_PER_PHASE} records.`
      });
    }
    for (const record of records) {
      if (!record.id || !record.name) {
        issues.push({
          phase: definition.number,
          severity: "error",
          code: "INVALID_RECORD_IDENTITY",
          message: `Phase ${definition.number} contains a record without an id or name.`,
          recordId: record.id
        });
      }
    }
    if (definition.number < FIRST_CAPABILITY_PHASE) {
      issues.push(...validateUltraPhaseRecords(definition.number, records));
    } else {
      for (const record of records) {
        const capabilityErrors = validateUltraCapabilityRecord(record as UltraCapabilityRecord, definition.number);
        for (const code of capabilityErrors) {
          issues.push({
            phase: definition.number,
            severity: "error",
            code,
            message: `Phase ${definition.number} capability ${record.id} failed ${code}.`,
            recordId: record.id
          });
        }
      }
    }
    const missingDependencies = definition.dependencies.filter((dependency) => {
      const dependencyState = data.phaseStates[String(dependency)];
      return dependencyState?.artifactCount === 0;
    });
    if (records.length > 0 && missingDependencies.length > 0) {
      issues.push({
        phase: definition.number,
        severity: "warning",
        code: "MISSING_DEPENDENCY_ARTIFACT",
        message: `Phase ${definition.number} is configured before dependencies ${missingDependencies.join(", ")}.`
      });
    }
  }

  validateVfxReferences(data, issues);

  const validatedPhases = ULTRA_PHASE_DEFINITIONS.filter((definition) => {
    const records = getUltraPhaseRecords(data, definition.number);
    return records.length > 0 && !issues.some((issue) => issue.phase === definition.number && issue.severity === "error");
  }).length;

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    configuredPhases,
    validatedPhases,
    issues
  };
}

export function markUltraValidationState(data: UltraProjectData, report: UltraValidationReport, now = new Date().toISOString()): UltraProjectData {
  const phaseStates = { ...data.phaseStates };
  for (const phase of ULTRA_PHASE_NUMBERS) {
    const phaseIssues = report.issues.filter((issue) => issue.phase === phase);
    const state = phaseStates[String(phase)] ?? {
      phase,
      status: "planned" as const,
      artifactCount: 0,
      validationErrors: [],
      validationWarnings: [],
      updatedAt: now
    };
    const errors = phaseIssues.filter((issue) => issue.severity === "error").map((issue) => issue.message);
    const warnings = phaseIssues.filter((issue) => issue.severity === "warning").map((issue) => issue.message);
    phaseStates[String(phase)] = {
      ...state,
      status: state.artifactCount === 0 ? "planned" : errors.length > 0 ? "blocked" : "validated",
      validationErrors: errors,
      validationWarnings: warnings,
      updatedAt: now
    };
  }
  return { ...data, phaseStates, updatedAt: now };
}

export function removeUltraPhaseRecord(data: UltraProjectData, phase: UltraPhaseNumber, recordId: string, now = new Date().toISOString()): UltraProjectData {
  if (phase >= FIRST_CAPABILITY_PHASE) {
    const current = data.capabilities.filter((record) => record.phase === phase);
    const capabilities = data.capabilities.filter((record) => !(record.phase === phase && record.id === recordId));
    const nextCount = capabilities.filter((record) => record.phase === phase).length;
    if (nextCount === current.length) return data;
    return {
      ...data,
      capabilities,
      phaseStates: updatePhaseStateAfterMutation(data, phase, nextCount, now),
      updatedAt: now
    };
  }
  const [arc, key] = getLegacyPath(phase);
  const arcData = data[arc] as unknown as Record<string, UltraBaseRecord[]>;
  const current = arcData[key] ?? [];
  const next = current.filter((record) => record.id !== recordId);
  if (next.length === current.length) return data;
  return {
    ...data,
    [arc]: { ...data[arc], [key]: next },
    phaseStates: updatePhaseStateAfterMutation(data, phase, next.length, now),
    updatedAt: now
  } as UltraProjectData;
}

export function updateUltraPhaseRecordMetadata(
  data: UltraProjectData,
  phase: UltraPhaseNumber,
  recordId: string,
  patch: { name?: string; enabled?: boolean; notes?: string; tags?: string[] },
  now = new Date().toISOString()
): UltraProjectData {
  if (phase >= FIRST_CAPABILITY_PHASE) {
    let changed = false;
    const capabilities = data.capabilities.map((record) => {
      if (record.phase !== phase || record.id !== recordId) return record;
      changed = true;
      return refreshUltraCapabilityFingerprint(patchRecordMetadata(record, patch, now) as UltraCapabilityRecord);
    });
    if (!changed) return data;
    return {
      ...data,
      capabilities,
      phaseStates: updatePhaseStateAfterMutation(data, phase, capabilities.filter((record) => record.phase === phase).length, now),
      updatedAt: now
    };
  }
  const [arc, key] = getLegacyPath(phase);
  const arcData = data[arc] as unknown as Record<string, UltraBaseRecord[]>;
  const current = arcData[key] ?? [];
  let changed = false;
  const next = current.map((record) => {
    if (record.id !== recordId) return record;
    changed = true;
    return patchRecordMetadata(record, patch, now);
  });
  if (!changed) return data;
  return {
    ...data,
    [arc]: { ...data[arc], [key]: next },
    phaseStates: updatePhaseStateAfterMutation(data, phase, next.length, now),
    updatedAt: now
  } as UltraProjectData;
}

export function setUltraActiveArc(data: UltraProjectData, activeArc: UltraArcId, now = new Date().toISOString()): UltraProjectData {
  return { ...data, activeArc, updatedAt: now };
}

export function getUltraPhaseRecords(data: UltraProjectData, phase: UltraPhaseNumber): UltraBaseRecord[] {
  if (phase >= FIRST_CAPABILITY_PHASE) {
    return data.capabilities.filter((record) => record.phase === phase);
  }
  const [arc, key] = getLegacyPath(phase);
  return [...(((data[arc] as unknown as Record<string, UltraBaseRecord[]>)[key]) ?? [])];
}

function getPhaseRecordsFromParts(
  arcs: Record<LegacyArcId, Record<string, UltraBaseRecord[]>>,
  capabilities: UltraCapabilityRecord[],
  phase: UltraPhaseNumber
): UltraBaseRecord[] {
  if (phase >= FIRST_CAPABILITY_PHASE) return capabilities.filter((record) => record.phase === phase);
  const [arc, key] = getLegacyPath(phase);
  return arcs[arc][key] ?? [];
}

function getLegacyPath(phase: UltraPhaseNumber): LegacyPhasePath {
  const path = PHASE_PATHS[phase];
  if (!path) throw new Error(`Ultra phase ${phase} does not use legacy arc storage.`);
  return path;
}

function updatePhaseStateAfterMutation(
  data: UltraProjectData,
  phase: UltraPhaseNumber,
  artifactCount: number,
  now: string
): UltraProjectData["phaseStates"] {
  return {
    ...data.phaseStates,
    [String(phase)]: {
      ...(data.phaseStates[String(phase)] ?? { phase }),
      phase,
      status: artifactCount > 0 ? "configured" : "planned",
      artifactCount,
      validationErrors: [],
      validationWarnings: [],
      updatedAt: now
    }
  };
}

function patchRecordMetadata(
  record: UltraBaseRecord,
  patch: { name?: string; enabled?: boolean; notes?: string; tags?: string[] },
  now: string
): UltraBaseRecord {
  return {
    ...record,
    name: typeof patch.name === "string" ? patch.name.trim().slice(0, 160) || record.name : record.name,
    enabled: typeof patch.enabled === "boolean" ? patch.enabled : record.enabled,
    notes: typeof patch.notes === "string" ? patch.notes.slice(0, 2048) : record.notes,
    tags: Array.isArray(patch.tags)
      ? [...new Set(patch.tags.map((tag) => tag.trim().slice(0, 80)).filter(Boolean))].slice(0, 32)
      : record.tags,
    updatedAt: now
  };
}

function validateVfxReferences(data: UltraProjectData, issues: UltraValidationIssue[]): void {
  const vfxGraphIds = new Set(data.rendering.vfxGraphs.map((graph) => graph.id));
  for (const graph of data.rendering.vfxGraphs) {
    for (const subgraphId of graph.subgraphIds) {
      if (!vfxGraphIds.has(subgraphId)) {
        issues.push({
          phase: 80,
          severity: "error",
          code: "MISSING_VFX_SUBGRAPH",
          message: `VFX graph ${graph.id} references missing subgraph ${subgraphId}.`,
          recordId: graph.id
        });
      }
    }
  }
  for (const preset of data.rendering.minecraftEffects) {
    if (!vfxGraphIds.has(preset.graphId) && !preset.fallbackPresetId) {
      issues.push({
        phase: 81,
        severity: "error",
        code: "MISSING_EFFECT_GRAPH",
        message: `Minecraft effect ${preset.id} references missing graph ${preset.graphId} without a fallback.`,
        recordId: preset.id
      });
    }
  }
}

function sanitizeRecordArray(value: unknown, maximum: number, now: string): UltraBaseRecord[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: UltraBaseRecord[] = [];
  for (let index = 0; index < value.length && result.length < maximum; index += 1) {
    const item = value[index];
    if (!isRecord(item)) continue;
    const id = sanitizeIdentifier(item.id, `ultra_record_${index}`);
    if (seen.has(id)) continue;
    seen.add(id);
    const sanitized = sanitizeJsonValue(item, 0);
    if (!isRecord(sanitized)) continue;
    result.push({
      ...sanitized,
      id,
      name: sanitizeString(item.name, `Record ${index + 1}`, 160),
      enabled: item.enabled !== false,
      notes: sanitizeString(item.notes, "", 2048),
      tags: sanitizeStringArray(item.tags, 32, 80),
      createdAt: sanitizeDate(item.createdAt, now),
      updatedAt: sanitizeDate(item.updatedAt, now)
    } as UltraBaseRecord);
  }
  return result;
}

function sanitizeJsonValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return null;
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return value.slice(0, MAX_STRING_LENGTH);
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY_LENGTH).map((entry) => sanitizeJsonValue(entry, depth + 1));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, MAX_OBJECT_KEYS)
        .map(([key, entry]) => [key.slice(0, 128), sanitizeJsonValue(entry, depth + 1)])
    );
  }
  return null;
}

function sanitizeIdentifier(value: unknown, fallback: string): string {
  const candidate = typeof value === "string" ? value.trim() : "";
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(candidate) ? candidate : fallback;
}

function sanitizeString(value: unknown, fallback: string, maximum: number): string {
  return typeof value === "string" ? value.slice(0, maximum) : fallback;
}

function sanitizeStringArray(value: unknown, maximumItems: number, maximumLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.slice(0, maximumLength)).slice(0, maximumItems))];
}

function sanitizeDate(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function isUltraPhaseStatus(value: unknown): value is UltraPhaseStatus {
  return value === "planned" || value === "configured" || value === "validated" || value === "blocked";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function findDuplicateIds(records: UltraBaseRecord[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) duplicates.add(record.id);
    else seen.add(record.id);
  }
  return [...duplicates];
}

export { MAX_RECORDS_PER_PHASE, MAX_TOTAL_RECORDS, PHASE_PATHS };
