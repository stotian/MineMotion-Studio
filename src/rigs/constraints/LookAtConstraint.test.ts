import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { solveLookAtConstraint, type LookAtEulerOrder } from "./LookAtConstraint";

function renderedDirection(rotation: readonly number[], order: LookAtEulerOrder): THREE.Vector3 {
  return new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(rotation[0]),
    THREE.MathUtils.degToRad(rotation[1]),
    THREE.MathUtils.degToRad(rotation[2]),
    order
  ));
}

describe("look-at constraint", () => {
  it("matches the production camera YXZ convention", () => {
    const result = solveLookAtConstraint({
      sourcePosition: [8, 6, 8],
      targetPosition: [0, 0, 0],
      currentRotation: [0, 0, 0],
      eulerOrder: "YXZ"
    });
    expect(result).toMatchObject({ solved: true, reachedTarget: true, clamped: false });
    const expected = new THREE.Vector3(-8, -6, -8).normalize();
    const rendered = renderedDirection(result.rotation!, "YXZ");
    expect(rendered.distanceTo(expected)).toBeLessThan(1e-8);
  });

  it.each(["XYZ", "YXZ"] as const)("reconstructs exact %s renderer directions", (eulerOrder) => {
    const result = solveLookAtConstraint({
      sourcePosition: [-4, 2, 1],
      targetPosition: [3, 7, -5],
      currentRotation: [12, -25, 4],
      eulerOrder
    });
    const expected = new THREE.Vector3(7, 5, -6).normalize();
    const rendered = renderedDirection(result.rotation!, eulerOrder);
    expect(result.reachedTarget).toBe(true);
    expect(rendered.distanceTo(expected)).toBeLessThan(1e-8);
  });

  it("uses quaternion influence and clamps component limits honestly", () => {
    const base = {
      sourcePosition: [0, 0, 0] as [number, number, number],
      targetPosition: [10, 4, -2] as [number, number, number],
      currentRotation: [0, 0, 0] as [number, number, number],
      eulerOrder: "YXZ" as const
    };
    const none = solveLookAtConstraint({ ...base, influence: 0 });
    const half = solveLookAtConstraint({ ...base, influence: 0.5 });
    const full = solveLookAtConstraint({ ...base, influence: 1 });
    expect(none.rotation).toEqual([0, 0, 0]);
    expect(half.rotation).not.toEqual(none.rotation);
    expect(half.rotation).not.toEqual(full.rotation);
    expect(full.reachedTarget).toBe(true);

    const limited = solveLookAtConstraint({
      ...base,
      minRotation: [-10, -20, 0],
      maxRotation: [10, 20, 0]
    });
    expect(limited).toMatchObject({ solved: true, clamped: true, reachedTarget: false });
    expect(limited.rotation).toEqual([10, -20, 0]);
    expect(limited.warnings.join(" ")).toContain("LOOK_AT_LIMIT_CLAMPED");
  });

  it("uses a deterministic vertical fallback and clamps hostile influence", () => {
    const first = solveLookAtConstraint({
      sourcePosition: [0, 0, 0],
      targetPosition: [0, 5, 0],
      currentRotation: [0, 0, 0],
      influence: 4
    });
    const second = solveLookAtConstraint({
      sourcePosition: [0, 0, 0],
      targetPosition: [0, 5, 0],
      currentRotation: [0, 0, 0],
      influence: 4
    });
    expect(second).toEqual(first);
    expect(first.solved).toBe(true);
    expect(first.warnings.join(" ")).toContain("LOOK_AT_UP_COLLINEAR");
    expect(first.warnings.join(" ")).toContain("LOOK_AT_INFLUENCE_CLAMPED");
  });

  it("rejects degenerate, malformed, unsafe, and inverted-limit inputs without invoking accessors", () => {
    expect(solveLookAtConstraint({
      sourcePosition: [1, 2, 3],
      targetPosition: [1, 2, 3],
      currentRotation: [0, 0, 0]
    }).warnings[0]).toContain("LOOK_AT_TARGET_DEGENERATE");
    expect(solveLookAtConstraint({
      sourcePosition: [0, 0, 0],
      targetPosition: [0, 0, -1],
      currentRotation: [0, 0, 0],
      minRotation: [10, 0, 0],
      maxRotation: [-10, 0, 0]
    }).warnings[0]).toContain("LOOK_AT_LIMIT_INVALID");
    expect(solveLookAtConstraint({
      sourcePosition: [Number.NaN, 0, 0],
      targetPosition: [0, 0, -1],
      currentRotation: [0, 0, 0]
    }).solved).toBe(false);

    let accessed = false;
    const hostile = Object.defineProperty({}, "sourcePosition", {
      enumerable: true,
      get() {
        accessed = true;
        return [0, 0, 0];
      }
    });
    expect(solveLookAtConstraint(hostile).solved).toBe(false);
    expect(accessed).toBe(false);
  });
});
