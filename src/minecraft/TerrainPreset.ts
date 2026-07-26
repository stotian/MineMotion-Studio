import type { TerrainPresetId } from "../project/ProjectFile";
import type { BlockId, ChunkData } from "./MinecraftWorldTypes";

export function createTerrainPresetChunk(preset: TerrainPresetId): ChunkData | null {
  if (preset === "none") return null;
  if (preset === "flat") return createFlatTerrainChunk();
  if (preset === "nether") return createNetherTerrainChunk();
  return createDemoTerrainChunk();
}

export function createDemoTerrainChunk(): ChunkData {
  const blocks: ChunkData["blocks"] = [];
  const width = 18;
  const depth = 18;

  for (let x = 0; x < width; x += 1) {
    for (let z = 0; z < depth; z += 1) {
      const wave = Math.sin(x * 0.55) + Math.cos(z * 0.35);
      const height = Math.max(1, Math.round(2 + wave));

      for (let y = 0; y < height; y += 1) {
        const id: BlockId =
          y === height - 1 ? "grass" : y > height - 3 ? "dirt" : "stone";
        blocks.push({
          id,
          position: [x - width / 2, y, z - depth / 2]
        });
      }
    }
  }

  addTree(blocks, [-4, 4, -3]);
  addTree(blocks, [5, 4, 4]);

  for (let x = -1; x <= 3; x += 1) {
    for (let z = -7; z <= -5; z += 1) {
      blocks.push({ id: "water", position: [x, 1, z] });
    }
  }

  blocks.push({ id: "glass", position: [3, 4, 1] });

  return {
    id: "demo_chunk",
    origin: [0, 0, 0],
    size: [width, 8, depth],
    blocks
  };
}

export function createFlatTerrainChunk(): ChunkData {
  const blocks: ChunkData["blocks"] = [];
  const width = 18;
  const depth = 18;

  for (let x = 0; x < width; x += 1) {
    for (let z = 0; z < depth; z += 1) {
      blocks.push({ id: "dirt", position: [x - width / 2, 0, z - depth / 2] });
      blocks.push({ id: "grass", position: [x - width / 2, 1, z - depth / 2] });
    }
  }

  return {
    id: "flat_chunk",
    origin: [0, 0, 0],
    size: [width, 2, depth],
    blocks
  };
}

export function createNetherTerrainChunk(): ChunkData {
  const blocks: ChunkData["blocks"] = [];
  const width = 16;
  const depth = 16;

  for (let x = 0; x < width; x += 1) {
    for (let z = 0; z < depth; z += 1) {
      const height = 1 + ((x + z) % 3 === 0 ? 1 : 0);
      for (let y = 0; y <= height; y += 1) {
        blocks.push({
          id: y === height ? "stone" : "dirt",
          position: [x - width / 2, y, z - depth / 2]
        });
      }
    }
  }

  for (let x = -3; x <= 3; x += 1) {
    blocks.push({ id: "glass", position: [x, 2, -4] });
  }

  return {
    id: "nether_mood_chunk",
    origin: [0, 0, 0],
    size: [width, 4, depth],
    blocks
  };
}

function addTree(
  blocks: ChunkData["blocks"],
  [x, y, z]: [number, number, number]
): void {
  for (let trunkY = y - 1; trunkY <= y + 3; trunkY += 1) {
    blocks.push({ id: "oak_log", position: [x, trunkY, z] });
  }

  for (let leafX = x - 2; leafX <= x + 2; leafX += 1) {
    for (let leafY = y + 2; leafY <= y + 5; leafY += 1) {
      for (let leafZ = z - 2; leafZ <= z + 2; leafZ += 1) {
        const edgeCount =
          Number(Math.abs(leafX - x) === 2) +
          Number(Math.abs(leafZ - z) === 2) +
          Number(leafY === y + 5);
        if (edgeCount < 2) {
          blocks.push({ id: "oak_leaves", position: [leafX, leafY, leafZ] });
        }
      }
    }
  }
}
