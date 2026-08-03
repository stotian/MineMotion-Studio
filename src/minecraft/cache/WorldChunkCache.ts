import type { BlockId } from "../MinecraftWorldTypes";
import type {
  ImportedChunkData,
  MinecraftBlockSample,
  MinecraftDimensionId
} from "../import/MinecraftChunkTypes";

export const WORLD_CHUNK_CACHE_FORMAT = "minemotion-world-chunks" as const;
export const WORLD_CHUNK_CACHE_FORMAT_VERSION = 1;
export const WORLD_CHUNK_CACHE_CODEC = "palette-int32-v1" as const;

const WARNING_BYTES = 64 * 1024 * 1024;
const CRITICAL_BYTES = 256 * 1024 * 1024;
const MAX_CACHE_CHUNKS = 100_000;
const MAX_CACHE_BLOCKS = 50_000_000;
const MAX_CACHE_STATES = 65_536;

export interface PortableBlockState {
  id: BlockId;
  minecraftName: string;
  stateKey?: string;
  properties?: Record<string, string>;
}

export interface PortableWorldChunk {
  id: string;
  dimension: MinecraftDimensionId;
  region: [number, number];
  chunk: [number, number];
  y: [number, number];
  sectionsRead: number;
  blocks: number[];
  unknownBlocks: Record<string, number>;
  warnings: string[];
  dataVersion?: number;
  status?: string;
  biomePalette?: string[];
  legacyBiomeIds?: number[];
  heightmaps?: Record<string, number[]>;
  sourceTimestamp?: number;
  contentFingerprint?: string;
}

export interface PortableWorldChunkCache {
  format: typeof WORLD_CHUNK_CACHE_FORMAT;
  formatVersion: typeof WORLD_CHUNK_CACHE_FORMAT_VERSION;
  codec: typeof WORLD_CHUNK_CACHE_CODEC;
  generatedAt: string;
  fingerprint: string;
  states: PortableBlockState[];
  chunks: PortableWorldChunk[];
}

export interface WorldChunkCacheSizeAssessment {
  level: "ok" | "warning" | "critical";
  estimatedBytes: number;
  message: string;
}

export function createPortableWorldChunkCache(
  chunks: readonly ImportedChunkData[],
  generatedAt = new Date().toISOString()
): PortableWorldChunkCache {
  const states: PortableBlockState[] = [];
  const stateIndices = new Map<string, number>();
  const portableChunks = chunks.slice(0, MAX_CACHE_CHUNKS).map((chunk) => ({
    id: chunk.id,
    dimension: chunk.dimension,
    region: [chunk.regionX, chunk.regionZ] as [number, number],
    chunk: [chunk.chunkX, chunk.chunkZ] as [number, number],
    y: [chunk.minY, chunk.maxY] as [number, number],
    sectionsRead: chunk.sectionsRead,
    blocks: encodeBlocks(chunk.blocks, states, stateIndices),
    unknownBlocks: { ...chunk.unknownBlocks },
    warnings: chunk.warnings.slice(0, 100),
    ...(chunk.dataVersion === undefined ? {} : { dataVersion: chunk.dataVersion }),
    ...(chunk.status === undefined ? {} : { status: chunk.status }),
    ...(chunk.biomePalette === undefined ? {} : { biomePalette: [...chunk.biomePalette] }),
    ...(chunk.legacyBiomeIds === undefined ? {} : { legacyBiomeIds: [...chunk.legacyBiomeIds] }),
    ...(chunk.heightmaps === undefined ? {} : { heightmaps: cloneHeightmaps(chunk.heightmaps) }),
    ...(chunk.sourceTimestamp === undefined ? {} : { sourceTimestamp: chunk.sourceTimestamp }),
    ...(chunk.contentFingerprint === undefined ? {} : { contentFingerprint: chunk.contentFingerprint })
  }));
  const fingerprint = fingerprintPortableData(states, portableChunks);
  return {
    format: WORLD_CHUNK_CACHE_FORMAT,
    formatVersion: WORLD_CHUNK_CACHE_FORMAT_VERSION,
    codec: WORLD_CHUNK_CACHE_CODEC,
    generatedAt,
    fingerprint,
    states,
    chunks: portableChunks
  };
}

