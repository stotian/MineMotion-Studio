import { CURRENT_PROJECT_SCHEMA_VERSION } from "../../core/serialization/SchemaVersion";
import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import { VFX_PRIMITIVE_LIMITS } from "../primitives/VfxPrimitiveTypes";
import { validateVfxDefinition } from "../core/VfxValidator";
import { VFX_GLOBAL_FRAME_LIMITS } from "../runtime/VfxFrameBudget";
import {
  BUILTIN_VFX_PRESET_METADATA_VERSION,
  type BuiltinVfxPreset,
  type BuiltinVfxPresetCategory,
  type BuiltinVfxPresetMetadata,
  type BuiltinVfxPresetMaturity,
  type BuiltinVfxPresetRuntime
} from "./BuiltinVfxPresetTypes";

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;
const TAG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const LOCALIZATION_KEY_PATTERN = /^vfx\.presets\.[a-zA-Z0-9._:-]+\.name$/;
const CATEGORIES = new Set<BuiltinVfxPresetCategory>([
  "combat",
  "lightning-electric",
  "fire-explosion",
  "magic-energy",
  "environment",
  "screen-cinematic",
  "movement-trails"
]);
const MATURITIES = new Set<BuiltinVfxPresetMaturity>([
  "stable",
  "compatibility",
  "experimental"
]);
const RUNTIMES = new Set<BuiltinVfxPresetRuntime>([
  "native-primitives",
  "compatibility-map"
]);
const QUALITIES = new Set(["draft", "medium", "high", "final"]);
const MAX_TAGS = 16;
const MAX_TAG_LENGTH = 48;
const MAX_DURATION_FRAMES = 24 * 60 * 10;
const QUALITY_ORDER = ["draft", "medium", "high", "final"] as const;

export interface BuiltinVfxPresetValidationContext {
  localization: Readonly<Record<string, string>>;
  assetIds?: ReadonlySet<string>;
}

function issue(code: string, message: string, path: string): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    return Reflect.ownKeys(Object.getOwnPropertyDescriptors(value)).every((key) => {
      if (typeof key === "symbol") return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return Boolean(descriptor && "value" in descriptor && descriptor.enumerable);
    });
  } catch {
    return false;
  }
}

function hasSafePresetShape(value: unknown): value is BuiltinVfxPreset {
  if (!isPlainRecord(value)) return false;
  const metadata = value.metadata;
  if (!isPlainRecord(metadata)) return false;
  return (
    isPlainRecord(value.definition) &&
    typeof value.localizedName === "string" &&
    isPlainRecord(metadata.thumbnail) &&
    isPlainRecord(metadata.compatibility) &&
    isPlainRecord(metadata.compatibility.capabilities) &&
    isPlainRecord(metadata.frameBudget)
  );
}

