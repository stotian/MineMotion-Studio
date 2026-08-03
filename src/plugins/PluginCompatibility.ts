import { MINEMOTION_PLUGIN_API_VERSION, type ExtensionDependency } from "./ExtensionTypes";

export interface CompatibilityInput {
  id: string;
  apiVersion?: string;
  minMineMotionVersion: string;
  maxTestedMineMotionVersion?: string;
  dependencies?: ExtensionDependency[];
}

export interface CompatibilityResult {
  compatible: boolean;
  errors: string[];
  warnings: string[];
}

export function checkExtensionCompatibility(
  extension: CompatibilityInput,
  installed: ReadonlyMap<string, string>,
  appVersion: string
): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if ((extension.apiVersion ?? MINEMOTION_PLUGIN_API_VERSION) !== MINEMOTION_PLUGIN_API_VERSION) {
    errors.push(`Unsupported plugin API version: ${extension.apiVersion}.`);
  }
  if (compareVersions(appVersion, extension.minMineMotionVersion) < 0) {
    errors.push(`MineMotion ${extension.minMineMotionVersion} or newer is required.`);
  }
  if (extension.maxTestedMineMotionVersion && compareVersions(appVersion, extension.maxTestedMineMotionVersion) > 0) {
    warnings.push(`This extension was only tested through MineMotion ${extension.maxTestedMineMotionVersion}.`);
  }
  for (const dependency of extension.dependencies ?? []) {
    const installedVersion = installed.get(dependency.id);
    if (!installedVersion && !dependency.optional) {
      errors.push(`Missing dependency ${dependency.id}@${dependency.version}.`);
    } else if (installedVersion && compareVersions(installedVersion, dependency.version) < 0) {
      errors.push(`Dependency ${dependency.id} requires ${dependency.version} or newer.`);
    }
  }
  return { compatible: errors.length === 0, errors, warnings };
}

export function compareVersions(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0);
    if (delta !== 0) return Math.sign(delta);
  }
  return 0;
}

function parseVersion(value: string): number[] {
  return value.split(/[.+-]/).slice(0, 3).map((part) => Math.max(0, Number.parseInt(part, 10) || 0));
}
