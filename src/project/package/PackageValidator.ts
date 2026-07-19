import type { MineMotionPackageData } from "./PackageTypes";
import { CURRENT_PROJECT_SCHEMA_VERSION } from "../../core/serialization/SchemaVersion";

export interface PackageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePackageData(
  data: Partial<MineMotionPackageData>
): PackageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.packageFormat !== "minemotion-package-json") {
    errors.push("Unsupported .minemotion package format.");
  }
  if (!data.manifest) {
    errors.push("Package is missing manifest.json data.");
  }
  if (!data.project) {
    errors.push("Package is missing project.json data.");
  }
  if (data.manifest && data.manifest.schemaVersion !== 1) {
    errors.push(`Unsupported package schema version: ${data.manifest.schemaVersion}.`);
  }
  if (
    data.manifest?.compatibility?.projectSchemaVersion !== undefined &&
    data.project?.schemaVersion !== undefined &&
    data.manifest.compatibility.projectSchemaVersion !== data.project.schemaVersion
  ) {
    errors.push("Package manifest project schema does not match project data.");
  }
  if (
    data.manifest?.compatibility?.projectSchemaVersion !== undefined &&
    data.manifest.compatibility.projectSchemaVersion >
      CURRENT_PROJECT_SCHEMA_VERSION
  ) {
    errors.push(
      `Unsupported project schema version: ${data.manifest.compatibility.projectSchemaVersion}.`
    );
  }
  if (data.manifest?.warnings?.length) {
    warnings.push(...data.manifest.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
