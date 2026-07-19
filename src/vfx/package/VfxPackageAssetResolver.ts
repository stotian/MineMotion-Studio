import { isSafeVfxColor } from "../core/VfxParameter";
import type {
  VfxPackageArchive,
  VfxPackageArchiveEntry,
  VfxPackageAssetManifest
} from "./VfxPackageTypes";

export const VFX_PACKAGE_ASSET_SCHEMA_VERSION = 1 as const;
const MAX_JSON_DEPTH = 16;
const MAX_JSON_NODES = 4096;
const MAX_JSON_STRING = 4096;
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;

export type RestrictedShaderTemplateId =
  | "soft-glow"
  | "heat-distortion"
  | "pixel-dissolve";

export interface ResolvedRestrictedShaderTemplate {
  kind: "restricted-shader-template";
  templateId: RestrictedShaderTemplateId;
  activeTemplateId: RestrictedShaderTemplateId | null;
  parameters: Readonly<Record<string, number | string>>;
  fallback: "primitive-default-material";
  warning: string | null;
}

export type ResolvedVfxPackageAsset =
  | { kind: "texture" | "sprite" | "thumbnail"; id: string; mimeType: "image/png"; width: number; height: number; dataUrl: string }
  | { kind: "audio"; id: string; mimeType: "audio/wav" | "audio/ogg" | "audio/mpeg"; byteLength: number; dataUrl: string }
  | { kind: "model"; id: string; boxes: readonly { id: string; center: readonly [number, number, number]; size: readonly [number, number, number]; color: string }[] }
  | { kind: "gradient"; id: string; interpolation: "linear" | "constant"; stops: readonly { position: number; color: string }[] }
  | { kind: "curve"; id: string; interpolation: "linear" | "step" | "smooth"; points: readonly { x: number; y: number }[] }
  | { kind: "localization"; id: string; locale: string; entries: Readonly<Record<string, string>> }
  | ({ id: string } & ResolvedRestrictedShaderTemplate);

export class VfxPackageAssetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VfxPackageAssetError";
  }
}

function fail(message: string): never {
  throw new VfxPackageAssetError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(record: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(record).every((key) => allowed.has(key)) && keys.every((key) => Object.hasOwn(record, key));
}

function inspectJsonShape(value: unknown, depth = 0, state = { nodes: 0 }): void {
  state.nodes += 1;
  if (state.nodes > MAX_JSON_NODES || depth > MAX_JSON_DEPTH) fail("VFX JSON asset exceeds structural limits.");
  if (typeof value === "string" && value.length > MAX_JSON_STRING) fail("VFX JSON asset string exceeds its limit.");
  if (typeof value === "number" && !Number.isFinite(value)) fail("VFX JSON asset contains a non-finite number.");
  if (Array.isArray(value)) {
    value.forEach((item) => inspectJsonShape(item, depth + 1, state));
  } else if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (key.length > 128 || key === "__proto__" || key === "prototype" || key === "constructor") fail("VFX JSON asset contains a forbidden or oversized key.");
      inspectJsonShape(child, depth + 1, state);
    }
  } else if (value !== null && !["string", "number", "boolean"].includes(typeof value)) {
    fail("VFX JSON asset contains an unsupported value.");
  }
}

function parseJson(entry: VfxPackageArchiveEntry): unknown {
  try {
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(entry.bytes));
    inspectJsonShape(value);
    return value;
  } catch (error) {
    if (error instanceof VfxPackageAssetError) throw error;
    return fail(`VFX JSON asset is invalid: ${entry.path}.`);
  }
}

