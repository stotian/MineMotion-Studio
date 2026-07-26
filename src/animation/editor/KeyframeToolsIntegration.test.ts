import { describe, expect, it } from "vitest";
import { HistoryStack } from "../../history/HistoryStack";
import {
  loadProjectAutosave,
  saveProjectAutosave
} from "../../project/ProjectAutosave";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { sampleProjectAnimationWithVfxTiming } from "../../vfx/runtime/VfxAnimationSampling";
import {
  loopSelectedKeyframes,
  mirrorSelectedKeyframes,
  reverseSelectedKeyframes
} from "./KeyframeCommands";

describe("keyframe tool integration", () => {
  it("preserves mirrored, reversed, and looped global keys through every project path", () => {
    const project = createInitialProject();
    const targetId = project.scene.characters[0].id;
    project.animation.tracks = [
      {
        id: `${targetId}:bone.rotation.leftArm`,
        targetId,
        property: "bone.rotation.leftArm",
        keyframes: [
          { id: "left_0", frame: 0, value: [10, 20, 30] },
          { id: "left_5", frame: 5, value: [20, 30, 40] },
          { id: "left_10", frame: 10, value: [30, 40, 50] }
        ]
      },
      {
        id: `${targetId}:bone.rotation.rightArm`,
        targetId,
        property: "bone.rotation.rightArm",
        keyframes: [
          { id: "right_0", frame: 0, value: [-10, 5, 15] },
          { id: "right_5", frame: 5, value: [-20, 10, 20] },
          { id: "right_10", frame: 10, value: [-30, 15, 25] }
        ]
      }
    ];
    const selection = project.animation.tracks.flatMap((track) =>
      track.keyframes.map((keyframe) => ({
        trackId: track.id,
        keyframeId: keyframe.id!
      }))
    );
    const mirrored = mirrorSelectedKeyframes(
      project.animation.tracks,
      selection
    );
    const reversed = reverseSelectedKeyframes(
      mirrored.tracks,
      mirrored.selection
    );
    const looped = loopSelectedKeyframes(
      reversed.tracks,
      reversed.selection,
      1,
      project.animation.durationFrames
    );
    expect(looped.changed).toBe(true);

    const transformed = {
      ...project,
      animation: { ...project.animation, tracks: looped.tracks }
    };
    const serialized = ProjectSerializer.parse(
      ProjectSerializer.serialize(transformed)
    );
    const packaged = PackageReader.parse(
      JSON.stringify(createMineMotionPackageData(transformed))
    );
    const schema9 = ProjectSerializer.parse(
      ProjectSerializer.serializeLegacyV9(transformed)
    );
    for (const candidate of [serialized, packaged, schema9]) {
      expect(candidate.animation.tracks).toEqual(serialized.animation.tracks);
    }

    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      }
    };
    saveProjectAutosave(storage, transformed);
    expect(loadProjectAutosave(storage)?.project.animation.tracks)
      .toEqual(serialized.animation.tracks);

    const history = new HistoryStack<typeof project>();
    history.push(project, "Before keyframe transforms");
    expect(history.undo(transformed)?.animation.tracks)
      .toEqual(project.animation.tracks);

    const sampled = sampleProjectAnimationWithVfxTiming(transformed, 0);
    expect(sampled.scene.characters[0].boneRotations.leftArm)
      .toEqual([-30, -15, -25]);
    expect(sampled.scene.characters[0].boneRotations.rightArm)
      .toEqual([30, -40, -50]);
  });
});
