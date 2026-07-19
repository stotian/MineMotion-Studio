import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import { createEffectInstance } from "../../effects/EffectRegistry";
import type { BuiltinVfxPreset } from "../library/BuiltinVfxPresetTypes";
import { isSafeVfxColor } from "../core/VfxParameter";
import { validateVfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveValidator";
import { getBuiltinVfxRecipe } from "../recipes/BuiltinVfxRecipeRegistry";
import { prepareVfxPresetRecipe } from "../recipes/VfxPresetRecipeEvaluator";
import { evaluateVfxFrame } from "../runtime/VfxFrameEvaluator";
import { normalizeEffectsForSchema10 } from "../serialization/VfxProjectMigration";
import {
  MAX_VFX_AUTHORING_STACK_ITEMS,
  VFX_AUTHORING_DOCUMENT_VERSION,
  type VfxAuthoringDocument,
  type VfxAuthoringStackItem
} from "./VfxAuthoringTypes";

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;
const MAX_TEXT_LENGTH = 256;
const MAX_DURATION_FRAMES = 1_000_000;
const SPACES = new Set(["world", "screen", "camera"]);
const BLEND_MODES = new Set(["normal", "additive", "multiply", "screen", "difference"]);
const RENDER_LAYERS = new Set(["world", "camera", "overlay", "post"]);
const QUALITIES = new Set(["draft", "medium", "high", "final"]);

function issue(code: string, message: string, path: string): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_TEXT_LENGTH && IDENTIFIER_PATTERN.test(value);
}

