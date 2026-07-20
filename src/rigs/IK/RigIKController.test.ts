import { describe, expect, it } from "vitest";
import { HistoryStack } from "../../history/HistoryStack";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import type { MineMotionProject } from "../../project/ProjectFile";
import { createRigIKControl, type MinecraftLimbId } from "./IKControl";
import { bakeProjectRigIKControl, previewRigIKControls } from "./RigIKController";
import { createRigIKControlsForCharacter, resolveRigIKChain } from "./RigIKMapping";

const LIMBS: MinecraftLimbId[] = ["leftArm", "rightArm", "leftLeg", "rightLeg"];

function enabledControls(project = createInitialProject()) {
  return createRigIKControlsForCharacter(project.scene.characters[0]).map((control, index) => ({
    ...control,
    enabled: true,
    targetPosition: [index % 2 === 0 ? -0.35 : 0.35, -0.95, 0.45] as [number, number, number]
  }));
}

describe("production rig IK controller", () => {
  it("maps and previews every supported Steve/Alex limb deterministically", () => {
    for (const rigPreset of ["steve", "alex"] as const) {
      const project = createInitialProject();
      project.scene.characters[0].rigPreset = rigPreset;
      const controls = enabledControls(project);
      expect(controls.map((control) => control.limb)).toEqual(LIMBS);
      const first = previewRigIKControls(project, project.scene.characters[0].id, controls);
      const second = previewRigIKControls(project, project.scene.characters[0].id, controls);
      expect(JSON.stringify(second)).toBe(JSON.stringify(first));
      expect(Object.keys(first.solves)).toHaveLength(4);
      expect(first.project.animation.tracks).toEqual([]);
      for (const control of controls) {
        expect(first.solves[control.id].solved).toBe(true);
        expect(first.project.scene.characters[0].boneRotations[control.upperBoneId])
          .not.toEqual(project.scene.characters[0].boneRotations[control.upperBoneId]);
      }
    }
  });

  it("leaves the source project unchanged for disabled or stale selection", () => {
    const project = createInitialProject();
    const controls = createRigIKControlsForCharacter(project.scene.characters[0]);
    expect(previewRigIKControls(project, project.scene.characters[0].id, controls).project).toBe(project);
    const stale = previewRigIKControls(project, "missing", controls);
    expect(stale.project).toBe(project);
    expect(stale.warnings[0]).toContain("IK_CHARACTER_MISSING");
  });

  it("rejects unsupported, missing-bone, and mismatched chains without mutation", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const control = { ...enabledControls(project)[0] };
    expect(resolveRigIKChain(character, { ...control, upperBoneId: "rightArm" }).error)
      .toContain("IK_CONTROL_CHAIN_MISMATCH");

    const missingBoneProject = structuredClone(project);
    delete missingBoneProject.scene.characters[0].boneRotations[control.lowerBoneId];
    const missing = bakeProjectRigIKControl(missingBoneProject, character.id, control);
    expect(missing).toMatchObject({ ok: false, changed: false, project: missingBoneProject });
    expect(missing.error).toContain("IK_CONTROL_BONE_MISSING");

    const unsupported = structuredClone(project);
    unsupported.scene.characters[0].rigPreset = "generic_blocky";
    const result = bakeProjectRigIKControl(unsupported, character.id, control);
    expect(result.project).toBe(unsupported);
    expect(result.error).toContain("IK_RIG_UNSUPPORTED");
  });

  it("bakes exact global tracks at the current and explicit frames", () => {
    const project = createInitialProject();
    project.animation.currentFrame = 12;
    const [control] = enabledControls(project);
    const current = bakeProjectRigIKControl(project, project.scene.characters[0].id, control);
    expect(current).toMatchObject({ ok: true, changed: true, historyLabel: expect.stringContaining("frame 12") });
    expect(current.project.animation.tracks.map((track) => track.property)).toEqual([
      `bone.rotation.${control.upperBoneId}`,
      `bone.rotation.${control.lowerBoneId}`
    ]);
    expect(current.project.animation.tracks.every((track) => track.keyframes[0].frame === 12)).toBe(true);
    expect(current.project.animation.timelineTracks.find((lane) => lane.id === "track_rig_main")?.items).toHaveLength(2);

    const explicit = bakeProjectRigIKControl(current.project, project.scene.characters[0].id, {
      ...control,
      targetPosition: [0.5, -0.8, 0.3]
    }, 24);
    expect(explicit.project.animation.tracks.every((track) => track.keyframes.at(-1)?.frame === 24)).toBe(true);
  });

  it("creates exactly one history checkpoint and supports undo/redo", () => {
    const project = createInitialProject();
    const [control] = enabledControls(project);
    const history = new HistoryStack<MineMotionProject>();
    const result = bakeProjectRigIKControl(project, project.scene.characters[0].id, control, 8);
    if (result.changed) history.push(project, result.historyLabel!);
    const undone = history.undo(result.project)!;
    expect(undone.animation.tracks).toEqual([]);
    expect(history.undo(undone)).toBeNull();
    const redone = history.redo(undone)!;
    expect(redone.animation.tracks).toHaveLength(2);
    expect(history.redo(redone)).toBeNull();

    const noOp = bakeProjectRigIKControl(redone, project.scene.characters[0].id, control, 8);
    expect(noOp).toMatchObject({ ok: true, changed: false, project: redone, historyLabel: null });
  });

  it("round-trips baked keys through schema 10 and guarded schema 9", () => {
    const project = createInitialProject();
    const [control] = enabledControls(project);
    const baked = bakeProjectRigIKControl(project, project.scene.characters[0].id, control, 18).project;
    const current = ProjectSerializer.parse(ProjectSerializer.serialize(baked));
    const legacy = ProjectSerializer.parse(ProjectSerializer.serializeLegacyV9(baked));
    for (const reloaded of [current, legacy]) {
      expect(reloaded.animation.tracks.map((track) => track.property)).toEqual([
        `bone.rotation.${control.upperBoneId}`,
        `bone.rotation.${control.lowerBoneId}`
      ]);
      expect(reloaded.scene.characters[0].boneKeyframes).toHaveLength(2);
    }
  });

  it("rejects invalid frames, roots, and hostile controls without touching the project", () => {
    const project = createInitialProject();
    const [control] = enabledControls(project);
    for (const frame of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5, project.animation.durationFrames + 1]) {
      const result = bakeProjectRigIKControl(project, project.scene.characters[0].id, control, frame);
      expect(result).toMatchObject({ ok: false, changed: false, project });
      expect(result.error).toContain("IK_FRAME_INVALID");
    }
    const rootTarget = bakeProjectRigIKControl(project, project.scene.characters[0].id, {
      ...control,
      targetPosition: [0, 0, 0]
    });
    expect(rootTarget.error).toContain("IK_TARGET_DEGENERATE");

    let accessed = false;
    const hostile = Object.defineProperty({}, "limb", { get() { accessed = true; return "leftArm"; } });
    const invalid = bakeProjectRigIKControl(project, project.scene.characters[0].id, hostile as never);
    expect(invalid).toMatchObject({ ok: false, changed: false, project });
    expect(accessed).toBe(false);
  });

  it("applies partial influence without altering disabled sibling controls", () => {
    const project = createInitialProject();
    const [active, disabled] = createRigIKControlsForCharacter(project.scene.characters[0]);
    const preview = previewRigIKControls(project, project.scene.characters[0].id, [
      { ...active, enabled: true, influence: 0.5, targetPosition: [0.5, -0.8, 0.4] },
      disabled
    ]);
    expect(preview.solves[active.id].reachedTarget).toBe(false);
    expect(preview.solves[disabled.id]).toBeUndefined();
    expect(preview.project.scene.characters[0].boneRotations[disabled.upperBoneId])
      .toEqual(project.scene.characters[0].boneRotations[disabled.upperBoneId]);
  });
});

