import type { CameraPreset } from "../presets/CameraPresets";
import type { SafeContentPack, SafeContentPackData } from "./ExtensionTypes";
import { MINEMOTION_PLUGIN_API_VERSION } from "./ExtensionTypes";

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,80}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i;
const MAX_JSON_BYTES = 5 * 1024 * 1024;
const MAX_TEXTURE_DATA_LENGTH = 2 * 1024 * 1024;

export interface ContentPackValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  pack?: SafeContentPack;
}

export function parseAndValidateContentPack(raw: string): ContentPackValidationResult {
  if (new TextEncoder().encode(raw).byteLength > MAX_JSON_BYTES) {
    return { valid: false, errors: ["Content pack exceeds the 5 MiB JSON limit."], warnings: [] };
  }
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return { valid: false, errors: ["Content pack is not valid JSON."], warnings: [] }; }
  return validateContentPack(value);
}

export function validateContentPack(value: unknown): ContentPackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!value || typeof value !== "object") return { valid: false, errors: ["Content pack must be an object."], warnings };
  const source = value as Partial<SafeContentPack> & Record<string, unknown>;
  if (source.kind !== "content-pack") errors.push("Content pack kind must be content-pack.");
  if (!ID_PATTERN.test(String(source.id ?? ""))) errors.push("Content pack id is invalid.");
  if (!VERSION_PATTERN.test(String(source.version ?? ""))) errors.push("Content pack version must use semantic versioning.");
  if (source.apiVersion !== MINEMOTION_PLUGIN_API_VERSION) errors.push(`Content pack API must be ${MINEMOTION_PLUGIN_API_VERSION}.`);
  if ("entry" in source || "script" in source || "code" in source) errors.push("Safe content packs cannot declare executable code.");
  const data = sanitizeData(source.data, errors, warnings);
  const dependencies = Array.isArray(source.dependencies) ? source.dependencies.flatMap((dependency) => {
    if (!dependency || typeof dependency !== "object") return [];
    const item = dependency as { id?: unknown; version?: unknown; optional?: unknown };
    if (!ID_PATTERN.test(String(item.id ?? "")) || !VERSION_PATTERN.test(String(item.version ?? ""))) {
      errors.push("A content pack dependency is invalid.");
      return [];
    }
    return [{ id: String(item.id), version: String(item.version), optional: item.optional === true }];
  }) : [];
  const pack: SafeContentPack = {
    kind: "content-pack",
    id: String(source.id ?? ""),
    name: sanitizeText(source.name, "Unnamed content pack", 120),
    version: String(source.version ?? "0.0.0"),
    apiVersion: MINEMOTION_PLUGIN_API_VERSION,
    minMineMotionVersion: sanitizeText(source.minMineMotionVersion, "0.8.2", 32),
    maxTestedMineMotionVersion: typeof source.maxTestedMineMotionVersion === "string" ? source.maxTestedMineMotionVersion : undefined,
    author: sanitizeText(source.author, "Unknown", 120),
    description: sanitizeText(source.description, "", 1000),
    license: sanitizeLicense(source.license),
    dependencies,
    capabilities: Array.isArray(source.capabilities) ? source.capabilities.filter((item): item is string => typeof item === "string").slice(0, 50) : [],
    data
  };
  return { valid: errors.length === 0, errors, warnings, pack: errors.length === 0 ? pack : undefined };
}

