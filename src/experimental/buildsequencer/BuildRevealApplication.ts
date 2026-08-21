import * as THREE from "three";
import type { BuildSequenceView } from "./BuildSequencerSession";

// Applies a Build Sequencer reveal to the live Minecraft world instanced meshes.
// World blocks render as THREE.InstancedMesh instances (one per block face); this
// hides the instances of blocks that have not revealed yet at the current frame
// and restores the rest, so scrubbing the timeline plays the build assembling.
//
// The matrix math is plain Three.js (no WebGL), so this whole module is unit
// tested against real InstancedMesh objects.

const HIDDEN_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

/** userData key identifying an instanced mesh built from Minecraft blocks. */
export const BUILD_REVEAL_POSITIONS_KEY = "blockPositions";
const BASE_MATRICES_KEY = "buildRevealBaseMatrices";

export function coordKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

/** Map every block coordinate in the view to its reveal frame. */
export function revealFrameByCoord(view: BuildSequenceView): Map<string, number> {
  const map = new Map<string, number>();
  view.blocks.forEach((block, index) => {
    map.set(coordKey(block.x, block.y, block.z), view.schedule.revealFrames[index]);
  });
  return map;
}

/**
 * Apply the reveal to a world object tree at `frame`. Pass `lookup = null` to
 * fully restore the world (feature disabled). Instanced meshes must carry their
 * per-instance block coordinates in `userData[BUILD_REVEAL_POSITIONS_KEY]`.
 */
export function applyBuildReveal(
  worldGroup: THREE.Object3D,
  lookup: ReadonlyMap<string, number> | null,
  frame: number,
  mode: "assemble" | "disassemble" = "assemble"
): void {
  const disassemble = mode === "disassemble";
  worldGroup.traverse((object) => {
    const mesh = object as THREE.InstancedMesh;
    if (!mesh.isInstancedMesh) return;
    const positions = mesh.userData[BUILD_REVEAL_POSITIONS_KEY] as
      | ReadonlyArray<readonly [number, number, number]>
      | undefined;
    if (!positions || positions.length === 0) return;

    const base = ensureBaseMatrices(mesh);
    const scratch = new THREE.Matrix4();
    const count = Math.min(mesh.count, positions.length);
    let changed = false;
    for (let index = 0; index < count; index += 1) {
      const revealFrame = lookup ? lookup.get(coordKey(positions[index][0], positions[index][1], positions[index][2])) : undefined;
      const visible = lookup === null || revealFrame === undefined
        ? true
        : disassemble ? frame < revealFrame : frame >= revealFrame;
      if (visible) {
        scratch.fromArray(base, index * 16);
        mesh.setMatrixAt(index, scratch);
      } else {
        mesh.setMatrixAt(index, HIDDEN_MATRIX);
      }
      changed = true;
    }
    if (changed) mesh.instanceMatrix.needsUpdate = true;
  });
}

// Snapshot the untouched instance matrices once so hidden instances can be
// restored exactly, independent of how many times the reveal is re-applied.
function ensureBaseMatrices(mesh: THREE.InstancedMesh): Float32Array {
  const existing = mesh.userData[BASE_MATRICES_KEY] as Float32Array | undefined;
  if (existing) return existing;
  const snapshot = Float32Array.from(mesh.instanceMatrix.array);
  mesh.userData[BASE_MATRICES_KEY] = snapshot;
  return snapshot;
}
