import packageMetadata from "../../../package.json";
import { createStoredZip } from "../../export/ZipWriter";
import { compileVfxAuthoringDocument } from "../authoring/VfxAuthoringCompiler";
import { validateVfxAuthoringDocument } from "../authoring/VfxAuthoringDocument";
import type { VfxAuthoringDocument } from "../authoring/VfxAuthoringTypes";
import { readVfxPackageArchive } from "./VfxPackageArchiveReader";
import {
  VFX_PACKAGE_EFFECT_PATH,
  VFX_PACKAGE_FORMAT,
  VFX_PACKAGE_MANIFEST_PATH,
  VFX_PACKAGE_MANIFEST_VERSION,
  type VfxPackageArchiveEntry,
  type VfxPackageDependency,
  type VfxPackageManifestV1,
  type VfxPackagePermission
} from "./VfxPackageTypes";
import { validateVfxPackageManifest } from "./VfxPackageValidator";

const CANONICAL_ZIP_DATE = new Date(1980, 0, 1, 0, 0, 0);

export interface CreateVfxPackageManifestOptions {
  packageVersion?: string;
  id?: string;
  displayName?: string;
  description?: string;
  author: string;
  license: string;
  dependencies?: readonly VfxPackageDependency[];
  permissions?: readonly VfxPackagePermission[];
  assets?: VfxPackageManifestV1["assets"];
}

export interface WriteVfxPackageOptions {
  manifest: VfxPackageManifestV1;
  document: VfxAuthoringDocument;
  assets?: readonly Pick<VfxPackageArchiveEntry, "path" | "bytes">[];
}

export interface VfxPackageWriteResult {
  blob: Blob;
  filename: string;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value !== "object" || value === null) return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, child]) => [key, canonicalize(child)])
  );
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalManifestOrder(manifest: VfxPackageManifestV1): VfxPackageManifestV1 {
  const candidate = {
    ...manifest,
    dependencies: [...manifest.dependencies].sort((left, right) =>
      compareText(left.id, right.id) || compareText(left.versionRange, right.versionRange)
    ),
    permissions: [...manifest.permissions].sort(),
    assets: [...manifest.assets].sort((left, right) => compareText(left.path, right.path))
  };
  const validation = validateVfxPackageManifest(candidate);
  if (!validation.ok) throw new Error(validation.errors.map((entry) => entry.message).join(" "));
  return validation.value;
}

export function canonicalVfxPackageJson(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function createVfxPackageManifest(
  document: VfxAuthoringDocument,
  options: CreateVfxPackageManifestOptions
): VfxPackageManifestV1 {
  const validation = validateVfxAuthoringDocument(document);
  if (!validation.ok) throw new Error(validation.errors.map((entry) => entry.message).join(" "));
  const candidate: VfxPackageManifestV1 = {
    format: VFX_PACKAGE_FORMAT,
    manifestVersion: VFX_PACKAGE_MANIFEST_VERSION,
    packageVersion: options.packageVersion ?? "1.0.0",
    minStudioVersion: packageMetadata.version,
    id: options.id ?? validation.value.id,
    displayName: options.displayName ?? validation.value.displayName,
    description: options.description ?? validation.value.description,
    author: options.author,
    license: options.license,
    effect: { path: VFX_PACKAGE_EFFECT_PATH, documentId: validation.value.id },
    dependencies: options.dependencies ?? [],
    permissions: options.permissions ?? [],
    assets: options.assets ?? []
  };
  const manifestValidation = validateVfxPackageManifest(candidate);
  if (!manifestValidation.ok) throw new Error(manifestValidation.errors.map((entry) => entry.message).join(" "));
  return canonicalManifestOrder(manifestValidation.value);
}

export async function writeVfxPackageArchive(
  options: WriteVfxPackageOptions
): Promise<VfxPackageWriteResult> {
  const manifestValidation = validateVfxPackageManifest(options.manifest);
  if (!manifestValidation.ok) throw new Error(manifestValidation.errors.map((entry) => entry.message).join(" "));
  const manifest = canonicalManifestOrder(manifestValidation.value);
  const documentValidation = validateVfxAuthoringDocument(options.document);
  if (!documentValidation.ok) throw new Error(documentValidation.errors.map((entry) => entry.message).join(" "));
  if (manifest.effect.documentId !== documentValidation.value.id) throw new Error("Manifest effect document ID does not match the authoring document.");
  const compilation = compileVfxAuthoringDocument(documentValidation.value);
  if (!compilation.ok) throw new Error(compilation.errors.map((entry) => entry.message).join(" "));
  const assets = new Map((options.assets ?? []).map((entry) => [entry.path, entry.bytes]));
  if (assets.size !== (options.assets ?? []).length) throw new Error("VFX package asset paths must be unique.");
  const declared = new Set(manifest.assets.map((asset) => asset.path));
  if (declared.size !== assets.size || [...declared].some((path) => !assets.has(path))) throw new Error("VFX package assets must exactly match the manifest.");
  const encoder = new TextEncoder();
  const entries = [
    { filename: VFX_PACKAGE_MANIFEST_PATH, data: encoder.encode(canonicalVfxPackageJson(manifest)), date: CANONICAL_ZIP_DATE },
    { filename: VFX_PACKAGE_EFFECT_PATH, data: encoder.encode(canonicalVfxPackageJson(documentValidation.value)), date: CANONICAL_ZIP_DATE },
    ...[...assets.entries()]
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([filename, data]) => ({ filename, data: data.slice(), date: CANONICAL_ZIP_DATE }))
  ];
  const stored = createStoredZip(entries);
  const bytes = await stored.arrayBuffer();
  await readVfxPackageArchive(bytes);
  const safeId = manifest.id.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return {
    blob: new Blob([bytes], { type: "application/vnd.minemotion.vfx+zip" }),
    filename: `${safeId}.minemotion-vfx`
  };
}