export function serializePortableWorldChunkCache(
  cache: PortableWorldChunkCache
): string {
  return JSON.stringify(cache);
}

export function parsePortableWorldChunkCache(raw: string): PortableWorldChunkCache {
  return sanitizePortableWorldChunkCache(JSON.parse(raw));
}

export function decodePortableWorldChunkCache(
  value: unknown
): ImportedChunkData[] {
  const cache = sanitizePortableWorldChunkCache(value);
  const decoded = cache.chunks.map((chunk) => ({
    id: chunk.id,
    dimension: chunk.dimension,
    regionX: chunk.region[0],
    regionZ: chunk.region[1],
    chunkX: chunk.chunk[0],
    chunkZ: chunk.chunk[1],
    minY: chunk.y[0],
    maxY: chunk.y[1],
    sectionsRead: chunk.sectionsRead,
    blocks: decodeBlocks(chunk.blocks, cache.states),
    unknownBlocks: { ...chunk.unknownBlocks },
    warnings: [...chunk.warnings],
    ...(chunk.dataVersion === undefined ? {} : { dataVersion: chunk.dataVersion }),
    ...(chunk.status === undefined ? {} : { status: chunk.status }),
    ...(chunk.biomePalette === undefined ? {} : { biomePalette: [...chunk.biomePalette] }),
    ...(chunk.legacyBiomeIds === undefined ? {} : { legacyBiomeIds: [...chunk.legacyBiomeIds] }),
    ...(chunk.heightmaps === undefined ? {} : { heightmaps: cloneHeightmaps(chunk.heightmaps) }),
    ...(chunk.sourceTimestamp === undefined ? {} : { sourceTimestamp: chunk.sourceTimestamp }),
    ...(chunk.contentFingerprint === undefined ? {} : { contentFingerprint: chunk.contentFingerprint })
  }));
  const regenerated = createPortableWorldChunkCache(decoded, cache.generatedAt);
  if (regenerated.fingerprint !== cache.fingerprint) {
    throw new Error("Portable world cache fingerprint mismatch.");
  }
  return decoded;
}

export function estimatePortableWorldChunkCacheBytes(
  chunks: readonly ImportedChunkData[]
): number {
  const blockCount = chunks.reduce((sum, chunk) => sum + chunk.blocks.length, 0);
  const stateCount = new Set(
    chunks.flatMap((chunk) => chunk.blocks.map(blockStateKey))
  ).size;
  return chunks.length * 256 + blockCount * 18 + stateCount * 128;
}

export function assessWorldChunkCacheSize(
  estimatedBytes: number
): WorldChunkCacheSizeAssessment {
  const bytes = Math.max(0, Number.isFinite(estimatedBytes) ? estimatedBytes : 0);
  if (bytes >= CRITICAL_BYTES) {
    return {
      level: "critical",
      estimatedBytes: bytes,
      message: "Embedded world cache is very large; reduce the selected chunk radius before packaging."
    };
  }
  if (bytes >= WARNING_BYTES) {
    return {
      level: "warning",
      estimatedBytes: bytes,
      message: "Embedded world cache is large and may slow project save/open operations."
    };
  }
  return {
    level: "ok",
    estimatedBytes: bytes,
    message: "Embedded world cache size is within the reviewed budget."
  };
}

