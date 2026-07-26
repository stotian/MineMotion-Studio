import { describe, expect, it } from "vitest";
import { HistoryStack } from "../history/HistoryStack";
import {
  loadProjectAutosave,
  saveProjectAutosave
} from "../project/ProjectAutosave";
import { ProjectSerializer } from "../project/ProjectSerializer";
import { createInitialProject } from "../project/ProjectStore";
import { createMineMotionPackageData } from "../project/package/MineMotionPackage";
import { PackageReader } from "../project/package/PackageReader";
import { sampleProjectAnimationWithVfxTiming } from "../vfx/runtime/VfxAnimationSampling";
import {
  copyCharacterPose,
  mirrorProjectCharacterPose,
  pasteProjectCharacterPose,
  resetProjectCharacterPose
} from "./PoseCommands";

describe("PoseCommands", () => {
  it("copies a detached, complete current-rig snapshot", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.boneRotations.head = [15, 25, 35];

    const clipboard = copyCharacterPose(character);
    character.boneRotations.head[0] = 90;

    expect(clipboard.sourceRigId).toBe("steve");
    expect(clipboard.boneRotations.head).toEqual([15, 25, 35]);
    expect(clipboard.boneRotations.leftForearm).toEqual([0, 0, 0]);
    expect(clipboard.boneRotations).not.toBe(character.boneRotations);
  });

  it("pastes and blends only compatible bones with bounded influence", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.boneRotations.head = [80, -40, 20];
    const clipboard = copyCharacterPose(character);
    character.boneRotations.head = [0, 0, 0];

    const blended = pasteProjectCharacterPose(
      project,
      character.id,
      clipboard,
      0.25
    );
    expect(blended.changed).toBe(true);
    expect(blended.project.scene.characters[0].boneRotations.head)
      .toEqual([20, -10, 5]);

    const pasted = pasteProjectCharacterPose(
      project,
      character.id,
      clipboard,
      4
    );
    expect(pasted.project.scene.characters[0].boneRotations.head)
      .toEqual([80, -40, 20]);
    expect(pasteProjectCharacterPose(
      project,
      character.id,
      clipboard,
      0
    ).project).toBe(project);
    expect(pasteProjectCharacterPose(
      project,
      character.id,
      clipboard,
      Number.NaN
    ).error).toBe("POSE_BLEND_INFLUENCE_INVALID");
  });

  it("rejects absent clipboards and locked or missing characters atomically", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const clipboard = copyCharacterPose(character);

    expect(pasteProjectCharacterPose(project, character.id, null).project)
      .toBe(project);
    character.locked = true;
    expect(pasteProjectCharacterPose(project, character.id, clipboard).error)
      .toBe("POSE_CHARACTER_LOCKED");
    expect(pasteProjectCharacterPose(project, "missing", clipboard).error)
      .toBe("POSE_CHARACTER_MISSING");
  });

  it("mirrors and resets through immutable no-op-aware project commands", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.boneRotations.leftArm = [10, 20, 30];
    character.boneRotations.rightArm = [-5, 6, 7];

    const mirrored = mirrorProjectCharacterPose(project, character.id);
    expect(mirrored.changed).toBe(true);
    expect(mirrored.project.scene.characters[0].boneRotations.leftArm)
      .toEqual([-5, -6, -7]);
    expect(mirrored.project.scene.characters[0].boneRotations.rightArm)
      .toEqual([10, -20, -30]);
    expect(character.boneRotations.leftArm).toEqual([10, 20, 30]);

    const reset = resetProjectCharacterPose(mirrored.project, character.id);
    expect(reset.changed).toBe(true);
    const repeated = resetProjectCharacterPose(reset.project, character.id);
    expect(repeated.changed).toBe(false);
    expect(repeated.project).toBe(reset.project);
  });

  it("preserves a pasted pose through persistence, history, and production sampling", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.boneRotations.head = [30, 45, 15];
    const clipboard = copyCharacterPose(character);
    character.boneRotations.head = [0, 0, 0];
    const pasted = pasteProjectCharacterPose(
      project,
      character.id,
      clipboard
    ).project;

    const serialized = ProjectSerializer.parse(
      ProjectSerializer.serialize(pasted)
    );
    const packaged = PackageReader.parse(
      JSON.stringify(createMineMotionPackageData(pasted))
    );
    const schema9 = ProjectSerializer.parse(
      ProjectSerializer.serializeLegacyV9(pasted)
    );
    for (const candidate of [serialized, packaged, schema9]) {
      expect(candidate.scene.characters[0].boneRotations.head)
        .toEqual([30, 45, 15]);
    }

    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      }
    };
    saveProjectAutosave(storage, pasted);
    expect(loadProjectAutosave(storage)?.project.scene.characters[0]
      .boneRotations.head).toEqual([30, 45, 15]);

    const history = new HistoryStack<typeof project>();
    history.push(project, "Before paste");
    expect(history.undo(pasted)?.scene.characters[0].boneRotations.head)
      .toEqual([0, 0, 0]);
    expect(sampleProjectAnimationWithVfxTiming(pasted, 0)
      .scene.characters[0].boneRotations.head).toEqual([30, 45, 15]);
  });
});
