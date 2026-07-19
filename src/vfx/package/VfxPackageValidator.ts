import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import {
  VFX_PACKAGE_EFFECT_PATH,
  VFX_PACKAGE_FORMAT,
  VFX_PACKAGE_LIMITS,
  VFX_PACKAGE_MANIFEST_VERSION,
  type VfxPackageAssetKind,
  type VfxPackageAssetManifest,
  type VfxPackageManifestV1,
  type VfxPackagePermission
} from "./VfxPackageTypes";

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
const VERSION_RANGE_PATTERN = /^(?:\^|~|>=|<=|>|<)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const SPDX_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.+-]{0,63}$/;
const PERMISSIONS = new Set<VfxPackagePermission>(["asset-textures", "asset-audio", "asset-models", "restricted-shader-templates"]);
const ASSET_KINDS = new Set<VfxPackageAssetKind>(["texture", "sprite", "audio", "model", "gradient", "curve", "thumbnail", "localization", "restricted-shader-template"]);
const IMAGE_KINDS = new Set<VfxPackageAssetKind>(["texture", "sprite", "thumbnail"]);
const JSON_KINDS = new Set<VfxPackageAssetKind>(["model", "gradient", "curve", "localization", "restricted-shader-template"]);

function issue(code: string, message: string, path: string): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function onlyKeys(record: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = new Set(allowed);
  return Object.keys(record).every((key) => keys.has(key));
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function validText(value: unknown, max = 256, allowEmpty = false): value is string {
  return typeof value === "string" && value.length <= max && (allowEmpty || value.trim().length > 0);
}

function validateAsset(asset: unknown, index: number, errors: ValidationIssue[]): asset is VfxPackageAssetManifest {
  const path = `assets.${index}`;
  if (!isRecord(asset) || !onlyKeys(asset, ["id", "path", "kind", "mimeType", "byteLength", "width", "height", "license"])) {
    errors.push(issue("VFX_PACKAGE_ASSET_INVALID", "Asset manifest entry is invalid or contains unsupported fields.", path));
    return false;
  }
  if (typeof asset.id !== "string" || !ID_PATTERN.test(asset.id)) errors.push(issue("VFX_PACKAGE_ASSET_ID_INVALID", "Asset ID is invalid.", `${path}.id`));
  if (!validVfxPackagePath(asset.path) || asset.path === VFX_PACKAGE_EFFECT_PATH || asset.path === "manifest.json") errors.push(issue("VFX_PACKAGE_ASSET_PATH_INVALID", "Asset path is invalid or reserved.", `${path}.path`));
  if (!ASSET_KINDS.has(asset.kind as VfxPackageAssetKind)) errors.push(issue("VFX_PACKAGE_ASSET_KIND_UNSUPPORTED", "Asset kind is unsupported.", `${path}.kind`));
  if (!validText(asset.mimeType, 128)) errors.push(issue("VFX_PACKAGE_ASSET_MIME_INVALID", "Asset MIME type is invalid.", `${path}.mimeType`));
  if (!Number.isSafeInteger(asset.byteLength) || (asset.byteLength as number) < 0 || (asset.byteLength as number) > VFX_PACKAGE_LIMITS.entryBytes) errors.push(issue("VFX_PACKAGE_ASSET_SIZE_INVALID", "Asset byte length exceeds package limits.", `${path}.byteLength`));
  const kind = asset.kind as VfxPackageAssetKind;
  if (IMAGE_KINDS.has(kind)) {
    if (asset.mimeType !== "image/png") errors.push(issue("VFX_PACKAGE_IMAGE_MIME_UNSUPPORTED", "VFX image assets must be PNG.", `${path}.mimeType`));
    if (!Number.isSafeInteger(asset.width) || !Number.isSafeInteger(asset.height) || (asset.width as number) < 1 || (asset.height as number) < 1 || (asset.width as number) > VFX_PACKAGE_LIMITS.imageDimension || (asset.height as number) > VFX_PACKAGE_LIMITS.imageDimension) errors.push(issue("VFX_PACKAGE_IMAGE_DIMENSIONS_INVALID", "Image dimensions are missing or exceed limits.", `${path}.width`));
  } else if (asset.width !== undefined || asset.height !== undefined) {
    errors.push(issue("VFX_PACKAGE_ASSET_DIMENSIONS_UNEXPECTED", "Only image assets may declare dimensions.", `${path}.width`));
  }
  if (kind === "audio" && !["audio/wav", "audio/ogg", "audio/mpeg"].includes(asset.mimeType as string)) errors.push(issue("VFX_PACKAGE_AUDIO_MIME_UNSUPPORTED", "Audio MIME type is unsupported.", `${path}.mimeType`));
  if (JSON_KINDS.has(kind) && asset.mimeType !== "application/json") errors.push(issue("VFX_PACKAGE_JSON_MIME_REQUIRED", "This asset kind must use application/json.", `${path}.mimeType`));
  if (asset.license !== undefined && (typeof asset.license !== "string" || !SPDX_PATTERN.test(asset.license))) errors.push(issue("VFX_PACKAGE_ASSET_LICENSE_INVALID", "Asset license must be a bounded SPDX identifier.", `${path}.license`));
  return true;
}

export function validVfxPackagePath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || new TextEncoder().encode(value).byteLength > VFX_PACKAGE_LIMITS.pathBytes) return false;
  if (value.includes("\\") || value.includes("\0") || value.startsWith("/") || /^[A-Za-z]:/.test(value) || value !== value.normalize("NFC")) return false;
  const parts = value.split("/");
  return parts.every((part) => part.length > 0 && part !== "." && part !== ".." && !/[\u0000-\u001f\u007f]/.test(part));
}

