import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  it("captures per-instance block positions only when requested", () => {
    const off = ChunkMeshBuilder.buildImportedChunks([chunk(0, 0)], {
      showChunkBorders: false,
      showWorldOrigin: false
    });
    const on = ChunkMeshBuilder.buildImportedChunks([chunk(0, 0)], {
      showChunkBorders: false,
      showWorldOrigin: false,
      captureBlockPositions: true
    });
    const meshOff = off.chunks[0].object.children.find((child) => child.userData.blockFace === "up") as THREE.InstancedMesh;
    const meshOn = on.chunks[0].object.children.find((child) => child.userData.blockFace === "up") as THREE.InstancedMesh;
    expect(meshOff.userData.blockPositions).toBeUndefined();
    expect(meshOn.userData.blockPositions).toEqual([[0, 0, 0]]);
  });

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
    const firstMesh = result.chunks[0].object.children.find((child) => child.userData.blockFace === "up")!;
    const secondMesh = result.chunks[1].object.children.find((child) => child.userData.blockFace === "up")!;
    expect(firstMesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(secondMesh).toBeInstanceOf(THREE.InstancedMesh);
    expect((firstMesh as THREE.InstancedMesh).geometry).toBe(
      (secondMesh as THREE.InstancedMesh).geometry
    );
    const sharedGeometryDispose = vi.spyOn(
      (firstMesh as THREE.InstancedMesh).geometry,
      "dispose"
    );
    expect(result.helpers?.userData.objectType).toBe("worldHelpers");

    const stats = disposeThreeObjectTree(result.object);
    expect(sharedGeometryDispose).toHaveBeenCalledOnce();
    expect(stats.geometries).toBeGreaterThanOrEqual(1);
    expect(result.object.children).toEqual([]);
  });
});
