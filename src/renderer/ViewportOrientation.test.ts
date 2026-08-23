import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { computeViewportOrientation } from "./ViewportOrientation";

/** Builds the quaternion of a camera at `position` looking at the origin. */
function lookAtOrigin(position: [number, number, number]): THREE.Quaternion {
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(...position);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera.quaternion.clone();
}

describe("computeViewportOrientation", () => {
  it("is the identity basis for an unrotated camera", () => {
    const orientation = computeViewportOrientation(new THREE.Quaternion());

    expect(orientation.x[0]).toBeCloseTo(1, 6);
    expect(orientation.y[1]).toBeCloseTo(1, 6);
    expect(orientation.z[2]).toBeCloseTo(1, 6);
  });

  it("puts world +Z toward the viewer when looking down the +Z axis", () => {
    const orientation = computeViewportOrientation(lookAtOrigin([0, 0, 10]));

    // Screen-space z is "toward the viewer", so +Z must be strongly positive.
    expect(orientation.z[2]).toBeCloseTo(1, 5);
    // ...and world +X still points right, +Y still points up.
    expect(orientation.x[0]).toBeCloseTo(1, 5);
    expect(orientation.y[1]).toBeCloseTo(1, 5);
  });

  it("faces world +X toward the viewer when looking from +X", () => {
    const orientation = computeViewportOrientation(lookAtOrigin([10, 0, 0]));

    // Looking from +X down the -X direction: world +X now faces the viewer.
    expect(orientation.x[2]).toBeCloseTo(1, 5);
    // The camera's right axis is world -Z (right-handed: X = Y x Z), so world
    // +Z lands on screen-LEFT.
    expect(orientation.z[0]).toBeCloseTo(-1, 5);
    expect(orientation.y[1]).toBeCloseTo(1, 5);
  });

  it("keeps the basis orthonormal from an arbitrary angle", () => {
    const orientation = computeViewportOrientation(lookAtOrigin([7, 5, -3]));
    const x = new THREE.Vector3(...orientation.x);
    const y = new THREE.Vector3(...orientation.y);
    const z = new THREE.Vector3(...orientation.z);

    expect(x.length()).toBeCloseTo(1, 6);
    expect(y.length()).toBeCloseTo(1, 6);
    expect(z.length()).toBeCloseTo(1, 6);
    expect(x.dot(y)).toBeCloseTo(0, 6);
    expect(x.dot(z)).toBeCloseTo(0, 6);
  });
});
