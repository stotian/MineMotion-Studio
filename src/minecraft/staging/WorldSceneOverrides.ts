import type { Vector3Tuple } from "../../core/scene/SceneTypes";
import type { BlockId } from "../MinecraftWorldTypes";
import type { ImportedChunkData, ImportedChunkRange } from "../import/MinecraftChunkTypes";

export type WorldSceneMarkerKind = "marker" | "anchor" | "collision";

export interface WorldSceneMarker {
  id: string;
  label: string;
  kind: WorldSceneMarkerKind;
  position: Vector3Tuple;
  size: Vector3Tuple;
  color: string;
  visible: boolean;
}

export interface WorldScenePropBlock {
  id: string;
  blockId: BlockId;
  position: Vector3Tuple;
  visible: boolean;
}

export interface WorldSceneOverrides {
  hiddenChunkIds: string[];
  markers: WorldSceneMarker[];
  propBlocks: WorldScenePropBlock[];
}

export interface WorldSceneSource {
  spawn?: Vector3Tuple;
  importedChunks?: ImportedChunkData[];
}

export interface WorldSourcePolicy {
  access: "read-only";
  filesystemWritesAllowed: false;
}

export const READ_ONLY_WORLD_SOURCE_POLICY: WorldSourcePolicy = Object.freeze({
  access: "read-only",
  filesystemWritesAllowed: false
});

export const EMPTY_WORLD_SCENE_OVERRIDES: WorldSceneOverrides = Object.freeze({
  hiddenChunkIds: Object.freeze([]) as unknown as string[],
  markers: Object.freeze([]) as unknown as WorldSceneMarker[],
  propBlocks: Object.freeze([]) as unknown as WorldScenePropBlock[]
});

export function withWorldSceneOverridesDefaults(
  value: Partial<WorldSceneOverrides> | null | undefined
): WorldSceneOverrides {
  return {
    hiddenChunkIds: Array.isArray(value?.hiddenChunkIds)
      ? [...new Set(value.hiddenChunkIds.filter(isNonEmptyString))].slice(0, 100_000)
      : [],
    markers: Array.isArray(value?.markers)
      ? value.markers.slice(0, 10_000).flatMap(sanitizeMarker)
      : [],
    propBlocks: Array.isArray(value?.propBlocks)
      ? value.propBlocks.slice(0, 100_000).flatMap(sanitizePropBlock)
      : []
  };
}

export function hideChunksInSelection(
  overrides: WorldSceneOverrides,
  chunks: readonly ImportedChunkData[],
  selection: ImportedChunkRange
): WorldSceneOverrides {
  const selected = chunks
    .filter((chunk) => isChunkInsideSelection(chunk, selection))
    .map((chunk) => chunk.id);
  return {
    ...overrides,
    hiddenChunkIds: [...new Set([...overrides.hiddenChunkIds, ...selected])]
  };
}

export function showAllWorldChunks(
  overrides: WorldSceneOverrides
): WorldSceneOverrides {
  return { ...overrides, hiddenChunkIds: [] };
}

export function addWorldSceneMarker(
  overrides: WorldSceneOverrides,
  world: WorldSceneSource,
  selection: ImportedChunkRange,
  kind: WorldSceneMarkerKind
): WorldSceneOverrides {
  const id = nextId(`world_${kind}`, [
    ...overrides.markers.map((entry) => entry.id),
    ...overrides.propBlocks.map((entry) => entry.id)
  ]);
  const position = resolveSelectionCenter(world, selection);
  const marker: WorldSceneMarker = {
    id,
    label: `${capitalize(kind)} ${overrides.markers.length + 1}`,
    kind,
    position,
    size: kind === "collision" ? [16, 4, 16] : [1, 1, 1],
    color: kind === "collision"
      ? "#ff9f43"
      : kind === "anchor"
        ? "#57c7ff"
        : "#f7d56b",
    visible: true
  };
  return { ...overrides, markers: [...overrides.markers, marker] };
}

