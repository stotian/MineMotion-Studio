import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createInitialProject } from "../../project/ProjectStore";
import type { ImportedWorldSummary, MineMotionProject } from "../../project/ProjectFile";
import type { MinecraftBlockSample } from "../../minecraft/import/MinecraftChunkTypes";
import { deriveBuildSequence } from "./BuildSequencerSession";
import type { BuildSequenceSettings } from "./BuildSequenceTypes";
import {
  applyBuildReveal,
  BUILD_REVEAL_POSITIONS_KEY,
  revealFrameByCoord
} from "./BuildRevealApplication";

function block(x: number, y: number, z: number): MinecraftBlockSample {
  return { id: "stone", minecraftName: "minecraft:stone", x, y, z };
}

function worldWith(blocks: MinecraftBlockSample[]): ImportedWorldSummary {
  return {
    sourceName: "W",
    levelDatFound: true,
    dimensions: [{ id: "overworld", label: "Overworld", regionFiles: ["region/r.0.0.mca"] }],
    selectedDimension: "overworld",
    importedChunks: [{
      id: "overworld:0,0", dimension: "overworld", regionX: 0, regionZ: 0, chunkX: 0, chunkZ: 0,
      minY: -64, maxY: 319, sectionsRead: 1, blocks, unknownBlocks: {}, warnings: [], contentFingerprint: "c0"
    }],
    importedAt: "2026-08-21T00:00:00.000Z",
    notes: []
  };
}

function projectWith(blocks: MinecraftBlockSample[]): MineMotionProject {
  return { ...createInitialProject(), world: worldWith(blocks) };
}

// One InstancedMesh mirroring how ChunkMeshBuilder places blocks (centre + 0.5),
// tagged with per-instance block coordinates.
function worldMeshFor(coords: [number, number, number][]): THREE.Group {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), coords.length);
  const matrix = new THREE.Matrix4();
  coords.forEach((c, index) => {
    matrix.makeTranslation(c[0] + 0.5, c[1] + 0.5, c[2] + 0.5);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.userData[BUILD_REVEAL_POSITIONS_KEY] = coords;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

function instanceScale(mesh: THREE.InstancedMesh, index: number): number {
  const matrix = new THREE.Matrix4();
  mesh.getMatrixAt(index, matrix);
  const scale = new THREE.Vector3();
  matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
  return scale.x;
}

function instancePosition(mesh: THREE.InstancedMesh, index: number): [number, number, number] {
  const matrix = new THREE.Matrix4();
  mesh.getMatrixAt(index, matrix);
  const position = new THREE.Vector3();
  matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
  return [position.x, position.y, position.z];
}

const SETTINGS: BuildSequenceSettings = {
  strategy: { kind: "layer", axis: "y", direction: "ascending" },
  startFrame: 0,
  durationFrames: 60,
  fadeFrames: 0
};

describe("BuildRevealApplication", () => {
  const coords: [number, number, number][] = [[0, 0, 0], [0, 1, 0], [0, 2, 0]];

  it("hides unrevealed instances and keeps revealed ones at their original transform", () => {
    const view = deriveBuildSequence(projectWith(coords.map((c) => block(...c))), SETTINGS);
    const lookup = revealFrameByCoord(view);
    const group = worldMeshFor(coords);
    const mesh = group.children[0] as THREE.InstancedMesh;

    // At the very first frame only the bottom layer (y=0) is revealed.
    applyBuildReveal(group, lookup, 0);
    expect(instanceScale(mesh, 0)).toBeCloseTo(1, 5);
    expect(instancePosition(mesh, 0)).toEqual([0.5, 0.5, 0.5]);
    expect(instanceScale(mesh, 1)).toBeCloseTo(0, 5);
    expect(instanceScale(mesh, 2)).toBeCloseTo(0, 5);
  });

  it("reveals the whole build by the completion frame", () => {
    const view = deriveBuildSequence(projectWith(coords.map((c) => block(...c))), SETTINGS);
    const lookup = revealFrameByCoord(view);
    const group = worldMeshFor(coords);
    const mesh = group.children[0] as THREE.InstancedMesh;

    applyBuildReveal(group, lookup, view.schedule.completeFrame);
    for (let i = 0; i < coords.length; i += 1) {
      expect(instanceScale(mesh, i)).toBeCloseTo(1, 5);
      expect(instancePosition(mesh, i)).toEqual([coords[i][0] + 0.5, coords[i][1] + 0.5, coords[i][2] + 0.5]);
    }
  });

  it("fully restores the world when the reveal is disabled (null lookup)", () => {
    const view = deriveBuildSequence(projectWith(coords.map((c) => block(...c))), SETTINGS);
    const group = worldMeshFor(coords);
    const mesh = group.children[0] as THREE.InstancedMesh;

    applyBuildReveal(group, revealFrameByCoord(view), 0); // hide most
    applyBuildReveal(group, null, 0); // restore
    for (let i = 0; i < coords.length; i += 1) {
      expect(instanceScale(mesh, i)).toBeCloseTo(1, 5);
    }
  });

  it("is stable when re-applied across frames (base captured once)", () => {
    const view = deriveBuildSequence(projectWith(coords.map((c) => block(...c))), SETTINGS);
    const lookup = revealFrameByCoord(view);
    const group = worldMeshFor(coords);
    const mesh = group.children[0] as THREE.InstancedMesh;

    applyBuildReveal(group, lookup, 0);
    applyBuildReveal(group, lookup, 30); // y=1 now revealed too
    applyBuildReveal(group, lookup, view.schedule.completeFrame);
    // After reaching completion every original transform is intact.
    expect(instancePosition(mesh, 2)).toEqual([0.5, 2.5, 0.5]);
    expect(instanceScale(mesh, 2)).toBeCloseTo(1, 5);
  });

  it("mirrors visibility in disassemble mode", () => {
    const view = deriveBuildSequence(projectWith(coords.map((c) => block(...c))), { ...SETTINGS, mode: "disassemble" });
    const lookup = revealFrameByCoord(view);
    const group = worldMeshFor(coords);
    const mesh = group.children[0] as THREE.InstancedMesh;

    // Before the first removal the whole build is still standing.
    applyBuildReveal(group, lookup, view.schedule.startFrame - 1, "disassemble");
    for (let i = 0; i < coords.length; i += 1) expect(instanceScale(mesh, i)).toBeCloseTo(1, 5);

    // By completion it has been taken apart (bottom layer removed first).
    applyBuildReveal(group, lookup, view.schedule.completeFrame, "disassemble");
    expect(instanceScale(mesh, 0)).toBeCloseTo(0, 5);
    expect(instanceScale(mesh, 2)).toBeCloseTo(0, 5);
  });

  it("ignores instanced meshes without block positions", () => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 1);
    const matrix = new THREE.Matrix4().makeTranslation(5, 5, 5);
    mesh.setMatrixAt(0, matrix);
    const group = new THREE.Group();
    group.add(mesh);
    applyBuildReveal(group, new Map([["0,0,0", 999]]), 0);
    expect(instancePosition(mesh, 0)).toEqual([5, 5, 5]);
    expect(instanceScale(mesh, 0)).toBeCloseTo(1, 5);
  });
});
