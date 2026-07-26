import type { RigDefinition } from "../RigDefinition";
import {
  MINECRAFT_RIG_PRESETS,
  getRigDefinition
} from "../MinecraftRigPresets";
import type {
  BlockbenchBoneMappingOverride,
  RigPresetId
} from "../RigTypes";
import { BbmodelParser } from "./BbmodelParser";
import type {
  BlockbenchGroup,
  ParsedBlockbenchModel
} from "./BlockbenchTypes";

export const BLOCKBENCH_MAPPING_LIMITS = Object.freeze({
  groups: 256,
  overrides: 128,
  idLength: 256
});

export type BlockbenchMappingMethod =
  | "manual"
  | "exact"
  | "alias"
  | "unmapped"
  | "conflict";

export interface BlockbenchBoneMappingEntry {
  sourceGroupId: string;
  sourceUuid: string | null;
  sourceName: string;
  sourcePath: string;
  targetBoneId: string | null;
  method: BlockbenchMappingMethod;
  confidence: number;
}

export interface BlockbenchBoneMappingReport {
  rigPresetId: RigPresetId;
  entries: BlockbenchBoneMappingEntry[];
  mappedCount: number;
  manualCount: number;
  unresolvedCount: number;
  warnings: string[];
}

interface SourceGroup {
  id: string;
  uuid: string | null;
  name: string;
  path: string;
}

const BONE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  torso: "body",
  chest: "body",
  upperbody: "body",
  armleft: "leftArm",
  bipedleftarm: "leftArm",
  leftupperarm: "leftArm",
  upperarmleft: "leftArm",
  armright: "rightArm",
  bipedrightarm: "rightArm",
  rightupperarm: "rightArm",
  upperarmright: "rightArm",
  leftlowerarm: "leftForearm",
  lowerarmleft: "leftForearm",
  leftforearm: "leftForearm",
  rightlowerarm: "rightForearm",
  lowerarmright: "rightForearm",
  rightforearm: "rightForearm",
  legleft: "leftLeg",
  bipedleftleg: "leftLeg",
  leftupperleg: "leftLeg",
  upperlegleft: "leftLeg",
  legright: "rightLeg",
  bipedrightleg: "rightLeg",
  rightupperleg: "rightLeg",
  upperlegright: "rightLeg",
  leftlowerleg: "leftLowerLeg",
  lowerlegleft: "leftLowerLeg",
  leftshin: "leftLowerLeg",
  rightlowerleg: "rightLowerLeg",
  lowerlegright: "rightLowerLeg",
  rightshin: "rightLowerLeg"
});

export function resolveBlockbenchBoneMappings(
  model: ParsedBlockbenchModel,
  definition: RigDefinition,
  overrides: readonly BlockbenchBoneMappingOverride[] = []
): BlockbenchBoneMappingReport {
  const collected = collectSourceGroups(model.groups);
  const sourceGroups = collected.groups;
  const targetByNormalizedName = new Map(
    definition.bones.map((bone) => [normalizeBoneName(bone.id), bone.id])
  );
  const validTargets = new Set(definition.bones.map((bone) => bone.id));
  const manual = new Map(
    overrides
      .filter((entry) =>
        entry.rigPresetId === definition.id &&
        (entry.targetBoneId === null || validTargets.has(entry.targetBoneId))
      )
      .map((entry) => [entry.sourceGroupId, entry.targetBoneId])
  );
  const entries = sourceGroups.map((source): BlockbenchBoneMappingEntry => {
    const manualTarget = manual.get(source.id);
    if (manual.has(source.id)) {
      return mappingEntry(source, manualTarget ?? null, "manual", 1);
    }
    const normalized = normalizeBoneName(source.name);
    const exactTarget = targetByNormalizedName.get(normalized);
    if (exactTarget) {
      return mappingEntry(source, exactTarget, "exact", 1);
    }
    const aliasTarget = BONE_ALIASES[normalized];
    if (aliasTarget && validTargets.has(aliasTarget)) {
      return mappingEntry(source, aliasTarget, "alias", 0.95);
    }
    return mappingEntry(source, null, "unmapped", 0);
  });

  for (const candidates of groupByTarget(entries).values()) {
    if (candidates.length < 2) continue;
    const manualCandidates = candidates.filter(
      (entry) => entry.method === "manual"
    );
    const winners = manualCandidates.length === 1
      ? manualCandidates
      : [];
    for (const candidate of candidates) {
      if (winners.includes(candidate)) continue;
      candidate.targetBoneId = null;
      candidate.method = "conflict";
      candidate.confidence = 0;
    }
  }

  const mapped = entries.filter((entry) => entry.targetBoneId !== null);
  return {
    rigPresetId: definition.id,
    entries,
    mappedCount: mapped.length,
    manualCount: entries.filter((entry) => entry.method === "manual").length,
    unresolvedCount: entries.length - mapped.length,
    warnings: [
      ...(collected.truncated
        ? ["BLOCKBENCH_MAPPING_GROUPS_TRUNCATED: Mapping is limited to the first 256 groups."]
        : []),
      ...(entries.some((entry) => entry.method === "conflict")
        ? ["BLOCKBENCH_MAPPING_CONFLICT: Multiple source groups resolved to the same rig bone."]
        : [])
    ]
  };
}

