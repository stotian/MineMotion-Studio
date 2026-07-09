import type { ImportedChunkData } from "../import/MinecraftChunkTypes";
import type { BlockFaceDirection, VisibleBlockSample } from "./ChunkMeshTypes";

const DIRECTIONS: Array<[BlockFaceDirection, number, number, number]> = [
  ["east", 1, 0, 0],
  ["west", -1, 0, 0],
  ["up", 0, 1, 0],
  ["down", 0, -1, 0],
  ["south", 0, 0, 1],
  ["north", 0, 0, -1]
];

export class BlockFaceCuller {
  static visibleBlocks(chunks: ImportedChunkData[]): VisibleBlockSample[] {
    const occupied = new Set<string>();
    for (const chunk of chunks) {
      for (const block of chunk.blocks) {
        occupied.add(key(block.x, block.y, block.z));
      }
    }

    const visible: VisibleBlockSample[] = [];
    for (const chunk of chunks) {
      for (const block of chunk.blocks) {
        const exposedFaces = DIRECTIONS.filter(
          ([, dx, dy, dz]) => !occupied.has(key(block.x + dx, block.y + dy, block.z + dz))
        ).map(([direction]) => direction);
        if (exposedFaces.length === 0) continue;
        visible.push({
          ...block,
          exposedFaces
        });
      }
    }
    return visible;
  }
}

function key(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}
