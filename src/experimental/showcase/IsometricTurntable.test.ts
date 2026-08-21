import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { lookAtRotation } from "../../production/director/CameraMath";
import type { Vector3Tuple } from "../../project/ProjectFile";
import {
  bakeIsometricTurntable,
  computeIsometricTurntable,
  type IsometricTurntableOptions
} from "./IsometricTurntable";

const CENTER: Vector3Tuple = [4, 2, -3];
const OPTIONS: IsometricTurntableOptions = {
  center: CENTER,
  radius: 12,
  elevationDegrees: 30,
  startFrame: 0,
  durationFrames: 120,
  degreesPerKeyframe: 15
};

function horizontalRadius(position: Vector3Tuple, center: Vector3Tuple): number {
  return Math.hypot(position[0] - center[0], position[2] - center[2]);
}

describe("IsometricTurntable", () => {
  it("is deterministic", () => {
    expect(computeIsometricTurntable(OPTIONS)).toEqual(computeIsometricTurntable(OPTIONS));
  });

  it("orbits at a constant radius and elevation while facing the centre", () => {
    const keyframes = computeIsometricTurntable(OPTIONS);
    const expectedHeight = OPTIONS.radius * Math.tan((30 * Math.PI) / 180);
    for (const keyframe of keyframes) {
      expect(horizontalRadius(keyframe.position, CENTER)).toBeCloseTo(OPTIONS.radius, 5);
      expect(keyframe.position[1] - CENTER[1]).toBeCloseTo(expectedHeight, 5);
      // Rotation always looks back at the centre.
      expect(keyframe.rotation).toEqual(lookAtRotation(keyframe.position, CENTER));
    }
  });

  it("spans the requested frame range with strictly increasing frames", () => {
    const keyframes = computeIsometricTurntable(OPTIONS);
    expect(keyframes[0].frame).toBe(0);
    expect(keyframes[keyframes.length - 1].frame).toBe(120);
    for (let i = 1; i < keyframes.length; i += 1) {
      expect(keyframes[i].frame).toBeGreaterThan(keyframes[i - 1].frame);
    }
  });

  it("completes multiple revolutions when asked", () => {
    const single = computeIsometricTurntable(OPTIONS);
    const triple = computeIsometricTurntable({ ...OPTIONS, turns: 3 });
    expect(triple[triple.length - 1].frame).toBe(360);
    expect(triple.length).toBeGreaterThan(single.length);
  });

  it("bakes camera transform tracks and leaves the input untouched", () => {
    const project = createInitialProject();
    const cameraId = project.scene.cameras[0].id;
    const before = project.animation.tracks.length;

    const baked = bakeIsometricTurntable(project, cameraId, OPTIONS);

    const cameraTracks = baked.animation.tracks.filter((track) => track.targetId === cameraId);
    expect(cameraTracks.map((track) => track.property).sort()).toEqual(["transform.position", "transform.rotation"]);
    expect(cameraTracks[0].keyframes.length).toBeGreaterThan(1);
    expect(baked.animation.durationFrames).toBeGreaterThanOrEqual(120);
    // Input project is not mutated.
    expect(project.animation.tracks.length).toBe(before);
  });

  it("replaces existing camera transform tracks rather than duplicating them", () => {
    const project = createInitialProject();
    const cameraId = project.scene.cameras[0].id;
    const once = bakeIsometricTurntable(project, cameraId, OPTIONS);
    const twice = bakeIsometricTurntable(once, cameraId, { ...OPTIONS, radius: 20 });
    const posTracks = twice.animation.tracks.filter(
      (track) => track.targetId === cameraId && track.property === "transform.position"
    );
    expect(posTracks).toHaveLength(1);
  });

  it("returns the original project for an unknown camera", () => {
    const project = createInitialProject();
    expect(bakeIsometricTurntable(project, "missing-camera", OPTIONS)).toBe(project);
  });

  it("rejects invalid options", () => {
    expect(() => computeIsometricTurntable({ ...OPTIONS, radius: 0 })).toThrow(/radius must be positive/i);
    expect(() => computeIsometricTurntable({ ...OPTIONS, durationFrames: 0 })).toThrow(/at least 1/i);
    expect(() => computeIsometricTurntable({ ...OPTIONS, center: [0, Number.NaN, 0] })).toThrow(/finite/i);
  });
});
