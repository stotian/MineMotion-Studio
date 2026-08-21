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
    const faceGeometries = createFaceGeometries();
    const renderedChunks = chunks.map((chunk) => {
      const chunkObject = new THREE.Group();
      chunkObject.name = `Chunk ${chunk.chunkX},${chunk.chunkZ}`;
      chunkObject.userData.objectId = "world";
      chunkObject.userData.objectType = "worldChunk";
      chunkObject.userData.chunkX = chunk.chunkX;
      chunkObject.userData.chunkZ = chunk.chunkZ;
      const chunkBlocks = visibleBlocks.filter((block) =>
        Math.floor(block.x / 16) === chunk.chunkX &&
        Math.floor(block.z / 16) === chunk.chunkZ
      );
      for (const blockId of listRenderableBlockIds()) {
        const blockSamples = chunkBlocks.filter((block) => block.id === blockId);
        if (blockSamples.length === 0) continue;
        for (const direction of FACE_DIRECTIONS) {
          const samples = blockSamples.filter((block) =>
            block.exposedFaces.includes(direction)
          );
          if (samples.length === 0) continue;
          const mesh = new THREE.InstancedMesh(
            faceGeometries[direction],
            BlockMaterialResolver.resolve(
              blockId,
              options.materialContext,
              textureFaceForDirection(direction)
            ),
            samples.length
          );
          mesh.name = `imported_${blockId}_${direction}`;
          mesh.castShadow = blockId !== "water" && blockId !== "glass";
          mesh.receiveShadow = true;
          mesh.userData.objectId = "world";
          mesh.userData.objectType = "world";
          mesh.userData.blockFace = direction;

          const matrix = new THREE.Matrix4();
          samples.forEach((block, index) => {
            matrix.makeTranslation(
              block.x + 0.5,
              block.y + 0.5,
              block.z + 0.5
            );
            mesh.setMatrixAt(index, matrix);
          });
          mesh.instanceMatrix.needsUpdate = true;
          if (options.captureBlockPositions) {
            mesh.userData.blockPositions = samples.map((block) => [block.x, block.y, block.z]);
          }
          chunkObject.add(mesh);
        }
      }
      group.add(chunkObject);
      return {
        object: chunkObject,
        chunkX: chunk.chunkX,
        chunkZ: chunk.chunkZ,
        visibleBlocks: chunkBlocks.length
      };
    });

    const helpers = new THREE.Group();
    helpers.name = "Imported World Helpers";
    helpers.userData.objectId = "world";
    helpers.userData.objectType = "worldHelpers";
    if (options.showChunkBorders) {
      for (const chunk of chunks) {
        helpers.add(createChunkBorder(chunk));
      }
    }
    if (options.showWorldOrigin) {
      helpers.add(createWorldOriginMarker());
    }
    if (helpers.children.length > 0) group.add(helpers);

    return {
      object: group,
      visibleBlocks: visibleBlocks.length,
      chunkCount: chunks.length,
      chunks: renderedChunks,
      helpers: helpers.children.length > 0 ? helpers : null
    };
  }
}


const FACE_DIRECTIONS = [
  "east",
  "west",
  "up",
  "down",
  "south",
  "north"
] as const;

type FaceDirection = (typeof FACE_DIRECTIONS)[number];

function createFaceGeometries(): Record<FaceDirection, THREE.PlaneGeometry> {
  const east = new THREE.PlaneGeometry(1, 1);
  east.rotateY(Math.PI / 2);
  east.translate(0.5, 0, 0);
  const west = new THREE.PlaneGeometry(1, 1);
  west.rotateY(-Math.PI / 2);
  west.translate(-0.5, 0, 0);
  const up = new THREE.PlaneGeometry(1, 1);
  up.rotateX(-Math.PI / 2);
  up.translate(0, 0.5, 0);
  const down = new THREE.PlaneGeometry(1, 1);
  down.rotateX(Math.PI / 2);
  down.translate(0, -0.5, 0);
  const south = new THREE.PlaneGeometry(1, 1);
  south.translate(0, 0, 0.5);
  const north = new THREE.PlaneGeometry(1, 1);
  north.rotateY(Math.PI);
  north.translate(0, 0, -0.5);
  return { east, west, up, down, south, north };
}

function textureFaceForDirection(
  direction: FaceDirection
): "side" | "top" | "bottom" | "front" | "back" {
  if (direction === "up") return "top";
  if (direction === "down") return "bottom";
  if (direction === "south") return "front";
  if (direction === "north") return "back";
  return "side";
}

function createChunkBorder(chunk: ImportedChunkData): THREE.LineSegments {
  const minY = chunk.minY;
  const maxY = Math.max(chunk.maxY + 1, minY + 1);
  const box = new THREE.BoxGeometry(16, maxY - minY, 16);
  const edges = new THREE.EdgesGeometry(box);
  box.dispose();
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
