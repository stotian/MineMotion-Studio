import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import type { SampledMotionPath } from "../rigs/motion/MotionPathSampler";
import { disposeThreeObjectTree } from "./ThreeResourceDisposal";
import { createMotionPathObject } from "./MotionPathRenderer";

const PATH: SampledMotionPath = {
  kind: "camera",
  subjectId: "camera_main",
  subjectName: "Scene Camera",
  startFrame: 0,
  endFrame: 2,
  durationFrames: 2,
  durationSeconds: 2 / 24,
  distance: 2,
  points: [
    { frame: 0, position: [0, 1, 0], keyframe: true },
    { frame: 1, position: [1, 1, 0], keyframe: false },
    { frame: 2, position: [2, 1, 0], keyframe: true }
  ],
  keyframeFrames: [0, 2],
  bounds: { minimum: [0, 1, 0], maximum: [2, 1, 0] }
};

describe("motion path renderer", () => {
  it("creates one polyline and exact keyframe points", () => {
    const object = createMotionPathObject(PATH);
    expect(object).toBeInstanceOf(THREE.Group);
    const line = object!.children.find((child) => child instanceof THREE.Line);
    const keys = object!.children.find((child) => child instanceof THREE.Points);
    expect(line).toBeInstanceOf(THREE.Line);
    expect((line as THREE.Line).geometry.getAttribute("position").count).toBe(3);
    expect(keys).toBeInstanceOf(THREE.Points);
    expect((keys as THREE.Points).geometry.getAttribute("position").count).toBe(2);
  });

  it("is owned by normal object-tree disposal and rejects unsafe points", () => {
    const object = createMotionPathObject(PATH)!;
    const line = object.children[0] as THREE.Line;
    const geometryDispose = vi.spyOn(line.geometry, "dispose");
    const materialDispose = vi.spyOn(line.material as THREE.Material, "dispose");
    disposeThreeObjectTree(object);
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();

    expect(createMotionPathObject({
      ...PATH,
      points: [{ frame: 0, position: [Number.NaN, 0, 0], keyframe: false }]
    })).toBeNull();
  });
});