function encodeBlocks(
  blocks: readonly MinecraftBlockSample[],
  states: PortableBlockState[],
  stateIndices: Map<string, number>
): number[] {
  if (blocks.length > MAX_CACHE_BLOCKS) {
    throw new Error(`World cache block limit exceeded: ${blocks.length}.`);
  }
  const encoded = new Array<number>(blocks.length * 4);
  blocks.forEach((block, index) => {
    const key = blockStateKey(block);
    let stateIndex = stateIndices.get(key);
    if (stateIndex === undefined) {
      if (states.length >= MAX_CACHE_STATES) {
        throw new Error(`World cache state limit exceeded: ${MAX_CACHE_STATES}.`);
      }
      stateIndex = states.length;
      states.push({
        id: block.id,
        minecraftName: block.minecraftName,
        ...(block.stateKey === undefined ? {} : { stateKey: block.stateKey }),
        ...(block.properties === undefined ? {} : { properties: { ...block.properties } })
      });
      stateIndices.set(key, stateIndex);
    }
    const offset = index * 4;
    encoded[offset] = stateIndex;
    encoded[offset + 1] = Math.trunc(block.x);
    encoded[offset + 2] = Math.trunc(block.y);
    encoded[offset + 3] = Math.trunc(block.z);
  });
  return encoded;
}

function decodeBlocks(
  encoded: readonly number[],
  states: readonly PortableBlockState[]
): MinecraftBlockSample[] {
  if (encoded.length % 4 !== 0) {
    throw new Error("Portable world cache block payload is truncated.");
  }
  if (encoded.length / 4 > MAX_CACHE_BLOCKS) {
    throw new Error("Portable world cache block limit exceeded.");
  }
  const blocks: MinecraftBlockSample[] = [];
  for (let offset = 0; offset < encoded.length; offset += 4) {
    const stateIndex = finiteInteger(encoded[offset], -1);
    const state = states[stateIndex];
    if (!state) throw new Error(`Portable world cache state ${stateIndex} is missing.`);
    blocks.push({
      id: state.id,
      minecraftName: state.minecraftName,
      ...(state.stateKey === undefined ? {} : { stateKey: state.stateKey }),
      ...(state.properties === undefined ? {} : { properties: { ...state.properties } }),
      x: finiteInteger(encoded[offset + 1], 0),
      y: finiteInteger(encoded[offset + 2], 0),
      z: finiteInteger(encoded[offset + 3], 0)
    });
  }
  return blocks;
}

function sanitizePortableWorldChunkCache(value: unknown): PortableWorldChunkCache {
  if (!isRecord(value) ||
    value.format !== WORLD_CHUNK_CACHE_FORMAT ||
    value.formatVersion !== WORLD_CHUNK_CACHE_FORMAT_VERSION ||
    value.codec !== WORLD_CHUNK_CACHE_CODEC ||
    typeof value.generatedAt !== "string" ||
    typeof value.fingerprint !== "string" ||
    !Array.isArray(value.states) ||
    !Array.isArray(value.chunks)
  ) {
    throw new Error("Unsupported or malformed portable world cache.");
  }
  if (value.states.length > MAX_CACHE_STATES || value.chunks.length > MAX_CACHE_CHUNKS) {
    throw new Error("Portable world cache exceeds reviewed collection limits.");
  }
  const states = value.states.map(sanitizeState);
  const chunks = value.chunks.map(sanitizeChunk);
  return {
    format: WORLD_CHUNK_CACHE_FORMAT,
    formatVersion: WORLD_CHUNK_CACHE_FORMAT_VERSION,
    codec: WORLD_CHUNK_CACHE_CODEC,
    generatedAt: value.generatedAt,
    fingerprint: value.fingerprint,
    states,
    chunks
  };
}

function sanitizeState(value: unknown): PortableBlockState {
  if (!isRecord(value) || !isBlockId(value.id) || typeof value.minecraftName !== "string") {
    throw new Error("Portable world cache contains an invalid block state.");
  }
  return {
    id: value.id,
    minecraftName: value.minecraftName,
    ...(typeof value.stateKey === "string" ? { stateKey: value.stateKey } : {}),
    ...(isStringRecord(value.properties) ? { properties: { ...value.properties } } : {})
  };
}

