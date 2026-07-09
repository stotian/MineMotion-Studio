import type { MineMotionPackageData } from "./PackageTypes";

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
  if (data.manifest && data.manifest.schemaVersion > 1) {
    errors.push(`Unsupported package schema version: ${data.manifest.schemaVersion}.`);
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