function sanitizeData(value: unknown, errors: string[], warnings: string[]): SafeContentPackData {
  if (!value || typeof value !== "object") return {};
  const source = value as SafeContentPackData;
  const cameraPresets = Array.isArray(source.cameraPresets)
    ? source.cameraPresets.flatMap((preset, index) => sanitizeCameraPreset(preset, index, errors))
    : [];
  const textures = Array.isArray(source.textures) ? source.textures.flatMap((texture) => {
    if (!texture || typeof texture !== "object") return [];
    if (isUnsafePath(texture.path)) { errors.push(`Unsafe texture path: ${texture.path}.`); return []; }
    if (!/^image\/(png|jpeg|webp)$/.test(texture.mimeType)) { errors.push(`Unsupported texture MIME type: ${texture.mimeType}.`); return []; }
    if (typeof texture.dataUrl !== "string" || texture.dataUrl.length > MAX_TEXTURE_DATA_LENGTH) { errors.push(`Texture ${texture.path} is invalid or too large.`); return []; }
    return [{ path: texture.path, mimeType: texture.mimeType, dataUrl: texture.dataUrl }];
  }) : [];
  if ((source.vfxPresets?.length ?? 0) > 500) warnings.push("Only the first 500 VFX preset records should be consumed by a host.");
  return {
    cameraPresets,
    templates: Array.isArray(source.templates) ? source.templates.flatMap((template, index) => sanitizeTemplate(template, index, errors)).slice(0, 100) : [],
    vfxPresets: Array.isArray(source.vfxPresets) ? source.vfxPresets.slice(0, 500) : [],
    poses: Array.isArray(source.poses) ? source.poses.slice(0, 500) : [],
    animations: Array.isArray(source.animations) ? source.animations.slice(0, 500) : [],
    localization: sanitizeLocalization(source.localization),
    textures,
    resourceMappings: sanitizeMappings(source.resourceMappings, errors)
  };
}

function sanitizeTemplate(value: unknown, index: number, errors: string[]): NonNullable<SafeContentPackData["templates"]> {
  if (!value || typeof value !== "object") return [];
  const source = value as Record<string, unknown>;
  const id = String(source.id ?? "");
  if (!ID_PATTERN.test(id)) { errors.push(`Template ${index + 1} has an invalid id.`); return []; }
  if (!source.project || typeof source.project !== "object") { errors.push(`Template ${id} is missing a serialized project.`); return []; }
  const category = ["starter", "animation", "cinematic", "mood"].includes(String(source.category))
    ? String(source.category) as "starter" | "animation" | "cinematic" | "mood"
    : "starter";
  return [{ id, name: sanitizeText(source.name, id, 120), description: sanitizeText(source.description, "", 500), category, project: source.project }];
}

function sanitizeCameraPreset(value: unknown, index: number, errors: string[]): CameraPreset[] {
  if (!value || typeof value !== "object") return [];
  const source = value as Partial<CameraPreset>;
  const id = String(source.id ?? "");
  if (!ID_PATTERN.test(id)) { errors.push(`Camera preset ${index + 1} has an invalid id.`); return []; }
  const transform = source.transform;
  if (!transform || !isVector(transform.position) || !isVector(transform.rotation) || !isVector(transform.scale)) {
    errors.push(`Camera preset ${id} has an invalid transform.`); return [];
  }
  return [{ id, name: sanitizeText(source.name, id, 120), description: sanitizeText(source.description, "", 500), fov: Math.min(150, Math.max(1, Number(source.fov) || 45)), transform: { position: [...transform.position], rotation: [...transform.rotation], scale: [...transform.scale] } }];
}

function sanitizeLocalization(value: unknown): Record<string, Record<string, string>> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 20).map(([locale, catalog]) => [locale.slice(0, 16), catalog && typeof catalog === "object" ? Object.fromEntries(Object.entries(catalog as Record<string, unknown>).filter(([, text]) => typeof text === "string").slice(0, 1000) as Array<[string, string]>) : {}]));
}
function sanitizeMappings(value: unknown, errors: string[]): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, path]) => {
    if (typeof path !== "string" || isUnsafePath(path)) { errors.push(`Unsafe resource mapping path for ${key}.`); return []; }
    return [[key.slice(0, 180), path]];
  }).slice(0, 5000));
}
function isUnsafePath(value: string): boolean { return value.startsWith("/") || value.startsWith("\\") || value.includes("..") || /^[a-z]:/i.test(value); }
function isVector(value: unknown): value is [number, number, number] { return Array.isArray(value) && value.length === 3 && value.every((part) => Number.isFinite(Number(part))); }
function sanitizeText(value: unknown, fallback: string, limit: number): string { return typeof value === "string" && value.trim() ? value.trim().slice(0, limit) : fallback; }
function sanitizeLicense(value: unknown): SafeContentPack["license"] { const source = value && typeof value === "object" ? value as Record<string, unknown> : {}; return { id: sanitizeText(source.id, "UNLICENSED", 64), url: typeof source.url === "string" && /^https:\/\//.test(source.url) ? source.url : undefined, attribution: typeof source.attribution === "string" ? source.attribution.slice(0, 500) : undefined }; }
