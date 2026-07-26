import * as THREE from "three";
import {
  getMaterialForBlock,
  type MinecraftMaterialContext
} from "../renderer/MinecraftMaterialSystem";
import type { TerrainPresetId } from "../project/ProjectFile";
import type { ChunkData } from "./MinecraftWorldTypes";
import { listRenderableBlockIds } from "./BlockPalette";
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

    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const renderableIds = listRenderableBlockIds();

    for (const blockId of renderableIds) {
      const blockSamples = chunk.blocks.filter((block) => block.id === blockId);
      if (blockSamples.length === 0) {
        continue;
      }

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
