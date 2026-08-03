import type { TranslationKey } from "../../localization/LocalizationTypes";
import type { TransformData, Vector3Tuple } from "../../project/ProjectFile";

export type TransformVectorFieldId = "position" | "rotation" | "scale";

export interface TransformVectorFieldSchema {
  id: TransformVectorFieldId;
  labelKey: TranslationKey;
  step: number;
  min?: number;
  lockedByEntity: boolean;
}

export const TRANSFORM_VECTOR_SCHEMA: readonly TransformVectorFieldSchema[] = Object.freeze([
  { id: "position", labelKey: "inspector.position", step: 0.1, lockedByEntity: true },
  { id: "rotation", labelKey: "inspector.rotation", step: 0.1, lockedByEntity: true },
  { id: "scale", labelKey: "inspector.scale", step: 0.1, min: 0.01, lockedByEntity: true }
]);

export function updateTransformVector(
  transform: TransformData,
  field: TransformVectorFieldId,
  value: Vector3Tuple
): TransformData {
  return { ...transform, [field]: value };
}

export function validateInspectorSchema(
  schema: readonly TransformVectorFieldSchema[] = TRANSFORM_VECTOR_SCHEMA
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const field of schema) {
    if (ids.has(field.id)) issues.push(`Duplicate inspector field: ${field.id}.`);
    ids.add(field.id);
    if (!Number.isFinite(field.step) || field.step <= 0) issues.push(`Invalid step for ${field.id}.`);
    if (field.min !== undefined && !Number.isFinite(field.min)) issues.push(`Invalid minimum for ${field.id}.`);
  }
  return issues;
}