function validText(value: unknown, allowEmpty = false): value is string {
  return typeof value === "string" && value.length <= MAX_TEXT_LENGTH && (allowEmpty || value.trim().length > 0);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function cloneAndFreeze(document: VfxAuthoringDocument): VfxAuthoringDocument {
  return deepFreeze(structuredClone(document));
}

function validateModifier(
  modifier: unknown,
  path: string,
  errors: ValidationIssue[]
): void {
  if (!isRecord(modifier)) {
    errors.push(issue("VFX_AUTHORING_MODIFIER_INVALID", "Modifier must be a plain declarative object.", path));
    return;
  }
  if (modifier.kind === "tint") {
    if (!isSafeVfxColor(modifier.color)) {
      errors.push(issue("VFX_AUTHORING_MODIFIER_COLOR_INVALID", "Tint must use a safe VFX color token.", `${path}.color`));
    }
    return;
  }
  if (modifier.kind === "opacity" || modifier.kind === "scale") {
    const multiplier = modifier.multiplier;
    const max = modifier.kind === "opacity" ? 1 : 100;
    if (typeof multiplier !== "number" || !Number.isFinite(multiplier) || multiplier < 0 || multiplier > max) {
      errors.push(issue("VFX_AUTHORING_MODIFIER_VALUE_INVALID", `Modifier multiplier must be between 0 and ${max}.`, `${path}.multiplier`));
    }
    return;
  }
  errors.push(issue("VFX_AUTHORING_MODIFIER_KIND_UNSUPPORTED", "Modifier kind is unsupported.", `${path}.kind`));
}

function validateStackItem(
  item: unknown,
  index: number,
  ids: Set<string>,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  const path = `stack.${index}`;
  if (!isRecord(item)) {
    errors.push(issue("VFX_AUTHORING_STACK_ITEM_INVALID", "Stack item must be an object.", path));
    return;
  }
  if (!validIdentifier(item.id)) {
    errors.push(issue("VFX_AUTHORING_STACK_ID_INVALID", "Stack item ID is invalid.", `${path}.id`));
  } else if (ids.has(item.id)) {
    errors.push(issue("VFX_AUTHORING_STACK_ID_DUPLICATE", `Duplicate stack item ID: ${item.id}.`, `${path}.id`));
  } else {
    ids.add(item.id);
  }
  if (!validText(item.label)) errors.push(issue("VFX_AUTHORING_STACK_LABEL_INVALID", "Stack item label is required.", `${path}.label`));
  if (typeof item.enabled !== "boolean") errors.push(issue("VFX_AUTHORING_STACK_ENABLED_INVALID", "Stack item enabled state must be boolean.", `${path}.enabled`));

  if (item.kind === "modifier") {
    validateModifier(item.modifier, `${path}.modifier`, errors);
    return;
  }
  if (item.kind !== "primitive" && item.kind !== "emitter") {
    errors.push(issue("VFX_AUTHORING_STACK_KIND_UNSUPPORTED", "Stack item kind is unsupported.", `${path}.kind`));
    return;
  }
  const validation = validateVfxPrimitiveDescriptor(item.descriptor as never);
  warnings.push(...validation.warnings.map((entry) => ({ ...entry, path: `${path}.descriptor.${entry.path ?? ""}`.replace(/\.$/, "") })));
  if (!validation.ok) {
    errors.push(...validation.errors.map((entry) => ({ ...entry, path: `${path}.descriptor.${entry.path ?? ""}`.replace(/\.$/, "") })));
    return;
  }
  const expectedKind = validation.value.kind === "particle-emitter" ? "emitter" : "primitive";
  if (item.kind !== expectedKind) {
    errors.push(issue("VFX_AUTHORING_STACK_DESCRIPTOR_MISMATCH", `${validation.value.kind} must use an ${expectedKind} stack item.`, `${path}.kind`));
  }
}

export function validateVfxAuthoringDocument(
  document: unknown
): ValidationResult<VfxAuthoringDocument> {
  if (!isRecord(document)) {
    return invalidResult([issue("VFX_AUTHORING_DOCUMENT_INVALID", "VFX authoring document must be an object.", "document")]);
  }
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  if (document.version !== VFX_AUTHORING_DOCUMENT_VERSION) errors.push(issue("VFX_AUTHORING_VERSION_UNSUPPORTED", "VFX authoring document version is unsupported.", "version"));
  if (!validIdentifier(document.id)) errors.push(issue("VFX_AUTHORING_ID_INVALID", "VFX authoring document ID is invalid.", "id"));
  if (!validText(document.displayName)) errors.push(issue("VFX_AUTHORING_NAME_INVALID", "VFX authoring display name is required.", "displayName"));
  if (!validText(document.description, true)) errors.push(issue("VFX_AUTHORING_DESCRIPTION_INVALID", "VFX authoring description is too long.", "description"));
  if (!Number.isSafeInteger(document.durationFrames) || (document.durationFrames as number) < 1 || (document.durationFrames as number) > MAX_DURATION_FRAMES) errors.push(issue("VFX_AUTHORING_DURATION_INVALID", "Duration must be a safe integer within supported bounds.", "durationFrames"));
  if (!SPACES.has(document.space as string)) errors.push(issue("VFX_AUTHORING_SPACE_INVALID", "VFX space is unsupported.", "space"));
  if (!BLEND_MODES.has(document.blendMode as string)) errors.push(issue("VFX_AUTHORING_BLEND_INVALID", "VFX blend mode is unsupported.", "blendMode"));
  if (!RENDER_LAYERS.has(document.renderLayer as string)) errors.push(issue("VFX_AUTHORING_LAYER_INVALID", "VFX render layer is unsupported.", "renderLayer"));
  if (!QUALITIES.has(document.previewQuality as string) || !QUALITIES.has(document.exportQuality as string)) errors.push(issue("VFX_AUTHORING_QUALITY_INVALID", "Preview and export qualities must be supported.", "quality"));
  if (!validText(document.seed)) errors.push(issue("VFX_AUTHORING_SEED_INVALID", "A bounded deterministic seed is required.", "seed"));
  if (document.target !== null && (!isRecord(document.target) || !validIdentifier(document.target.entityId) || (document.target.boneId !== undefined && !validIdentifier(document.target.boneId)))) errors.push(issue("VFX_AUTHORING_TARGET_INVALID", "Target must use valid entity and optional bone IDs.", "target"));
  if (!isRecord(document.source) || (document.source.kind !== "blank" && document.source.kind !== "derived-builtin")) {
    errors.push(issue("VFX_AUTHORING_SOURCE_INVALID", "VFX authoring source is invalid.", "source"));
  } else if (document.source.kind === "derived-builtin" && (!validIdentifier(document.source.presetId) || !validIdentifier(document.source.definitionId))) {
    errors.push(issue("VFX_AUTHORING_SOURCE_ID_INVALID", "Derived built-in source IDs are invalid.", "source"));
  }
  if (!Array.isArray(document.stack) || document.stack.length > MAX_VFX_AUTHORING_STACK_ITEMS) {
    errors.push(issue("VFX_AUTHORING_STACK_LIMIT_EXCEEDED", `VFX authoring supports at most ${MAX_VFX_AUTHORING_STACK_ITEMS} stack items.`, "stack"));
  } else {
    const ids = new Set<string>();
    document.stack.forEach((item, index) => validateStackItem(item, index, ids, errors, warnings));
  }
  if (errors.length > 0) return invalidResult(errors, warnings);
  try {
    return validResult(cloneAndFreeze(document as unknown as VfxAuthoringDocument), warnings);
  } catch {
    return invalidResult([issue("VFX_AUTHORING_CLONE_UNSAFE", "VFX authoring data must be structured-cloneable and executable-code free.", "document")], warnings);
  }
}

export function createBlankVfxAuthoringDocument(
  id = "vfx-draft",
  displayName = "Untitled VFX"
): VfxAuthoringDocument {
  const result = validateVfxAuthoringDocument({
    version: VFX_AUTHORING_DOCUMENT_VERSION,
    id,
    displayName,
    description: "",
    source: { kind: "blank" },
    durationFrames: 30,
    space: "world",
    target: null,
    seed: "vfx-authoring-v1",
    blendMode: "normal",
    renderLayer: "world",
    previewQuality: "high",
    exportQuality: "final",
    stack: []
  });
  if (!result.ok) throw new Error(result.errors.map((entry) => entry.message).join(" "));
  return result.value;
}

export function deriveVfxAuthoringDocumentFromBuiltin(
  preset: BuiltinVfxPreset
): VfxAuthoringDocument {
  const recipe = getBuiltinVfxRecipe(preset.definition.id);
  if (!recipe) throw new Error(`${preset.localizedName} has no native declarative recipe.`);
  const effect = normalizeEffectsForSchema10([
    createEffectInstance(preset.metadata.effectType, { id: "vfx-authoring-source", startFrame: 0 })
  ])[0];
  const native = effect.nativeVfx;
  const frame = evaluateVfxFrame(native, preset.definition, {
    frame: 0,
    fps: 30,
    seed: "vfx-authoring-derive-v1",
    quality: "final"
  });
  if (!frame.ok || frame.value.status !== "active") throw new Error(`Could not evaluate ${preset.localizedName} for authoring.`);
  const prepared = prepareVfxPresetRecipe(frame.value, recipe);
  if (!prepared.ok) throw new Error(prepared.errors.map((entry) => entry.message).join(" "));
  const stack: VfxAuthoringStackItem[] = prepared.value.descriptors.map((descriptor) =>
    descriptor.kind === "particle-emitter"
      ? { id: `stack:${descriptor.id}`, kind: "emitter", label: descriptor.id, enabled: true, descriptor }
      : { id: `stack:${descriptor.id}`, kind: "primitive", label: descriptor.id, enabled: true, descriptor }
  );
  const result = validateVfxAuthoringDocument({
    version: VFX_AUTHORING_DOCUMENT_VERSION,
    id: `draft:${preset.metadata.id}`,
    displayName: `${preset.localizedName} Copy`,
    description: `Custom draft derived from the immutable built-in ${preset.localizedName}.`,
    source: { kind: "derived-builtin", presetId: preset.metadata.id, definitionId: preset.definition.id },
    durationFrames: native.durationFrames,
    space: native.space,
    target: native.target,
    seed: native.seed,
    blendMode: native.blendMode,
    renderLayer: native.renderLayer,
    previewQuality: native.previewQuality,
    exportQuality: native.exportQuality,
    stack
  });
  if (!result.ok) throw new Error(result.errors.map((entry) => entry.message).join(" "));
  return result.value;
}
