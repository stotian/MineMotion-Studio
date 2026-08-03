import { getBlockDefinition } from "../BlockPalette";
import type { ImportedChunkData } from "../import/MinecraftChunkTypes";
import type { BlockId } from "../MinecraftWorldTypes";
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
    const occupied = new Map<string, BlockId>();
    for (const chunk of chunks) {
      for (const block of chunk.blocks) {
        occupied.set(key(block.x, block.y, block.z), block.id);
      }
    }

    const visible: VisibleBlockSample[] = [];
    for (const chunk of chunks) {
      for (const block of chunk.blocks) {
        const exposedFaces = DIRECTIONS.filter(([, dx, dy, dz]) =>
          isFaceVisible(
            block.id,
            occupied.get(key(block.x + dx, block.y + dy, block.z + dz))
          )
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

function isFaceVisible(current: BlockId, neighbor: BlockId | undefined): boolean {
  if (!neighbor) return true;
  if (neighbor === current) return false;
  return getBlockDefinition(current).transparent ||
    getBlockDefinition(neighbor).transparent;
}

function key(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}
