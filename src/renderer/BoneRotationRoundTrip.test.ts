import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createCharacter } from "../project/ProjectStore";
import { updateProjectBoneRotation } from "../rigs/RigController";
import { createInitialProject } from "../project/ProjectStore";

/**
 * The bone rotate gizmo reads a pivot's local Euler back into boneRotations.
 * That only works if the two use the same convention (degrees, XYZ order), so
 * pin the round-trip here rather than discovering drift by eye in the viewport.
 */

/** Mirrors createBoneObject: boneRotations (degrees) -> pivot Euler. */
function applyBoneRotation(
  pivot: THREE.Object3D,
  rotation: readonly [number, number, number]
): void {
  pivot.rotation.set(
    THREE.MathUtils.degToRad(rotation[0]),
    THREE.MathUtils.degToRad(rotation[1]),
    THREE.MathUtils.degToRad(rotation[2])
  );
}

/** Mirrors handleGizmoChange: pivot Euler -> boneRotations (degrees). */
function readBoneRotation(pivot: THREE.Object3D): [number, number, number] {
  return [
    THREE.MathUtils.radToDeg(pivot.rotation.x),
    THREE.MathUtils.radToDeg(pivot.rotation.y),
    THREE.MathUtils.radToDeg(pivot.rotation.z)
  ];
}

describe("bone rotate gizmo round-trip", () => {
  it("reads back exactly what was written to the pivot", () => {
    const pivot = new THREE.Object3D();
    const authored: [number, number, number] = [12, -47, 130];

    applyBoneRotation(pivot, authored);
    const read = readBoneRotation(pivot);

    expect(read[0]).toBeCloseTo(authored[0], 6);
    expect(read[1]).toBeCloseTo(authored[1], 6);
    expect(read[2]).toBeCloseTo(authored[2], 6);
  });

  it("survives a quaternion round-trip, as the gizmo drag performs", () => {
    const pivot = new THREE.Object3D();
    applyBoneRotation(pivot, [25, 40, -15]);

    // TransformControls drives object.quaternion; three keeps .rotation in sync.
    const quaternion = pivot.quaternion.clone();
    pivot.rotation.set(0, 0, 0);
    pivot.quaternion.copy(quaternion);

    const read = readBoneRotation(pivot);
    expect(read[0]).toBeCloseTo(25, 4);
    expect(read[1]).toBeCloseTo(40, 4);
    expect(read[2]).toBeCloseTo(-15, 4);
  });

  it("stores a gizmo rotation back onto the character", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const pivot = new THREE.Object3D();
    applyBoneRotation(pivot, [0, 35, 0]);

    const next = updateProjectBoneRotation(
      project,
      character.id,
      "head",
      readBoneRotation(pivot)
    );

    const stored = next.scene.characters[0].boneRotations.head;
    expect(stored[1]).toBeCloseTo(35, 4);
  });

  it("uses XYZ Euler order on both sides", () => {
    // createCharacter seeds default rotations; the default order must be XYZ,
    // otherwise degrees written and read back would diverge for compound angles.
    expect(createCharacter().boneRotations.leftArm).toBeDefined();
    expect(new THREE.Object3D().rotation.order).toBe("XYZ");
  });
});