export function validateVfxPackageManifest(value: unknown): ValidationResult<VfxPackageManifestV1> {
  if (!isRecord(value) || !onlyKeys(value, ["format", "manifestVersion", "packageVersion", "minStudioVersion", "id", "displayName", "description", "author", "license", "effect", "dependencies", "permissions", "assets"])) {
    return invalidResult([issue("VFX_PACKAGE_MANIFEST_INVALID", "VFX package manifest is invalid or contains unsupported fields.", "manifest")]);
  }
  const errors: ValidationIssue[] = [];
  if (value.format !== VFX_PACKAGE_FORMAT) errors.push(issue("VFX_PACKAGE_FORMAT_UNSUPPORTED", "VFX package format is unsupported.", "format"));
  if (value.manifestVersion !== VFX_PACKAGE_MANIFEST_VERSION) errors.push(issue("VFX_PACKAGE_VERSION_UNSUPPORTED", "VFX package manifest version is unsupported.", "manifestVersion"));
  if (typeof value.packageVersion !== "string" || !SEMVER_PATTERN.test(value.packageVersion)) errors.push(issue("VFX_PACKAGE_SEMVER_INVALID", "Package version must be semantic versioning.", "packageVersion"));
  if (typeof value.minStudioVersion !== "string" || !SEMVER_PATTERN.test(value.minStudioVersion)) errors.push(issue("VFX_PACKAGE_STUDIO_VERSION_INVALID", "Minimum Studio version must be semantic versioning.", "minStudioVersion"));
  if (typeof value.id !== "string" || !ID_PATTERN.test(value.id)) errors.push(issue("VFX_PACKAGE_ID_INVALID", "Package ID is invalid.", "id"));
  if (!validText(value.displayName, 128) || !validText(value.description, 1024, true) || !validText(value.author, 128)) errors.push(issue("VFX_PACKAGE_METADATA_INVALID", "Package name, description, or author is invalid.", "displayName"));
  if (typeof value.license !== "string" || !SPDX_PATTERN.test(value.license)) errors.push(issue("VFX_PACKAGE_LICENSE_INVALID", "Package license must be a bounded SPDX identifier.", "license"));
  if (!isRecord(value.effect) || !onlyKeys(value.effect, ["path", "documentId"]) || value.effect.path !== VFX_PACKAGE_EFFECT_PATH || typeof value.effect.documentId !== "string" || !ID_PATTERN.test(value.effect.documentId)) errors.push(issue("VFX_PACKAGE_EFFECT_INVALID", "Package effect reference is invalid.", "effect"));

  if (!Array.isArray(value.dependencies) || value.dependencies.length > VFX_PACKAGE_LIMITS.dependencies) {
    errors.push(issue("VFX_PACKAGE_DEPENDENCIES_INVALID", "Package dependencies exceed supported limits.", "dependencies"));
  } else {
    const ids = new Set<string>();
    value.dependencies.forEach((dependency, index) => {
      const path = `dependencies.${index}`;
      if (!isRecord(dependency) || !onlyKeys(dependency, ["id", "versionRange", "optional"]) || typeof dependency.id !== "string" || !ID_PATTERN.test(dependency.id) || typeof dependency.versionRange !== "string" || !VERSION_RANGE_PATTERN.test(dependency.versionRange) || typeof dependency.optional !== "boolean") errors.push(issue("VFX_PACKAGE_DEPENDENCY_INVALID", "Package dependency is invalid.", path));
      else if (ids.has(dependency.id) || dependency.id === value.id) errors.push(issue("VFX_PACKAGE_DEPENDENCY_DUPLICATE", "Package dependency is duplicate or self-referential.", `${path}.id`));
      else ids.add(dependency.id);
    });
  }

  const permissionSet = new Set<VfxPackagePermission>();
  if (!Array.isArray(value.permissions) || value.permissions.length > PERMISSIONS.size) errors.push(issue("VFX_PACKAGE_PERMISSIONS_INVALID", "Package permissions are invalid.", "permissions"));
  else value.permissions.forEach((permission, index) => {
    if (!PERMISSIONS.has(permission as VfxPackagePermission) || permissionSet.has(permission as VfxPackagePermission)) errors.push(issue("VFX_PACKAGE_PERMISSION_UNSUPPORTED", "Package permission is unsupported or duplicated.", `permissions.${index}`));
    else permissionSet.add(permission as VfxPackagePermission);
  });

  const assetIds = new Set<string>();
  const assetPaths = new Set<string>();
  if (!Array.isArray(value.assets) || value.assets.length > VFX_PACKAGE_LIMITS.assets) errors.push(issue("VFX_PACKAGE_ASSETS_INVALID", "Package assets exceed supported limits.", "assets"));
  else value.assets.forEach((asset, index) => {
    if (!validateAsset(asset, index, errors)) return;
    const foldedPath = asset.path.toLocaleLowerCase("en-US");
    if (assetIds.has(asset.id) || assetPaths.has(foldedPath)) errors.push(issue("VFX_PACKAGE_ASSET_DUPLICATE", "Asset IDs and case-insensitive paths must be unique.", `assets.${index}`));
    assetIds.add(asset.id);
    assetPaths.add(foldedPath);
    const required = asset.kind === "audio" ? "asset-audio" : asset.kind === "model" ? "asset-models" : asset.kind === "restricted-shader-template" ? "restricted-shader-templates" : asset.kind === "texture" || asset.kind === "sprite" ? "asset-textures" : null;
    if (required && !permissionSet.has(required)) errors.push(issue("VFX_PACKAGE_PERMISSION_REQUIRED", `Asset ${asset.id} requires permission ${required}.`, `permissions`));
  });
  if (errors.length > 0) return invalidResult(errors);
  try {
    return validResult(deepFreeze(structuredClone(value)) as unknown as VfxPackageManifestV1);
  } catch {
    return invalidResult([issue("VFX_PACKAGE_MANIFEST_CLONE_UNSAFE", "Manifest must be structured-cloneable plain data.", "manifest")]);
  }
}
