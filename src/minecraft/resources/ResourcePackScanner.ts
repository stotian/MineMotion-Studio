import {
  ResourcePackValidationError
} from "./ResourcePackErrors";
import type {
  ResourcePackAsset,
  ResourcePackEntry,
  ResourcePackMetadata,
  ResourcePackResolutionReport,
  ResourcePackScanResult,
  ResourcePackTextureAsset
} from "./ResourcePackTypes";

const PACK_METADATA_FILE = "pack.mcmeta";
const BLOCK_TEXTURE_ROOT = "assets/minecraft/textures/block/";

export class ResourcePackScanner {
  static scan(entries: ResourcePackEntry[]): ResourcePackScanResult {
    if (entries.length === 0) {
      throw new ResourcePackValidationError("The resource pack contains no files.");
    }

    const normalizedEntries = entries.map((entry) => ({
      ...entry,
      path: normalizeResourcePath(entry.path)
    }));
    const metadataEntry = normalizedEntries
      .filter(
        (entry) =>
          entry.path.toLowerCase() === PACK_METADATA_FILE ||
          entry.path.toLowerCase().endsWith(`/${PACK_METADATA_FILE}`)
      )
      .sort((left, right) => left.path.length - right.path.length)[0];
    const rootPath = metadataEntry
      ? metadataEntry.path.slice(0, -PACK_METADATA_FILE.length)
      : inferResourceRoot(normalizedEntries);
    const textureRoot = `${rootPath}${BLOCK_TEXTURE_ROOT}`.toLowerCase();
    const metadata = metadataEntry
      ? parsePackMetadata(new TextDecoder().decode(metadataEntry.bytes))
      : createMissingMetadata();
    const animationMetadata = new Map(
      normalizedEntries
        .filter((entry) => entry.path.toLowerCase().endsWith(".png.mcmeta"))
        .map((entry) => [
          entry.path.toLowerCase(),
          parseAnimationMetadata(new TextDecoder().decode(entry.bytes))
        ])
    );
    const textures = normalizedEntries
      .filter((entry) => {
        const path = entry.path.toLowerCase();
        return path.startsWith(textureRoot) && path.endsWith(".png");
      })
      .map((entry) => ({
        path: entry.path.slice(rootPath.length),
        blockName: entry.path
          .slice(textureRoot.length, -4)
          .replace(/\\/g, "/")
          .toLowerCase(),
        bytes: entry.bytes,
        animated: animationMetadata.has(`${entry.path.toLowerCase()}.mcmeta`),
        animation:
          animationMetadata.get(`${entry.path.toLowerCase()}.mcmeta`) ?? null
      }))
      .sort((left, right) => left.path.localeCompare(right.path));
    const warnings: string[] = [];

    if (!metadataEntry) {
      warnings.push("pack.mcmeta was not found; texture import can still continue.");
    }
    if (textures.length === 0) {
      warnings.push("No block PNG textures were found under assets/minecraft/textures/block/.");
    }

    return {
      rootPath,
      metadata,
      textures,
      warnings
    };
  }

  static parseMetadata(raw: string): ResourcePackMetadata {
    return parsePackMetadata(raw);
  }
}

export function sanitizeResourcePackTextureAssets(value: unknown): ResourcePackTextureAsset[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isResourcePackTextureAsset).map((texture) => ({
    ...texture,
    animated: texture.animated ?? false,
    animation: sanitizeAnimationMetadata(texture.animation)
  }));
}

export function sanitizeResourcePackAssets(value: unknown): ResourcePackAsset[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((pack, index) => {
    if (typeof pack.id !== "string" || typeof pack.name !== "string") return [];
    const metadata = isRecord(pack.metadata) ? pack.metadata : {};
    return [{
      id: pack.id,
      name: pack.name,
      sourceKind: pack.sourceKind === "folder" ? "folder" as const : "zip" as const,
      metadata: {
        packFormat:
          typeof metadata.packFormat === "number" && Number.isFinite(metadata.packFormat)
            ? Math.max(0, Math.trunc(metadata.packFormat))
            : null,
        description:
          typeof metadata.description === "string"
            ? metadata.description
            : "Minecraft resource pack",
        hasPackMetadata: metadata.hasPackMetadata === true
      },
      textures: sanitizeResourcePackTextureAssets(pack.textures),
      importedAt:
        typeof pack.importedAt === "string"
          ? pack.importedAt
          : new Date(index).toISOString(),
      warnings: Array.isArray(pack.warnings)
        ? pack.warnings.filter((warning): warning is string => typeof warning === "string")
        : [],
      ...(isResolutionReport(pack.resolutionReport)
        ? { resolutionReport: pack.resolutionReport }
        : {})
    }];
  });
}