export function addWorldPropBlock(
  overrides: WorldSceneOverrides,
  world: WorldSceneSource,
  selection: ImportedChunkRange,
  blockId: BlockId = "stone"
): WorldSceneOverrides {
  const id = nextId("world_prop", [
    ...overrides.markers.map((entry) => entry.id),
    ...overrides.propBlocks.map((entry) => entry.id)
  ]);
  const position = resolveSelectionCenter(world, selection);
  return {
    ...overrides,
    propBlocks: [
      ...overrides.propBlocks,
      {
        id,
        blockId,
        position: [position[0], position[1] + 0.5, position[2]],
        visible: true
      }
    ]
  };
}

export function removeWorldSceneItem(
  overrides: WorldSceneOverrides,
  itemId: string
): WorldSceneOverrides {
  return {
    ...overrides,
    markers: overrides.markers.filter((entry) => entry.id !== itemId),
    propBlocks: overrides.propBlocks.filter((entry) => entry.id !== itemId)
  };
}

export function resolveSelectionCenter(
  world: WorldSceneSource,
  selection: ImportedChunkRange
): Vector3Tuple {
  const chunks = (world.importedChunks ?? []).filter((chunk) =>
    isChunkInsideSelection(chunk, selection)
  );
  const topY = chunks.reduce(
    (highest, chunk) => Math.max(highest, highestSolidBlock(chunk)),
    Number.NEGATIVE_INFINITY
  );
  const y = Number.isFinite(topY)
    ? topY + 1
    : world.spawn?.[1] ?? 64;
  return [
    selection.centerChunkX * 16 + 8,
    y,
    selection.centerChunkZ * 16 + 8
  ];
}

function highestSolidBlock(chunk: ImportedChunkData): number {
  return chunk.blocks.reduce(
    (highest, block) => block.id === "air" ? highest : Math.max(highest, block.y),
    chunk.minY - 1
  );
}

function isChunkInsideSelection(
  chunk: ImportedChunkData,
  selection: ImportedChunkRange
): boolean {
  return chunk.dimension === selection.dimension &&
    Math.abs(chunk.chunkX - selection.centerChunkX) <= selection.radiusChunks &&
    Math.abs(chunk.chunkZ - selection.centerChunkZ) <= selection.radiusChunks;
}

function sanitizeMarker(value: unknown): WorldSceneMarker[] {
  if (!isRecord(value) || !isNonEmptyString(value.id)) return [];
  const kind: WorldSceneMarkerKind = value.kind === "anchor" || value.kind === "collision"
    ? value.kind
    : "marker";
  return [{
    id: value.id,
    label: isNonEmptyString(value.label) ? value.label : capitalize(kind),
    kind,
    position: vector(value.position, [0, 64, 0]),
    size: vector(value.size, kind === "collision" ? [16, 4, 16] : [1, 1, 1]),
    color: isColor(value.color) ? value.color : "#f7d56b",
    visible: value.visible !== false
  }];
}

function sanitizePropBlock(value: unknown): WorldScenePropBlock[] {
  if (!isRecord(value) || !isNonEmptyString(value.id)) return [];
  return [{
    id: value.id,
    blockId: isBlockId(value.blockId) ? value.blockId : "unknown",
    position: vector(value.position, [0, 64, 0]),
    visible: value.visible !== false
  }];
}

function vector(value: unknown, fallback: Vector3Tuple): Vector3Tuple {
  if (!Array.isArray(value) || value.length !== 3) return [...fallback];
  return [
    finite(value[0], fallback[0]),
    finite(value[1], fallback[1]),
    finite(value[2], fallback[2])
  ];
}

function nextId(prefix: string, ids: readonly string[]): string {
  const existing = new Set(ids);
  let suffix = 1;
  while (existing.has(`${prefix}_${suffix}`)) suffix += 1;
  return `${prefix}_${suffix}`;
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function isBlockId(value: unknown): value is BlockId {
  return typeof value === "string" && [
    "air", "grass", "grass_block", "dirt", "stone", "cobblestone",
    "deepslate", "oak_log", "oak_leaves", "water", "lava", "glass",
    "glowstone", "torch", "redstone_lamp", "sand", "gravel", "snow",
    "netherrack", "end_stone", "ore", "unknown"
  ].includes(value);
}

function isColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
