import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import { clearMinecraftMaterialCache } from "../../renderer/MinecraftMaterialSystem";
import { disposeThreeObjectTree } from "../../renderer/ThreeResourceDisposal";
import type { ImportedChunkData } from "../import/MinecraftChunkTypes";
import { ChunkMeshBuilder } from "./ChunkMeshBuilder";

function chunk(chunkX: number, blockX: number): ImportedChunkData {
  return {
    id: `overworld:${chunkX},0`,
    dimension: "overworld",
    regionX: 0,
    regionZ: 0,
    chunkX,
    chunkZ: 0,
    minY: -64,
    maxY: 320,
    sectionsRead: 1,
    blocks: [{
      id: "stone",
      minecraftName: "minecraft:stone",
      x: blockX,
      y: 0,
      z: 0
    }],
    unknownBlocks: {},
    warnings: []
  };
}

afterEach(() => {
  clearMinecraftMaterialCache();
});

describe("imported chunk render ownership", () => {
  it("keeps instancing inside independently cullable chunk groups", () => {
    const result = ChunkMeshBuilder.buildImportedChunks(
      [chunk(-1, -1), chunk(0, 0)],
      {
        showChunkBorders: true,
        showWorldOrigin: true
      }
    );

    expect(result.chunkCount).toBe(2);
    expect(result.visibleBlocks).toBe(2);
    expect(result.chunks).toHaveLength(2);
    expect(result.chunks.map((item) => [
      item.chunkX,
      item.chunkZ,
      item.visibleBlocks
    ])).toEqual([
      [-1, 0, 1],
      [0, 0, 1]
    ]);
    const firstMesh = result.chunks[0].object.children[0];
    const secondMesh = result.chunks[1].object.children[0];
    expect(firstMesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(secondMesh).toBeInstanceOf(THREE.InstancedMesh);
    expect((firstMesh as THREE.InstancedMesh).geometry).not.toBe(
      (secondMesh as THREE.InstancedMesh).geometry
    );
    expect(result.helpers?.userData.objectType).toBe("worldHelpers");

    const stats = disposeThreeObjectTree(result.object);
    expect(stats.geometries).toBeGreaterThanOrEqual(2);
    expect(result.object.children).toEqual([]);
  });
});