function validateMetadata(
  metadata: BuiltinVfxPresetMetadata,
  preset: BuiltinVfxPreset,
  index: number,
  context: BuiltinVfxPresetValidationContext
): ValidationIssue[] {
  const path = `presets.${index}`;
  const errors: ValidationIssue[] = [];
  if (metadata.version !== BUILTIN_VFX_PRESET_METADATA_VERSION) {
    errors.push(
      issue("VFX_PRESET_VERSION_UNSUPPORTED", "Preset metadata version is unsupported.", `${path}.metadata.version`)
    );
  }
  if (!IDENTIFIER_PATTERN.test(metadata.id)) {
    errors.push(issue("VFX_PRESET_ID_INVALID", "Preset ID is invalid.", `${path}.metadata.id`));
  }
  if (metadata.effectType !== metadata.definitionId) {
    errors.push(
      issue("VFX_PRESET_EFFECT_DEFINITION_MISMATCH", "Preset effect type and definition ID must match.", `${path}.metadata.definitionId`)
    );
  }
  if (preset.definition.id !== metadata.definitionId) {
    errors.push(
      issue("VFX_PRESET_DEFINITION_MISMATCH", "Preset metadata does not reference its supplied definition.", `${path}.definition.id`)
    );
  }
  if (!CATEGORIES.has(metadata.category)) {
    errors.push(issue("VFX_PRESET_CATEGORY_INVALID", "Preset category is invalid.", `${path}.metadata.category`));
  }
  if (
    !Array.isArray(metadata.tags) ||
    metadata.tags.length === 0 ||
    metadata.tags.length > MAX_TAGS ||
    metadata.tags.some(
      (tag) =>
        typeof tag !== "string" ||
        tag.length > MAX_TAG_LENGTH ||
        !TAG_PATTERN.test(tag)
    ) ||
    new Set(metadata.tags).size !== metadata.tags.length
  ) {
    errors.push(issue("VFX_PRESET_TAGS_INVALID", "Preset tags must be unique bounded slugs.", `${path}.metadata.tags`));
  }
  if (!LOCALIZATION_KEY_PATTERN.test(metadata.localizationKey)) {
    errors.push(issue("VFX_PRESET_LOCALIZATION_KEY_INVALID", "Preset localization key is invalid.", `${path}.metadata.localizationKey`));
  }
  const localizedName = context.localization[metadata.localizationKey];
  if (typeof localizedName !== "string" || localizedName.trim() === "") {
    errors.push(issue("VFX_PRESET_LOCALIZATION_MISSING", "Preset localization entry is missing.", `${path}.metadata.localizationKey`));
  } else if (localizedName !== preset.localizedName) {
    errors.push(issue("VFX_PRESET_LOCALIZATION_MISMATCH", "Preset localized name does not match the localization catalog.", `${path}.localizedName`));
  }
  if (metadata.thumbnail.kind === "asset") {
    if (!IDENTIFIER_PATTERN.test(metadata.thumbnail.assetId)) {
      errors.push(issue("VFX_PRESET_THUMBNAIL_ASSET_INVALID", "Preset thumbnail asset ID is invalid.", `${path}.metadata.thumbnail.assetId`));
    } else if (!context.assetIds?.has(metadata.thumbnail.assetId)) {
      errors.push(issue("VFX_PRESET_THUMBNAIL_ASSET_MISSING", "Preset thumbnail asset is missing.", `${path}.metadata.thumbnail.assetId`));
    }
  } else if (
    metadata.thumbnail.kind !== "generated" ||
    typeof metadata.thumbnail.cacheKey !== "string" ||
    metadata.thumbnail.cacheKey !== `vfx-preset:${metadata.id}:v${metadata.version}` ||
    !["pending", "ready"].includes(metadata.thumbnail.state)
  ) {
    errors.push(issue("VFX_PRESET_THUMBNAIL_INVALID", "Generated thumbnail metadata is invalid.", `${path}.metadata.thumbnail`));
  }
  if (!QUALITIES.has(metadata.previewQuality)) {
    errors.push(issue("VFX_PRESET_PREVIEW_QUALITY_INVALID", "Preset preview quality is invalid.", `${path}.metadata.previewQuality`));
  }
  if (!QUALITIES.has(metadata.exportQuality)) {
    errors.push(issue("VFX_PRESET_EXPORT_QUALITY_INVALID", "Preset export quality is invalid.", `${path}.metadata.exportQuality`));
  }
  if (
    QUALITIES.has(metadata.previewQuality) &&
    QUALITIES.has(metadata.exportQuality) &&
    QUALITY_ORDER.indexOf(metadata.previewQuality) >
      QUALITY_ORDER.indexOf(metadata.exportQuality)
  ) {
    errors.push(issue("VFX_PRESET_QUALITY_ORDER_INVALID", "Preset export quality cannot be lower than preview quality.", `${path}.metadata.exportQuality`));
  }
  const compatibility = metadata.compatibility;
  if (!MATURITIES.has(compatibility.maturity)) {
    errors.push(issue("VFX_PRESET_MATURITY_INVALID", "Preset maturity is invalid.", `${path}.metadata.compatibility.maturity`));
  }
  if (!RUNTIMES.has(compatibility.runtime)) {
    errors.push(issue("VFX_PRESET_RUNTIME_INVALID", "Preset runtime is invalid.", `${path}.metadata.compatibility.runtime`));
  }
  if (
    !Number.isSafeInteger(compatibility.minProjectSchema) ||
    !Number.isSafeInteger(compatibility.maxProjectSchema) ||
    compatibility.minProjectSchema > CURRENT_PROJECT_SCHEMA_VERSION ||
    compatibility.maxProjectSchema < CURRENT_PROJECT_SCHEMA_VERSION ||
    compatibility.minProjectSchema > compatibility.maxProjectSchema
  ) {
    errors.push(issue("VFX_PRESET_SCHEMA_COMPATIBILITY_INVALID", "Preset must support the current project schema.", `${path}.metadata.compatibility`));
  }
  if (
    typeof compatibility.capabilities.editable !== "boolean" ||
    typeof compatibility.capabilities.preview !== "boolean" ||
    typeof compatibility.capabilities.export !== "boolean" ||
    !Array.isArray(compatibility.limitations) ||
    compatibility.limitations.some(
      (limitation) => typeof limitation !== "string" || limitation.trim() === ""
    )
  ) {
    errors.push(issue("VFX_PRESET_CAPABILITIES_INVALID", "Preset capabilities and limitations are invalid.", `${path}.metadata.compatibility`));
  }
  if (
    compatibility.maturity === "stable" &&
    (compatibility.runtime !== "native-primitives" ||
      !compatibility.capabilities.preview ||
      !compatibility.capabilities.export ||
      (metadata.thumbnail.kind === "generated" &&
        metadata.thumbnail.state !== "ready"))
  ) {
    errors.push(issue("VFX_PRESET_STABLE_CLAIM_INVALID", "Stable presets require native preview/export and a ready thumbnail.", `${path}.metadata.compatibility.maturity`));
  }
  if (
    !Number.isSafeInteger(preset.definition.defaultDurationFrames) ||
    preset.definition.defaultDurationFrames < 1 ||
    preset.definition.defaultDurationFrames > MAX_DURATION_FRAMES
  ) {
    errors.push(issue("VFX_PRESET_DURATION_INVALID", "Preset duration is outside the supported range.", `${path}.definition.defaultDurationFrames`));
  }
  const budget = metadata.frameBudget;
  if (
    !Number.isSafeInteger(budget.effects) ||
    !Number.isSafeInteger(budget.particles) ||
    !Number.isSafeInteger(budget.segments) ||
    !Number.isSafeInteger(budget.stackWork) ||
    budget.effects !== 1 ||
    budget.particles < 0 ||
    budget.particles > Math.min(VFX_PRIMITIVE_LIMITS.particles, VFX_GLOBAL_FRAME_LIMITS.particles) ||
    budget.segments < 0 ||
    budget.segments > VFX_GLOBAL_FRAME_LIMITS.segments ||
    budget.stackWork !== budget.effects + budget.particles + budget.segments ||
    budget.stackWork > VFX_GLOBAL_FRAME_LIMITS.stackWork
  ) {
    errors.push(issue("VFX_PRESET_BUDGET_INVALID", "Preset frame budget is invalid or exceeds global limits.", `${path}.metadata.frameBudget`));
  }
  const definitionValidation = validateVfxDefinition(preset.definition);
  if (!definitionValidation.ok) {
    errors.push(
      ...definitionValidation.errors.map((error) => ({
        ...error,
        path: `${path}.definition.${error.path ?? ""}`.replace(/\.$/, "")
      }))
    );
  }
  return errors;
}

