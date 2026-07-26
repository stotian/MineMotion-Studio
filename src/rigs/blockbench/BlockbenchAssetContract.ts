import { createDeterministicId } from "../../core/ids/Id";
import type { BlockbenchModelAsset } from "../RigTypes";
import { BbmodelParser } from "./BbmodelParser";
import { sanitizeBlockbenchBoneMappingOverrides } from "./BlockbenchMapping";
import type { BlockbenchGroup } from "./BlockbenchTypes";

export const BLOCKBENCH_ASSET_LIMITS = Object.freeze({
  models: 128,
  totalJsonCharacters: 64_000_000,
  textLength: 256,
  listEntries: 256
});

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

export function sanitizeBlockbenchModelAssets(
  value: unknown
): BlockbenchModelAsset[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  const output: BlockbenchModelAsset[] = [];
  let totalJsonCharacters = 0;
  for (const candidate of value) {
    if (output.length >= BLOCKBENCH_ASSET_LIMITS.models) break;
    if (!candidate || typeof candidate !== "object") continue;
    const source = candidate as Partial<BlockbenchModelAsset>;
    if (typeof source.rawJson !== "string") continue;
    if (totalJsonCharacters + source.rawJson.length >
      BLOCKBENCH_ASSET_LIMITS.totalJsonCharacters) {
      break;
    }
    totalJsonCharacters += source.rawJson.length;
    let model;
    try {
      model = BbmodelParser.parse(source.rawJson);
    } catch {
      continue;
    }
    const id = typeof source.id === "string" && ID_PATTERN.test(source.id)
      ? source.id
      : createDeterministicId(
          "bbmodel",
          `${model.name}:${source.rawJson}`
        );
    if (ids.has(id)) continue;
    ids.add(id);
    output.push({
      id,
      name: safeText(source.name, model.name),
      formatVersion: model.formatVersion,
      modelFormat: model.modelFormat,
      elementCount: model.elements.length,
      groupCount: countGroups(model.groups),
      textureCount: model.textures.length,
      animationCount: model.animations.length,
      animationNames: boundedTexts(model.report.animationNames),
      supportedFeatures: boundedTexts(model.report.supportedFeatures),
      unsupportedFeatures: boundedTexts(model.report.unsupportedFeatures),
      boneMappings: sanitizeBlockbenchBoneMappingOverrides(
        model,
        source.boneMappings
      ),
      importedAt: validDate(source.importedAt)
        ? source.importedAt!
        : "1970-01-01T00:00:00.000Z",
      warnings: boundedTexts(model.warnings),
      rawJson: source.rawJson
    });
  }
  return output;
}

export function reconcileBlockbenchModelAssets(
  primary: unknown,
  compatibility: unknown
): BlockbenchModelAsset[] {
  return sanitizeBlockbenchModelAssets([
    ...(Array.isArray(primary) ? primary : []),
    ...(Array.isArray(compatibility) ? compatibility : [])
  ]);
}

function countGroups(groups: readonly BlockbenchGroup[]): number {
  return groups.reduce((total, group) =>
    total +
    1 +
    countGroups(
      (group.children ?? []).filter(
        (child): child is BlockbenchGroup => typeof child !== "string"
      )
    ), 0);
}

function boundedTexts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .slice(0, BLOCKBENCH_ASSET_LIMITS.listEntries)
    .map((entry) => entry.slice(0, BLOCKBENCH_ASSET_LIMITS.textLength));
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0
    ? value.slice(0, BLOCKBENCH_ASSET_LIMITS.textLength)
    : fallback.slice(0, BLOCKBENCH_ASSET_LIMITS.textLength);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" &&
    Number.isFinite(Date.parse(value));
}
