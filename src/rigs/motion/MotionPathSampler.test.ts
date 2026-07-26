import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { Animator } from "../../animation/Animator";
import { addClipToAnimationLayer } from "../../animation/editor/NlaTracks";
import { createInitialProject } from "../../project/ProjectStore";
import type { ReusableAnimationClip } from "../../project/ProjectFile";
import { createDefaultSteveRig } from "../DefaultSteveRig";
import { getRigDefinition } from "../MinecraftRigPresets";
import { makeBoneObjectId } from "../RigSelection";
import {
  MOTION_PATH_LIMITS,
  sampleProjectMotionPath
} from "./MotionPathSampler";

describe("motion path sampling", () => {
  it("samples a character root with timeline interpolation, keys, duration, distance, and bounds", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    project.animation.tracks.push({
      id: `${character.id}:transform.position`,
      targetId: character.id,
      property: "transform.position",
      keyframes: [
        { frame: 0, value: [0, 1, 0] },
        { frame: 3, value: [3, 1, 0] }
      ]
    });
    const result = sampleProjectMotionPath(project, {
      kind: "characterRoot",
      subjectId: character.id,
      startFrame: 0,
      endFrame: 3
    });
    expect(result.ok).toBe(true);
    expect(result.path).toMatchObject({
      durationFrames: 3,
      durationSeconds: 0.125,
      distance: 3,
      keyframeFrames: [0, 3],
      bounds: {
        minimum: [0, 1, 0],
        maximum: [3, 1, 0]
      }
    });
    expect(result.path!.points).toEqual([
      { frame: 0, position: [0, 1, 0], keyframe: true },
      { frame: 1, position: [1, 1, 0], keyframe: false },
      { frame: 2, position: [2, 1, 0], keyframe: false },
      { frame: 3, position: [3, 1, 0], keyframe: true }
    ]);
  });

  it("matches the rendered hand hierarchy under animated bones and a complex character transform", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.transform.position = [2, 3, -4];
    character.transform.rotation = [10, 35, -5];
    character.transform.scale = [1.5, 0.8, 2];
    for (const [boneId, endRotation] of [
      ["root", [8, -12, 5]],
      ["body", [-15, 20, 4]],
      ["rightArm", [-35, 10, 18]],
      ["rightForearm", [-55, -5, 12]]
    ] as const) {
      project.animation.tracks.push({
        id: `${character.id}:bone.rotation.${boneId}`,
        targetId: character.id,
        property: `bone.rotation.${boneId}`,
        keyframes: [
          { frame: 0, value: [0, 0, 0] },
          { frame: 10, value: [...endRotation] }
        ]
      });
    }
    const result = sampleProjectMotionPath(project, {
      kind: "rightHand",
      subjectId: character.id,
      startFrame: 5,
      endFrame: 5
    });
    expect(result.ok).toBe(true);

    const sampled = Animator.sampleProject(project, 5);
    const sampledCharacter = sampled.scene.characters[0];
    const rendered = createDefaultSteveRig(sampledCharacter);
    rendered.position.set(...sampledCharacter.transform.position);
    rendered.rotation.set(
      ...sampledCharacter.transform.rotation.map(THREE.MathUtils.degToRad) as [
        number,
        number,
        number
      ]
    );
    rendered.scale.set(...sampledCharacter.transform.scale);
    rendered.updateMatrixWorld(true);
    let forearm: THREE.Object3D | null = null;
    rendered.traverse((object3d) => {
      if (!forearm &&
        object3d.userData.objectId === makeBoneObjectId(character.id, "rightForearm")) {
        forearm = object3d;
      }
    });
    const hand = getRigDefinition(character.rigPreset).attachmentPoints.find(
      (point) => point.id === "rightHand"
    )!;
    const expected = new THREE.Vector3(...hand.offset).applyMatrix4(forearm!.matrixWorld);
    expect(new THREE.Vector3(...result.path!.points[0].position).distanceTo(expected))
      .toBeLessThan(1e-8);
  });

  it("includes fractional camera keyframes while retaining integer path samples", () => {
    const project = createInitialProject();
    const camera = project.scene.cameras[0];
    project.animation.tracks.push({
      id: `${camera.id}:transform.position`,
      targetId: camera.id,
      property: "transform.position",
      keyframes: [
        { frame: 0, value: [0, 0, 0] },
        { frame: 2.5, value: [2.5, 5, 0] },
        { frame: 4, value: [4, 8, 0] }
      ]
    });
    const request = {
      kind: "camera",
      subjectId: camera.id,
      startFrame: 0,
      endFrame: 4
    };
    const first = sampleProjectMotionPath(project, request);
    const second = sampleProjectMotionPath(structuredClone(project), request);
    expect(second).toEqual(first);
    expect(first.path?.keyframeFrames).toEqual([0, 2.5, 4]);
    expect(first.path?.points.map((point) => point.frame)).toEqual([
      0, 1, 2, 2.5, 3, 4
    ]);
    expect(first.path?.points.find((point) => point.frame === 2.5)?.keyframe)
      .toBe(true);
  });

  it("samples layered camera motion and exposes remapped layer keyframes", () => {
    const project = createInitialProject();
    const camera = project.scene.cameras[0];
    camera.transform.position = [2, 3, 4];
    const clip: ReusableAnimationClip = {
      id: "camera_additive",
      name: "Camera Additive",
      description: "",
      targetType: "camera",
      durationFrames: 10,
      tracks: [{
        property: "transform.position",
        keyframes: [
          { frame: 0, value: [0, 0, 0] },
          { frame: 5, value: [5, 0, 0] },
          { frame: 10, value: [10, 0, 0] }
        ]
      }],
      createdAt: "2026-01-01T00:00:00.000Z"
    };
    project.animation.clips.push(clip);
    project.animation.nlaTracks = addClipToAnimationLayer(
      [],
      clip,
      camera.id,
      2,
      "additiveMotion"
    );
    project.animation.nlaTracks[0].clips[0].timeScale = 2;

    const result = sampleProjectMotionPath(project, {
      kind: "camera",
      subjectId: camera.id,
      startFrame: 0,
      endFrame: 7
    });

    expect(result.ok).toBe(true);
    expect(result.path?.keyframeFrames).toEqual([2, 4.5, 7]);
    expect(result.path?.points.find((point) => point.frame === 4.5)).toEqual({
      frame: 4.5,
      position: [7, 3, 4],
      keyframe: true
    });
    expect(result.path?.points.at(-1)?.position).toEqual([12, 3, 4]);
  });

  it("rejects missing, oversized, excessive-track, and hostile requests without accessors", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    expect(sampleProjectMotionPath(project, {
      kind: "camera",
      subjectId: "missing",
      startFrame: 0,
      endFrame: 1
    }).error).toContain("MOTION_PATH_CAMERA_MISSING");

    project.animation.durationFrames = MOTION_PATH_LIMITS.maximumBaseFrames + 10;
    expect(sampleProjectMotionPath(project, {
      kind: "characterRoot",
      subjectId: character.id,
      startFrame: 0,
      endFrame: MOTION_PATH_LIMITS.maximumBaseFrames
    }).error).toContain("MOTION_PATH_RANGE_TOO_LARGE");

    const excessive = createInitialProject();
    const target = excessive.scene.cameras[0];
    excessive.animation.tracks.push({
      id: "oversized",
      targetId: target.id,
      property: "transform.position",
      keyframes: Array.from(
        { length: MOTION_PATH_LIMITS.maximumKeyframesPerTrack + 1 },
        (_, frame) => ({ frame, value: [frame, 0, 0] as [number, number, number] })
      )
    });
    expect(sampleProjectMotionPath(excessive, {
      kind: "camera",
      subjectId: target.id,
      startFrame: 0,
      endFrame: 1
    }).error).toContain("MOTION_PATH_TRACK_LIMIT");

    let accessed = false;
    const hostile = Object.defineProperty({}, "kind", {
      enumerable: true,
      get() {
        accessed = true;
        return "camera";
      }
    });
    expect(sampleProjectMotionPath(project, hostile).ok).toBe(false);
    expect(accessed).toBe(false);
  });
});
