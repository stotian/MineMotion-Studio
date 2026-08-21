import type { MineMotionProject } from "../../project/ProjectFile";

// Pure, Minecraft-native build stats for the imported world: how many blocks,
// which block types dominate, and the footprint dimensions. Useful summary for
// creators and for sizing showcase shots.

export interface BuildBlockCount {
  id: string;
  count: number;
}

export interface BuildStatistics {
  totalBlocks: number;
  uniqueBlockTypes: number;
  /** Block counts sorted by descending count then id. */
  countsByType: BuildBlockCount[];
  /** Footprint dimensions in blocks (width x height x depth). */
  dimensions: { width: number; height: number; depth: number };
}

const EMPTY: BuildStatistics = {
  totalBlocks: 0,
  uniqueBlockTypes: 0,
  countsByType: [],
  dimensions: { width: 0, height: 0, depth: 0 }
};

export function computeBuildStatistics(project: MineMotionProject): BuildStatistics {
  const counts = new Map<string, number>();
  let total = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const chunk of project.world?.importedChunks ?? []) {
    for (const block of chunk.blocks) {
      total += 1;
      counts.set(block.id, (counts.get(block.id) ?? 0) + 1);
      if (block.x < minX) minX = block.x;
      if (block.y < minY) minY = block.y;
      if (block.z < minZ) minZ = block.z;
      if (block.x > maxX) maxX = block.x;
      if (block.y > maxY) maxY = block.y;
      if (block.z > maxZ) maxZ = block.z;
    }
  }

  if (total === 0) return EMPTY;

  const countsByType = [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((left, right) => right.count - left.count || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));

  return {
    totalBlocks: total,
    uniqueBlockTypes: counts.size,
    countsByType,
    dimensions: {
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      depth: maxZ - minZ + 1
    }
  };
}