function parseAnimationMetadata(raw: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !isRecord(parsed.animation)) return null;
  const frameTimeTicks = finiteInteger(parsed.animation.frametime, 1, 1, 1200);
  const interpolate = parsed.animation.interpolate === true;
  const frames = Array.isArray(parsed.animation.frames)
    ? parsed.animation.frames.slice(0, 4096).flatMap((frame) => {
        if (typeof frame === "number" && Number.isInteger(frame) && frame >= 0) {
          return [{ index: frame }];
        }
        if (!isRecord(frame)) return [];
        const index = finiteInteger(frame.index, -1, 0, 1_000_000);
        if (index < 0) return [];
        const timeTicks = finiteInteger(frame.time, frameTimeTicks, 1, 1200);
        return [{ index, timeTicks }];
      })
    : [];
  return { frameTimeTicks, interpolate, frames };
}

function sanitizeAnimationMetadata(value: unknown) {
  if (!isRecord(value)) return null;
  const frameTimeTicks = finiteInteger(value.frameTimeTicks, 1, 1, 1200);
  const frames = Array.isArray(value.frames)
    ? value.frames.slice(0, 4096).flatMap((frame) => {
        if (!isRecord(frame)) return [];
        const index = finiteInteger(frame.index, -1, 0, 1_000_000);
        if (index < 0) return [];
        return [{
          index,
          ...(frame.timeTicks === undefined
            ? {}
            : { timeTicks: finiteInteger(frame.timeTicks, frameTimeTicks, 1, 1200) })
        }];
      })
    : [];
  return {
    frameTimeTicks,
    interpolate: value.interpolate === true,
    frames
  };
}

function finiteInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, Math.trunc(value)))
    : fallback;
}

function isResolutionReport(value: unknown): value is ResourcePackResolutionReport {
  return isRecord(value) &&
    typeof value.resolvedFaces === "number" &&
    typeof value.fallbackFaces === "number" &&
    Array.isArray(value.missing);
}

function parsePackMetadata(raw: string): ResourcePackMetadata {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ResourcePackValidationError("pack.mcmeta is not valid JSON.");
  }

  if (!isRecord(parsed) || !isRecord(parsed.pack)) {
    throw new ResourcePackValidationError("pack.mcmeta is missing the pack object.");
  }

  const packFormat =
    typeof parsed.pack.pack_format === "number" &&
    Number.isFinite(parsed.pack.pack_format)
      ? Math.max(0, Math.trunc(parsed.pack.pack_format))
      : null;

  return {
    packFormat,
    description: readDescription(parsed.pack.description),
    hasPackMetadata: true
  };
}

function readDescription(value: unknown): string {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.text === "string") return value.text;
  if (Array.isArray(value)) {
    const parts = value.map(readDescription).filter(Boolean);
    if (parts.length > 0) return parts.join("");
  }
  return "Minecraft resource pack";
}

function createMissingMetadata(): ResourcePackMetadata {
  return {
    packFormat: null,
    description: "Minecraft resource pack",
    hasPackMetadata: false
  };
}

function inferResourceRoot(entries: ResourcePackEntry[]): string {
  const textureEntry = entries.find((entry) =>
    entry.path.toLowerCase().includes(BLOCK_TEXTURE_ROOT)
  );
  if (!textureEntry) return "";
  const index = textureEntry.path.toLowerCase().indexOf(BLOCK_TEXTURE_ROOT);
  return textureEntry.path.slice(0, index);
}

export function normalizeResourcePath(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/^\.\//, "");
  const segments = normalized.split("/").filter(Boolean);
  if (
    normalized.startsWith("/") ||
    /^[a-z]:/i.test(normalized) ||
    segments.includes("..")
  ) {
    throw new ResourcePackValidationError(`Unsafe resource pack path: ${path}`);
  }
  return segments.join("/");
}

function isResourcePackTextureAsset(value: unknown): value is ResourcePackTextureAsset {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.path === "string" &&
    typeof value.blockName === "string" &&
    value.mimeType === "image/png" &&
    typeof value.dataUrl === "string" &&
    typeof value.byteLength === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
