import type { MineMotionProject, Vector3Tuple } from "../project/ProjectFile";
import type { BlockId } from "./MinecraftWorldTypes";
import { createTerrainPresetChunk } from "./TerrainPreset";

export type GroundSampleSource = "imported-world" | "terrain-preset";

export interface GroundSampleLimits {
  maximumRise?: number;
  maximumDrop?: number;
}

export type GroundSample =
  | {
      hit: true;
      height: number;
      blockId: BlockId;
      blockPosition: Vector3Tuple;
      source: GroundSampleSource;
      warning: null;
    }
  | {
      hit: false;
      height: null;
      blockId: null;
      blockPosition: null;
      source: GroundSampleSource | null;
      warning: "GROUND_QUERY_INVALID" | "GROUND_SURFACE_NOT_FOUND";
    };

interface IndexedGroundSurface {
  height: number;
  blockId: BlockId;
  blockPosition: Vector3Tuple;
}

const DEFAULT_MAXIMUM_RISE = 4;
const DEFAULT_MAXIMUM_DROP = 512;
const MAX_VERTICAL_SEARCH = 2_048;
const MAX_COORDINATE = 30_000_000;

export class ProjectGroundSampler {
  private constructor(
    readonly source: GroundSampleSource | null,
    private readonly columns: ReadonlyMap<string, readonly IndexedGroundSurface[]>,
    private readonly presetCenteredColumns: boolean
  ) {}

  static create(project: MineMotionProject): ProjectGroundSampler {
    const importedChunks = project.world?.importedChunks ?? [];
    if (importedChunks.length > 0) {
      const surfaces: Array<{ x: number; z: number; surface: IndexedGroundSurface }> = [];
      for (const chunk of importedChunks) {
        for (const block of chunk.blocks) {
          if (!supportsGround(block.id)) continue;
          surfaces.push({
            x: block.x,
            z: block.z,
            surface: {
              height: block.y + 1,
              blockId: block.id,
              blockPosition: [block.x, block.y, block.z]
            }
          });
        }
      }
      return new ProjectGroundSampler("imported-world", indexSurfaces(surfaces), false);
    }

    const preset = createTerrainPresetChunk(project.projectSettings.terrainPreset);
    if (!preset) return new ProjectGroundSampler(null, new Map(), true);
    return new ProjectGroundSampler(
      "terrain-preset",
      indexSurfaces(preset.blocks.flatMap((block) => supportsGround(block.id) ? [{
        x: block.position[0],
        z: block.position[2],
        surface: {
          height: block.position[1] + 1,
          blockId: block.id,
          blockPosition: [...block.position] as Vector3Tuple
        }
      }] : [])),
      true
    );
  }

  sample(position: Vector3Tuple, limits: GroundSampleLimits = {}): GroundSample {
    if (!finitePosition(position)) {
      return miss(this.source, "GROUND_QUERY_INVALID");
    }
    const maximumRise = boundedDistance(limits.maximumRise, DEFAULT_MAXIMUM_RISE);
    const maximumDrop = boundedDistance(limits.maximumDrop, DEFAULT_MAXIMUM_DROP);
    const columnX = this.presetCenteredColumns ? Math.floor(position[0] + 0.5) : Math.floor(position[0]);
    const columnZ = this.presetCenteredColumns ? Math.floor(position[2] + 0.5) : Math.floor(position[2]);
    const surfaces = this.columns.get(columnKey(columnX, columnZ)) ?? [];
    const maximumHeight = position[1] + maximumRise;
    const minimumHeight = position[1] - maximumDrop;
    const surface = surfaces.find((candidate) =>
      candidate.height <= maximumHeight && candidate.height >= minimumHeight
    );
    if (!surface) return miss(this.source, "GROUND_SURFACE_NOT_FOUND");
    return {
      hit: true,
      height: surface.height,
      blockId: surface.blockId,
      blockPosition: [...surface.blockPosition],
      source: this.source!,
      warning: null
    };
  }
}

export function createProjectGroundSampler(project: MineMotionProject): ProjectGroundSampler {
  return ProjectGroundSampler.create(project);
}

function indexSurfaces(
  surfaces: readonly { x: number; z: number; surface: IndexedGroundSurface }[]
): ReadonlyMap<string, readonly IndexedGroundSurface[]> {
  const columns = new Map<string, IndexedGroundSurface[]>();
  for (const entry of surfaces) {
    const key = columnKey(entry.x, entry.z);
    const column = columns.get(key) ?? [];
    column.push(entry.surface);
    columns.set(key, column);
  }
  for (const column of columns.values()) {
    column.sort((left, right) =>
      right.height - left.height ||
      left.blockId.localeCompare(right.blockId) ||
      left.blockPosition[1] - right.blockPosition[1]
    );
    Object.freeze(column);
  }
  return columns;
}

function supportsGround(blockId: BlockId): boolean {
  return blockId !== "air" && blockId !== "water";
}

function finitePosition(position: unknown): position is Vector3Tuple {
  return Array.isArray(position) &&
    position.length === 3 &&
    position.every((value) =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      Math.abs(value) <= MAX_COORDINATE
    );
}

function boundedDistance(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(MAX_VERTICAL_SEARCH, Math.max(0, value))
    : fallback;
}

function columnKey(x: number, z: number): string {
  return `${x}:${z}`;
}

function miss(
  source: GroundSampleSource | null,
  warning: "GROUND_QUERY_INVALID" | "GROUND_SURFACE_NOT_FOUND"
): GroundSample {
  return { hit: false, height: null, blockId: null, blockPosition: null, source, warning };
}