function sanitizeChunk(value: unknown): PortableWorldChunk {
  if (!isRecord(value) ||
    typeof value.id !== "string" ||
    !isDimension(value.dimension) ||
    !isPair(value.region) ||
    !isPair(value.chunk) ||
    !isPair(value.y) ||
    !Array.isArray(value.blocks)
  ) {
    throw new Error("Portable world cache contains an invalid chunk.");
  }
  return {
    id: value.id,
    dimension: value.dimension,
    region: [finiteInteger(value.region[0], 0), finiteInteger(value.region[1], 0)],
    chunk: [finiteInteger(value.chunk[0], 0), finiteInteger(value.chunk[1], 0)],
    y: [finiteInteger(value.y[0], -64), finiteInteger(value.y[1], 319)],
    sectionsRead: Math.max(0, finiteInteger(value.sectionsRead, 0)),
    blocks: value.blocks.map((entry) => finiteInteger(entry, 0)),
    unknownBlocks: isNumberRecord(value.unknownBlocks) ? { ...value.unknownBlocks } : {},
    warnings: Array.isArray(value.warnings)
      ? value.warnings.filter((entry): entry is string => typeof entry === "string").slice(0, 100)
      : [],
    ...(Number.isFinite(value.dataVersion) ? { dataVersion: finiteInteger(value.dataVersion, 0) } : {}),
    ...(typeof value.status === "string" ? { status: value.status } : {}),
    ...(isStringArray(value.biomePalette) ? { biomePalette: [...value.biomePalette] } : {}),
    ...(isNumberArray(value.legacyBiomeIds) ? { legacyBiomeIds: [...value.legacyBiomeIds] } : {}),
    ...(isHeightmaps(value.heightmaps) ? { heightmaps: cloneHeightmaps(value.heightmaps) } : {}),
    ...(Number.isFinite(value.sourceTimestamp) ? { sourceTimestamp: finiteInteger(value.sourceTimestamp, 0) } : {}),
    ...(typeof value.contentFingerprint === "string" ? { contentFingerprint: value.contentFingerprint } : {})
  };
}

function fingerprintPortableData(
  states: readonly PortableBlockState[],
  chunks: readonly PortableWorldChunk[]
): string {
  let hash = 0x811c9dc5;
  const update = (value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
  };
  states.forEach((state) => update(blockStateKey(state)));
  chunks.forEach((chunk) => {
    update(`${chunk.id}:${chunk.blocks.length}:${chunk.contentFingerprint ?? ""}`);
    chunk.blocks.forEach((value) => update(`${value},`));
  });
  return `world-cache-v1:${(hash >>> 0).toString(16).padStart(8, "0")}:${chunks.length}`;
}

function blockStateKey(block: Pick<MinecraftBlockSample, "id" | "minecraftName" | "stateKey" | "properties">): string {
  const properties = Object.entries(block.properties ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
  return `${block.id}|${block.minecraftName}|${block.stateKey ?? ""}|${properties}`;
}

function cloneHeightmaps(value: Record<string, number[]>): Record<string, number[]> {
  return Object.fromEntries(Object.entries(value).map(([key, heights]) => [key, [...heights]]));
}

function finiteInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function isDimension(value: unknown): value is MinecraftDimensionId {
  return value === "overworld" || value === "nether" || value === "end" ||
    (typeof value === "string" && value.startsWith("custom:"));
}

function isPair(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(Number.isFinite);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every(Number.isFinite);
}

function isHeightmaps(value: unknown): value is Record<string, number[]> {
  return isRecord(value) && Object.values(value).every(isNumberArray);
}

function isBlockId(value: unknown): value is BlockId {
  return typeof value === "string" && [
    "air", "grass", "grass_block", "dirt", "stone", "cobblestone",
    "deepslate", "oak_log", "oak_leaves", "water", "lava", "glass",
    "glowstone", "torch", "redstone_lamp", "sand", "gravel", "snow",
    "netherrack", "end_stone", "ore", "unknown"
  ].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
