import { compileVfxAuthoringDocument } from "../authoring/VfxAuthoringCompiler";
import { generateVfxDescriptorPreviewDataUrl } from "../library/VfxPresetPreviewCache";
import type {
  VfxPackageArchive,
  VfxPackagePermission
} from "./VfxPackageTypes";
import { resolveVfxPackagePresentation } from "./VfxPackageLocalization";
import { compareSemVer, isValidSemVer, parseSemVer } from "../../core/version/SemVer";

export interface InstalledVfxPackageVersion {
  id: string;
  version: string;
}

export interface VfxPackageDependencyReport {
  id: string;
  versionRange: string;
  optional: boolean;
  installedVersion: string | null;
  status: "satisfied" | "missing" | "version-mismatch";
}

export interface VfxPackageInspectionReport {
  packageId: string;
  packageVersion: string;
  displayName: string;
  author: string;
  license: string;
  compatible: boolean;
  installReady: boolean;
  dependencies: readonly VfxPackageDependencyReport[];
  permissions: readonly { id: VfxPackagePermission; description: string }[];
  assetCount: number;
  assetBytes: number;
  assetLicenses: readonly string[];
  primitiveCount: number;
  particles: number;
  segments: number;
  previewDataUrl: string;
}

const PERMISSION_DESCRIPTIONS: Readonly<Record<VfxPackagePermission, string>> = {
  "asset-textures": "Use package-provided textures and sprites.",
  "asset-audio": "Use package-provided audio during preview and export.",
  "asset-models": "Use package-provided supported model data.",
  "restricted-shader-templates": "Use validated built-in shader template parameters only."
};
export function compareVfxPackageVersions(left: string, right: string): number {
  return compareSemVer(left, right);
}

export function satisfiesVfxPackageVersion(version: string, range: string): boolean {
  const match = /^(\^|~|>=|<=|>|<)?(.+)$/.exec(range);
  if (!match || !isValidSemVer(version) || !isValidSemVer(match[2])) return false;
  const operator = match[1] ?? "";
  const target = match[2];
  const relation = compareVfxPackageVersions(version, target);
  if (operator === ">=") return relation >= 0;
  if (operator === "<=") return relation <= 0;
  if (operator === ">") return relation > 0;
  if (operator === "<") return relation < 0;
  if (operator === "^") {
    const { major, minor, patch } = parseSemVer(target)!;
    const { major: actualMajor, minor: actualMinor, patch: actualPatch } = parseSemVer(version)!;
    if (major > 0) return relation >= 0 && actualMajor === major;
    if (minor > 0) return relation >= 0 && actualMajor === 0 && actualMinor === minor;
    return relation >= 0 && actualMajor === 0 && actualMinor === 0 && actualPatch === patch;
  }
  if (operator === "~") {
    const { major, minor } = parseSemVer(target)!;
    const { major: actualMajor, minor: actualMinor } = parseSemVer(version)!;
    return relation >= 0 && actualMajor === major && actualMinor === minor;
  }
  return relation === 0;
}

export function inspectVfxPackage(
  archive: VfxPackageArchive,
  installed: readonly InstalledVfxPackageVersion[] = [],
  requestedLocale?: string
): VfxPackageInspectionReport {
  const installedById = new Map(installed.map((entry) => [entry.id, entry.version]));
  const dependencies = archive.manifest.dependencies.map((dependency) => {
    const installedVersion = installedById.get(dependency.id) ?? null;
    const status = installedVersion === null
      ? "missing" as const
      : satisfiesVfxPackageVersion(installedVersion, dependency.versionRange)
        ? "satisfied" as const
        : "version-mismatch" as const;
    return Object.freeze({ ...dependency, installedVersion, status });
  });
  const compilation = compileVfxAuthoringDocument(archive.document);
  if (!compilation.ok) throw new Error(compilation.errors.map((entry) => entry.message).join(" "));
  const presentation = requestedLocale
    ? resolveVfxPackagePresentation(archive, requestedLocale)
    : archive.manifest;
  const requiredDependenciesReady = dependencies.every((dependency) => dependency.optional || dependency.status === "satisfied");
  return Object.freeze({
    packageId: archive.manifest.id,
    packageVersion: archive.manifest.packageVersion,
    displayName: presentation.displayName,
    author: archive.manifest.author,
    license: archive.manifest.license,
    compatible: true,
    installReady: requiredDependenciesReady,
    dependencies: Object.freeze(dependencies),
    permissions: Object.freeze(archive.manifest.permissions.map((id) => Object.freeze({ id, description: PERMISSION_DESCRIPTIONS[id] }))),
    assetCount: archive.manifest.assets.length,
    assetBytes: archive.manifest.assets.reduce((sum, asset) => sum + asset.byteLength, 0),
    assetLicenses: Object.freeze([...new Set(archive.manifest.assets.map((asset) => asset.license ?? archive.manifest.license))].sort()),
    primitiveCount: compilation.value.descriptors.length,
    particles: compilation.value.work.particles,
    segments: compilation.value.work.segments,
    previewDataUrl: generateVfxDescriptorPreviewDataUrl(compilation.value.descriptors, presentation.displayName, archive.manifest.id)
  });
}
