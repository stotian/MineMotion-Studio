import * as THREE from "three";
import { BlockMaterialResolver } from "./BlockMaterialResolver";
import { GreedyMesher } from "./GreedyMesher";
import type { ChunkMeshBuildOptions, ChunkMeshBuildResult } from "./ChunkMeshTypes";
import type { ImportedChunkData } from "../import/MinecraftChunkTypes";
import { listRenderableBlockIds } from "../BlockPalette";

export class ChunkMeshBuilder {
  static buildImportedChunks(
    chunks: ImportedChunkData[],
    options: ChunkMeshBuildOptions
  ): ChunkMeshBuildResult {
    const group = new THREE.Group();
    group.name = "Imported Minecraft Chunks";
    group.userData.objectId = "world";
    group.userData.objectType = "world";
    const visibleBlocks = GreedyMesher.compactVisibleBlocks(chunks);
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    for (const blockId of listRenderableBlockIds()) {
      const samples = visibleBlocks.filter((block) => block.id === blockId);
      if (samples.length === 0) continue;
      const mesh = new THREE.InstancedMesh(
        cubeGeometry,
        BlockMaterialResolver.resolve(blockId),
        samples.length
      );
      mesh.name = `imported_${blockId}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.objectId = "world";
      mesh.userData.objectType = "world";

      const matrix = new THREE.Matrix4();
      samples.forEach((block, index) => {
        matrix.makeTranslation(block.x + 0.5, block.y + 0.5, block.z + 0.5);
        mesh.setMatrixAt(index, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }

    if (options.showChunkBorders) {
      for (const chunk of chunks) {
        group.add(createChunkBorder(chunk));
      }
    }

    if (options.showWorldOrigin) {
      group.add(createWorldOriginMarker());
    }

    return {
      object: group,
      visibleBlocks: visibleBlocks.length,
      chunkCount: chunks.length
    };
  }
}

function createChunkBorder(chunk: ImportedChunkData): THREE.LineSegments {
  const minY = chunk.minY;
  const maxY = Math.max(chunk.maxY + 1, minY + 1);
  const box = new THREE.BoxGeometry(16, maxY - minY, 16);
  const edges = new THREE.EdgesGeometry(box);
  const lines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color: "#6d8cff",
      transparent: true,
      opacity: 0.55
    })
  );
  lines.position.set(
    chunk.chunkX * 16 + 8,
    minY + (maxY - minY) / 2,
    chunk.chunkZ * 16 + 8
  );
  lines.userData.objectId = "world";
  lines.userData.objectType = "world";
  return lines;
}

function createWorldOriginMarker(): THREE.Group {
  const group = new THREE.Group();
  group.add(axis([0, 0, 0], [8, 0, 0], "#ff6b6b"));
  group.add(axis([0, 0, 0], [0, 8, 0], "#6bd685"));
  group.add(axis([0, 0, 0], [0, 0, 8], "#6bb7ff"));
  group.userData.objectId = "world";
  group.userData.objectType = "world";
  return group;
}

function axis(
  start: [number, number, number],
  end: [number, number, number],
  color: string
): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...start),
      new THREE.Vector3(...end)
    ]),
    new THREE.LineBasicMaterial({ color })
  );
}