export function validateBuiltinVfxPresetCatalog(
  presets: readonly BuiltinVfxPreset[],
  context: BuiltinVfxPresetValidationContext
): ValidationResult<readonly BuiltinVfxPreset[]> {
  const errors: ValidationIssue[] = [];
  const ids = new Set<string>();
  const definitionIds = new Set<string>();
  const localizationKeys = new Set<string>();
  for (let index = 0; index < presets.length; index += 1) {
    const preset = presets[index];
    if (!hasSafePresetShape(preset)) {
      errors.push(
        issue(
          "VFX_PRESET_RECORD_INVALID",
          "Preset entries and nested metadata must be plain own-data objects.",
          `presets.${index}`
        )
      );
      continue;
    }
    errors.push(...validateMetadata(preset.metadata, preset, index, context));
    if (ids.has(preset.metadata.id)) {
      errors.push(issue("VFX_PRESET_ID_DUPLICATE", `Duplicate preset ID: ${preset.metadata.id}`, `presets.${index}.metadata.id`));
    }
    if (definitionIds.has(preset.metadata.definitionId)) {
      errors.push(issue("VFX_PRESET_DEFINITION_DUPLICATE", `Duplicate preset definition: ${preset.metadata.definitionId}`, `presets.${index}.metadata.definitionId`));
    }
    if (localizationKeys.has(preset.metadata.localizationKey)) {
      errors.push(issue("VFX_PRESET_LOCALIZATION_DUPLICATE", `Duplicate localization key: ${preset.metadata.localizationKey}`, `presets.${index}.metadata.localizationKey`));
    }
    ids.add(preset.metadata.id);
    definitionIds.add(preset.metadata.definitionId);
    localizationKeys.add(preset.metadata.localizationKey);
  }
  return errors.length > 0 ? invalidResult(errors) : validResult(presets);
}
