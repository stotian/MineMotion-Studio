import { describe, expect, it } from "vitest";
import { HistoryStack } from "../../history/HistoryStack";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import type { MineMotionProject } from "../../project/ProjectFile";
import { createInitialProject } from "../../project/ProjectStore";
import { sampleFootKinematics } from "./FootKinematics";
import { bakeProjectFootLockRange } from "./FootLockBakeController";
import { createRigIKControlsForCharacter, resolveRigIKChain } from "./RigIKMapping";

describe("foot lock range bake", () => {
  it("grounds and locks one foot across an inclusive root-motion range", () => {
    const project = createInitialProject();
    project.projectSettings.terrainPreset = "flat";
    project.animation.tracks.push({
      id: "root-motion",
      targetId: project.scene.characters[0].id,
      property: "transform.position",
      keyframes: [
        { frame: 0, value: [0, 1.05, 0] },
        { frame: 4, value: [0.5, 1.05, 0] }
      ]
    });
    const result = bakeProjectFootLockRange(project, project.scene.characters[0].id, {
      limb: "leftLeg",
      startFrame: 0,
      endFrame: 4
    });
    expect(result).toMatchObject({ ok: true, changed: true, error: null });
    expect(result.anchor?.worldPosition).toEqual([-0.2, 2, 0]);
    expect(result.samples).toHaveLength(5);
    const legTracks = result.project.animation.tracks.filter((track) =>
      track.property === "bone.rotation.leftLeg" ||
      track.property === "bone.rotation.leftLowerLeg"
    );
    expect(legTracks).toHaveLength(2);
    expect(legTracks.every((track) => track.keyframes.map((keyframe) => keyframe.frame).join() === "0,1,2,3,4"))
      .toBe(true);

    const character = result.project.scene.characters[0];
    const control = createRigIKControlsForCharacter(character).find((entry) => entry.limb === "leftLeg")!;
    const chain = resolveRigIKChain(character, control).chain!;
    for (let frame = 0; frame <= 4; frame += 1) {
      const sample = sampleFootKinematics(result.project, character.id, control, chain, frame);
      expect(sample.ok).toBe(true);
      expect(sample.sample!.worldPosition[0]).toBeCloseTo(-0.2, 5);
      expect(sample.sample!.worldPosition[1]).toBeCloseTo(2, 5);
      expect(sample.sample!.worldPosition[2]).toBeCloseTo(0, 5);
    }
    expect(project.animation.tracks).toHaveLength(1);
  });

  it("is atomic for history, no-op rebakes, and serialization", () => {
    const project = createInitialProject();
    project.projectSettings.terrainPreset = "flat";
    const result = bakeProjectFootLockRange(project, project.scene.characters[0].id, {
      limb: "rightLeg",
      startFrame: 6,
      endFrame: 8
    });
    const history = new HistoryStack<MineMotionProject>();
    if (result.changed) history.push(project, result.historyLabel!);
    const undone = history.undo(result.project)!;
    expect(undone.animation.tracks).toEqual([]);
    expect(history.undo(undone)).toBeNull();
    expect(history.redo(undone)?.animation.tracks).toHaveLength(2);

    const repeated = bakeProjectFootLockRange(result.project, project.scene.characters[0].id, {
      limb: "rightLeg",
      startFrame: 6,
      endFrame: 8
    });
    expect(repeated).toMatchObject({ ok: true, changed: false, project: result.project, historyLabel: null });

    const reloaded = ProjectSerializer.parse(ProjectSerializer.serialize(result.project));
    expect(reloaded.animation.tracks.map((track) => track.property)).toEqual([
      "bone.rotation.rightLeg",
      "bone.rotation.rightLowerLeg"
    ]);
  });

  it("rejects missing ground, invalid ranges, locked characters, and unreachable motion without partial keys", () => {
    const project = createInitialProject();
    project.projectSettings.terrainPreset = "none";
    expect(bakeProjectFootLockRange(project, project.scene.characters[0].id, {
      limb: "leftLeg",
      startFrame: 0,
      endFrame: 2
    })).toMatchObject({ ok: false, changed: false, project, historyLabel: null });

    project.projectSettings.terrainPreset = "flat";
    expect(bakeProjectFootLockRange(project, project.scene.characters[0].id, {
      limb: "leftLeg",
      startFrame: -1,
      endFrame: 2
    }).error).toContain("FOOT_LOCK_RANGE_INVALID");
    project.scene.characters[0].locked = true;
    expect(bakeProjectFootLockRange(project, project.scene.characters[0].id, {
      limb: "leftLeg",
      startFrame: 0,
      endFrame: 2
    }).error).toContain("FOOT_LOCK_CHARACTER_LOCKED");

    const moving = createInitialProject();
    moving.projectSettings.terrainPreset = "flat";
    moving.animation.tracks.push({
      id: "unreachable-root-motion",
      targetId: moving.scene.characters[0].id,
      property: "transform.position",
      keyframes: [
        { frame: 0, value: [0, 1.05, 0] },
        { frame: 2, value: [20, 1.05, 0] }
      ]
    });
    const unreachable = bakeProjectFootLockRange(moving, moving.scene.characters[0].id, {
      limb: "leftLeg",
      startFrame: 0,
      endFrame: 2
    });
    expect(unreachable).toMatchObject({ ok: false, changed: false, project: moving });
    expect(unreachable.error).toContain("FOOT_LOCK_UNREACHABLE");
    expect(moving.animation.tracks).toHaveLength(1);
  });
});