function vector3(value: unknown, positive = false): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === "number" && Number.isFinite(item) && Math.abs(item) <= 128 && (!positive || item > 0));
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function encodeBase64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const value = (a << 16) | (b << 8) | c;
    output += alphabet[(value >> 18) & 63];
    output += alphabet[(value >> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(value >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? alphabet[value & 63] : "=";
  }
  return output;
}

function validateAudio(asset: VfxPackageAssetManifest, entry: VfxPackageArchiveEntry): void {
  const bytes = entry.bytes;
  const text = (start: number, count: number) => new TextDecoder().decode(bytes.subarray(start, start + count));
  const valid = asset.mimeType === "audio/wav"
    ? bytes.length >= 12 && text(0, 4) === "RIFF" && text(8, 4) === "WAVE"
    : asset.mimeType === "audio/ogg"
      ? bytes.length >= 4 && text(0, 4) === "OggS"
      : bytes.length >= 3 && (text(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
  if (!valid) fail(`Audio signature does not match ${asset.mimeType}: ${asset.path}.`);
}

function resolveModel(id: string, value: unknown): ResolvedVfxPackageAsset {
  if (!isRecord(value) || !exactKeys(value, ["format", "version", "boxes"]) || value.format !== "minemotion-box-model" || value.version !== VFX_PACKAGE_ASSET_SCHEMA_VERSION || !Array.isArray(value.boxes) || value.boxes.length > 128) fail("Supported VFX model must be a bounded minemotion-box-model.");
  const ids = new Set<string>();
  const boxes = value.boxes.map((box) => {
    if (!isRecord(box) || !exactKeys(box, ["id", "center", "size", "color"]) || typeof box.id !== "string" || !ID_PATTERN.test(box.id) || ids.has(box.id) || !vector3(box.center) || !vector3(box.size, true) || !isSafeVfxColor(box.color)) fail("VFX model box is invalid.");
    ids.add(box.id);
    return { id: box.id, center: box.center, size: box.size, color: box.color };
  });
  return deepFreeze({ kind: "model", id, boxes });
}

function resolveGradient(id: string, value: unknown): ResolvedVfxPackageAsset {
  if (!isRecord(value) || !exactKeys(value, ["format", "version", "interpolation", "stops"]) || value.format !== "minemotion-gradient" || value.version !== 1 || (value.interpolation !== "linear" && value.interpolation !== "constant") || !Array.isArray(value.stops) || value.stops.length < 2 || value.stops.length > 16) fail("VFX gradient is invalid.");
  let previous = -1;
  const stops = value.stops.map((stop) => {
    if (!isRecord(stop) || !exactKeys(stop, ["position", "color"]) || typeof stop.position !== "number" || !Number.isFinite(stop.position) || stop.position < 0 || stop.position > 1 || stop.position <= previous || !isSafeVfxColor(stop.color)) fail("VFX gradient stop is invalid or unordered.");
    previous = stop.position;
    return { position: stop.position, color: stop.color };
  });
  return deepFreeze({ kind: "gradient", id, interpolation: value.interpolation, stops });
}

function resolveCurve(id: string, value: unknown): ResolvedVfxPackageAsset {
  if (!isRecord(value) || !exactKeys(value, ["format", "version", "interpolation", "points"]) || value.format !== "minemotion-curve" || value.version !== 1 || !["linear", "step", "smooth"].includes(value.interpolation as string) || !Array.isArray(value.points) || value.points.length < 2 || value.points.length > 64) fail("VFX curve is invalid.");
  let previous = -1;
  const points = value.points.map((point) => {
    if (!isRecord(point) || !exactKeys(point, ["x", "y"]) || typeof point.x !== "number" || !Number.isFinite(point.x) || point.x < 0 || point.x > 1 || point.x <= previous || typeof point.y !== "number" || !Number.isFinite(point.y) || Math.abs(point.y) > 1000) fail("VFX curve point is invalid or unordered.");
    previous = point.x;
    return { x: point.x, y: point.y };
  });
  return deepFreeze({ kind: "curve", id, interpolation: value.interpolation as "linear" | "step" | "smooth", points });
}

function resolveLocalization(id: string, value: unknown): ResolvedVfxPackageAsset {
  if (!isRecord(value) || !exactKeys(value, ["format", "version", "locale", "entries"]) || value.format !== "minemotion-localization" || value.version !== 1 || typeof value.locale !== "string" || !LOCALE_PATTERN.test(value.locale) || !isRecord(value.entries) || Object.keys(value.entries).length > 256) fail("VFX localization asset is invalid.");
  const entries: Record<string, string> = {};
  for (const [key, text] of Object.entries(value.entries)) {
    if (!ID_PATTERN.test(key) || typeof text !== "string" || text.length === 0 || text.length > 512) fail("VFX localization entry is invalid.");
    entries[key] = text;
  }
  return deepFreeze({ kind: "localization", id, locale: value.locale, entries });
}

function resolveShader(
  id: string,
  value: unknown,
  available: ReadonlySet<RestrictedShaderTemplateId>
): ResolvedVfxPackageAsset {
  if (!isRecord(value) || !exactKeys(value, ["format", "version", "templateId", "parameters"]) || value.format !== "minemotion-restricted-shader-template" || value.version !== 1 || !isRecord(value.parameters)) fail("Restricted shader template asset is invalid.");
  const templateId = value.templateId as RestrictedShaderTemplateId;
  let parameters: Record<string, number | string>;
  if (templateId === "soft-glow" && exactKeys(value.parameters, ["intensity", "radius"]) && typeof value.parameters.intensity === "number" && value.parameters.intensity >= 0 && value.parameters.intensity <= 4 && typeof value.parameters.radius === "number" && value.parameters.radius >= 0 && value.parameters.radius <= 8) parameters = { intensity: value.parameters.intensity, radius: value.parameters.radius };
  else if (templateId === "heat-distortion" && exactKeys(value.parameters, ["strength", "frequency"]) && typeof value.parameters.strength === "number" && value.parameters.strength >= 0 && value.parameters.strength <= 1 && typeof value.parameters.frequency === "number" && value.parameters.frequency >= 0 && value.parameters.frequency <= 64) parameters = { strength: value.parameters.strength, frequency: value.parameters.frequency };
  else if (templateId === "pixel-dissolve" && exactKeys(value.parameters, ["threshold", "edgeWidth", "edgeColor"]) && typeof value.parameters.threshold === "number" && value.parameters.threshold >= 0 && value.parameters.threshold <= 1 && typeof value.parameters.edgeWidth === "number" && value.parameters.edgeWidth >= 0 && value.parameters.edgeWidth <= 0.25 && isSafeVfxColor(value.parameters.edgeColor)) parameters = { threshold: value.parameters.threshold, edgeWidth: value.parameters.edgeWidth, edgeColor: value.parameters.edgeColor };
  else fail("Restricted shader template ID or parameters are unsupported.");
  const activeTemplateId = available.has(templateId) ? templateId : null;
  return deepFreeze({ kind: "restricted-shader-template", id, templateId, activeTemplateId, parameters, fallback: "primitive-default-material", warning: activeTemplateId ? null : `Template ${templateId} is unavailable; Primitive V1 default material will be used.` });
}

export function resolveVfxPackageAsset(
  archive: VfxPackageArchive,
  assetId: string,
  availableTemplates: ReadonlySet<RestrictedShaderTemplateId> = new Set(["soft-glow", "heat-distortion", "pixel-dissolve"])
): ResolvedVfxPackageAsset {
  const asset = archive.manifest.assets.find((item) => item.id === assetId);
  if (!asset) fail(`VFX package asset was not declared: ${assetId}.`);
  const entry = archive.entries.find((item) => item.path === asset.path);
  if (!entry) fail(`VFX package asset entry is missing: ${asset.path}.`);
  if (asset.kind === "texture" || asset.kind === "sprite" || asset.kind === "thumbnail") return deepFreeze({ kind: asset.kind, id: asset.id, mimeType: "image/png", width: asset.width!, height: asset.height!, dataUrl: `data:image/png;base64,${encodeBase64(entry.bytes)}` });
  if (asset.kind === "audio") {
    validateAudio(asset, entry);
    return deepFreeze({ kind: "audio", id: asset.id, mimeType: asset.mimeType as "audio/wav" | "audio/ogg" | "audio/mpeg", byteLength: entry.bytes.byteLength, dataUrl: `data:${asset.mimeType};base64,${encodeBase64(entry.bytes)}` });
  }
  const value = parseJson(entry);
  if (asset.kind === "model") return resolveModel(asset.id, value);
  if (asset.kind === "gradient") return resolveGradient(asset.id, value);
  if (asset.kind === "curve") return resolveCurve(asset.id, value);
  if (asset.kind === "localization") return resolveLocalization(asset.id, value);
  return resolveShader(asset.id, value, availableTemplates);
}

export function validateVfxPackageAssets(archive: VfxPackageArchive): void {
  for (const asset of archive.manifest.assets) resolveVfxPackageAsset(archive, asset.id);
}
