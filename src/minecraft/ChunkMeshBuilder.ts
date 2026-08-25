import * as THREE from "three";
import {
  getMaterialForBlock,
  type MinecraftMaterialContext
} from "../renderer/MinecraftMaterialSystem";
import type { TerrainPresetId } from "../project/ProjectFile";
import type { ChunkData } from "./MinecraftWorldTypes";
import { getBlockDefinition } from "./BlockPalette";
import {
  createDemoTerrainChunk,
  createFlatTerrainChunk,
  createNetherTerrainChunk,
  createTerrainPresetChunk
} from "./TerrainPreset";

export class ChunkMeshBuilder {
  static createChunkForPreset(preset: TerrainPresetId): ChunkData | null {
    return createTerrainPresetChunk(preset);
  }

  static createDemoChunk(): ChunkData {
    return createDemoTerrainChunk();
  }

  static createFlatChunk(): ChunkData {
    return createFlatTerrainChunk();
  }

  static createNetherChunk(): ChunkData {
    return createNetherTerrainChunk();
  }

  static buildInstancedChunk(
    chunk: ChunkData,
    materialContext?: MinecraftMaterialContext
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = chunk.id;
    group.userData.objectId = "world";
    group.userData.objectType = "world";

    let cubeGeometry: THREE.BoxGeometry | null = null;

    /*
     * Group the chunk's blocks in a single pass, then build one mesh per group.
     *
     * This used to scan the whole renderable list and filter the chunk for each
     * id — O(catalogue x blocks). That was tolerable at 22 ids; against the
     * 860-block catalogue it became roughly 3.5 million comparisons per chunk,
     * for a result that only ever needs the handful of ids actually present.
     */
    const samplesById = new Map<string, typeof chunk.blocks>();
    for (const block of chunk.blocks) {
      const existing = samplesById.get(block.id);
      if (existing) existing.push(block);
      else samplesById.set(block.id, [block]);
    }

    // Sorted so mesh order does not depend on the order blocks were sampled.
    for (const blockId of [...samplesById.keys()].sort()) {
      const blockSamples = samplesById.get(blockId) ?? [];
      if (blockSamples.length === 0 || getBlockDefinition(blockId).opacity <= 0) {
        continue;
      }
      cubeGeometry ??= new THREE.BoxGeometry(1, 1, 1);

      const mesh = new THREE.InstancedMesh(
        cubeGeometry,
        getMaterialForBlock(blockId, materialContext),
        blockSamples.length
      );
      mesh.name = `blocks_${blockId}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.objectId = "world";
      mesh.userData.objectType = "world";

      const matrix = new THREE.Matrix4();
      blockSamples.forEach((block, index) => {
        matrix.makeTranslation(
          block.position[0],
          block.position[1] + 0.5,
          block.position[2]
        );
        mesh.setMatrixAt(index, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }

    return group;
  }

}
