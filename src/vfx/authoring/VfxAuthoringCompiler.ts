import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import type { Vector3Tuple } from "../../core/scene/SceneTypes";
import { validateVfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveValidator";
import { VFX_PRIMITIVE_LIMITS, type VfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveTypes";
import { VFX_GLOBAL_FRAME_LIMITS, type VfxEffectWorkRequest } from "../runtime/VfxFrameBudget";
import { validateVfxAuthoringDocument } from "./VfxAuthoringDocument";
import type { VfxAuthoringDocument, VfxAuthoringModifier } from "./VfxAuthoringTypes";

export const VFX_AUTHORING_COMPILATION_VERSION = 1 as const;

export interface CompiledVfxAuthoringDocument {
  version: typeof VFX_AUTHORING_COMPILATION_VERSION;
  documentId: string;
  descriptors: readonly VfxPrimitiveDescriptor[];
  work: VfxEffectWorkRequest;
}

function issue(code: string, message: string, path: string): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function scaleVector(value: Vector3Tuple, multiplier: number): Vector3Tuple {
  return value.map((component) => component * multiplier) as Vector3Tuple;
}

function applyOpacity(descriptor: VfxPrimitiveDescriptor, multiplier: number): VfxPrimitiveDescriptor {
  if (descriptor.kind === "particle-emitter" || descriptor.kind === "trail" || descriptor.kind === "expanding-ring") {
    return { ...descriptor, startOpacity: descriptor.startOpacity * multiplier, endOpacity: descriptor.endOpacity * multiplier };
  }
  if (descriptor.kind === "beam") return { ...descriptor, opacity: descriptor.opacity * multiplier };
  return descriptor;
}

function applyScale(descriptor: VfxPrimitiveDescriptor, multiplier: number): VfxPrimitiveDescriptor {
  if (descriptor.kind === "particle-emitter") return { ...descriptor, radius: descriptor.radius * multiplier, speed: descriptor.speed * multiplier, startSize: descriptor.startSize * multiplier, endSize: descriptor.endSize * multiplier };
  if (descriptor.kind === "beam") return { ...descriptor, start: scaleVector(descriptor.start, multiplier), end: scaleVector(descriptor.end, multiplier), jitter: descriptor.jitter * multiplier, width: descriptor.width * multiplier };
  if (descriptor.kind === "trail") return { ...descriptor, points: descriptor.points.map((point) => scaleVector(point, multiplier)), startWidth: descriptor.startWidth * multiplier, endWidth: descriptor.endWidth * multiplier };
  if (descriptor.kind === "expanding-ring") return { ...descriptor, startRadius: descriptor.startRadius * multiplier, endRadius: descriptor.endRadius * multiplier, thickness: descriptor.thickness * multiplier };
  return { ...descriptor, startRadius: descriptor.startRadius * multiplier, endRadius: descriptor.endRadius * multiplier };
}

function applyModifier(descriptor: VfxPrimitiveDescriptor, modifier: VfxAuthoringModifier): VfxPrimitiveDescriptor {
  if (modifier.kind === "tint") return { ...descriptor, color: modifier.color };
  if (modifier.kind === "opacity") return applyOpacity(descriptor, modifier.multiplier);
  return applyScale(descriptor, modifier.multiplier);
}

export function compileVfxAuthoringDocument(
  document: VfxAuthoringDocument | unknown
): ValidationResult<CompiledVfxAuthoringDocument> {
  const validated = validateVfxAuthoringDocument(document);
  if (!validated.ok) return invalidResult(validated.errors, validated.warnings);
  let descriptors: VfxPrimitiveDescriptor[] = [];
  for (const item of validated.value.stack) {
    if (!item.enabled) continue;
    if (item.kind === "modifier") {
      descriptors = descriptors.map((descriptor) => applyModifier(descriptor, item.modifier));
    } else {
      descriptors.push(structuredClone(item.descriptor));
    }
  }

  const errors: ValidationIssue[] = [];
  const warnings = [...validated.warnings];
  let particles = 0;
  let segments = 0;
  const frozen: VfxPrimitiveDescriptor[] = [];
  for (let index = 0; index < descriptors.length; index += 1) {
    const result = validateVfxPrimitiveDescriptor(descriptors[index]);
    warnings.push(...result.warnings.map((entry) => ({ ...entry, path: `descriptors.${index}.${entry.path ?? ""}`.replace(/\.$/, "") })));
    if (!result.ok) {
      errors.push(...result.errors.map((entry) => ({ ...entry, path: `descriptors.${index}.${entry.path ?? ""}`.replace(/\.$/, "") })));
      continue;
    }
    const descriptor = structuredClone(result.value);
    frozen.push(deepFreeze(descriptor));
    if (descriptor.kind === "particle-emitter") particles += Math.min(descriptor.count, VFX_PRIMITIVE_LIMITS.particles);
    if (descriptor.kind === "beam") segments += Math.min(descriptor.subdivisions, VFX_PRIMITIVE_LIMITS.beamSubdivisions);
    if (descriptor.kind === "trail") segments += Math.min(descriptor.segments, VFX_PRIMITIVE_LIMITS.trailSegments);
    if (descriptor.kind === "expanding-ring") segments += Math.min(descriptor.segments, VFX_PRIMITIVE_LIMITS.ringSegments);
  }
  const work = { particles, segments };
  if (particles > VFX_GLOBAL_FRAME_LIMITS.particles || segments > VFX_GLOBAL_FRAME_LIMITS.segments || 1 + particles + segments > VFX_GLOBAL_FRAME_LIMITS.stackWork) {
    errors.push(issue("VFX_AUTHORING_BUDGET_EXCEEDED", "Compiled VFX stack exceeds the single-effect global frame budget.", "stack"));
  }
  if (errors.length > 0) return invalidResult(errors, warnings);
  return validResult(Object.freeze({
    version: VFX_AUTHORING_COMPILATION_VERSION,
    documentId: validated.value.id,
    descriptors: Object.freeze(frozen),
    work: Object.freeze(work)
  }), warnings);
}