export function resolveBlockbenchAssetMappings(
  rawJson: string,
  rigPresetId: RigPresetId,
  overrides: readonly BlockbenchBoneMappingOverride[] = []
): BlockbenchBoneMappingReport {
  return resolveBlockbenchBoneMappings(
    BbmodelParser.parse(rawJson),
    getRigDefinition(rigPresetId),
    overrides
  );
}

export function sanitizeBlockbenchBoneMappingOverrides(
  model: ParsedBlockbenchModel,
  value: unknown
): BlockbenchBoneMappingOverride[] {
  if (!Array.isArray(value)) return [];
  const sources = new Set(
    collectSourceGroups(model.groups).groups.map((group) => group.id)
  );
  const sourceKeys = new Set<string>();
  const targetKeys = new Set<string>();
  const output: BlockbenchBoneMappingOverride[] = [];
  for (const candidate of value) {
    if (output.length >= BLOCKBENCH_MAPPING_LIMITS.overrides) break;
    if (!candidate || typeof candidate !== "object") continue;
    const source = candidate as Partial<BlockbenchBoneMappingOverride>;
    const definition = MINECRAFT_RIG_PRESETS.find(
      (entry) => entry.id === source.rigPresetId
    );
    if (!definition ||
      typeof source.sourceGroupId !== "string" ||
      source.sourceGroupId.length > BLOCKBENCH_MAPPING_LIMITS.idLength ||
      !sources.has(source.sourceGroupId) ||
      source.targetBoneId !== null &&
      (typeof source.targetBoneId !== "string" ||
        !definition.bones.some((bone) => bone.id === source.targetBoneId))) {
      continue;
    }
    const sourceKey = `${definition.id}\u0000${source.sourceGroupId}`;
    const targetKey = source.targetBoneId === null
      ? null
      : `${definition.id}\u0000${source.targetBoneId}`;
    if (sourceKeys.has(sourceKey) ||
      (targetKey !== null && targetKeys.has(targetKey))) continue;
    sourceKeys.add(sourceKey);
    if (targetKey !== null) targetKeys.add(targetKey);
    output.push({
      rigPresetId: definition.id,
      sourceGroupId: source.sourceGroupId,
      targetBoneId: source.targetBoneId
    });
  }
  return output;
}

export function findMappingSourceId(
  report: BlockbenchBoneMappingReport,
  animatorId: string,
  animatorName?: string
): string | null {
  const byUuid = report.entries.filter(
    (entry) => entry.sourceUuid === animatorId
  );
  if (byUuid.length === 1) return byUuid[0].sourceGroupId;
  const normalizedName = normalizeBoneName(animatorName ?? "");
  if (!normalizedName) return null;
  const byName = report.entries.filter(
    (entry) => normalizeBoneName(entry.sourceName) === normalizedName
  );
  return byName.length === 1 ? byName[0].sourceGroupId : null;
}

function collectSourceGroups(
  groups: readonly BlockbenchGroup[]
): { groups: SourceGroup[]; truncated: boolean } {
  const flattened: Array<Omit<SourceGroup, "id"> & { indexPath: string }> = [];
  let truncated = false;
  const visit = (
    group: BlockbenchGroup,
    indexPath: number[],
    namePath: string[]
  ) => {
    if (flattened.length >= BLOCKBENCH_MAPPING_LIMITS.groups) {
      truncated = true;
      return;
    }
    const name = group.name?.trim() || `Group ${indexPath.join(".")}`;
    flattened.push({
      uuid: group.uuid?.trim() || null,
      name,
      path: [...namePath, name].join(" / "),
      indexPath: indexPath.join(".")
    });
    let childIndex = 0;
    for (const child of group.children ?? []) {
      if (typeof child === "string") continue;
      visit(child, [...indexPath, childIndex], [...namePath, name]);
      childIndex += 1;
    }
  };
  groups.forEach((group, index) => visit(group, [index], []));
  const uuidCounts = new Map<string, number>();
  for (const group of flattened) {
    if (group.uuid) {
      uuidCounts.set(group.uuid, (uuidCounts.get(group.uuid) ?? 0) + 1);
    }
  }
  return {
    groups: flattened.map((group) => ({
      id: group.uuid && uuidCounts.get(group.uuid) === 1
        ? group.uuid
        : `group:${group.indexPath}`,
      uuid: group.uuid,
      name: group.name,
      path: group.path
    })),
    truncated
  };
}

function mappingEntry(
  source: SourceGroup,
  targetBoneId: string | null,
  method: BlockbenchMappingMethod,
  confidence: number
): BlockbenchBoneMappingEntry {
  return {
    sourceGroupId: source.id,
    sourceUuid: source.uuid,
    sourceName: source.name,
    sourcePath: source.path,
    targetBoneId,
    method,
    confidence
  };
}

function groupByTarget(
  entries: BlockbenchBoneMappingEntry[]
): Map<string, BlockbenchBoneMappingEntry[]> {
  const grouped = new Map<string, BlockbenchBoneMappingEntry[]>();
  for (const entry of entries) {
    if (!entry.targetBoneId) continue;
    const candidates = grouped.get(entry.targetBoneId) ?? [];
    candidates.push(entry);
    grouped.set(entry.targetBoneId, candidates);
  }
  return grouped;
}

function normalizeBoneName(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}
