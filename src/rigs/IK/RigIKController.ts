import type { MineMotionProject } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { updateProjectBoneRotation } from "../RigController";
import { bakeRigIKControl, type RigIKBakeResult } from "./IKBakeController";
import { sanitizeRigIKControls, type RigIKControl } from "./IKControl";
import { resolveRigIKChain } from "./RigIKMapping";
import type { IKSolveResult } from "./IKTypes";
import { solveTwoBoneIK } from "./TwoBoneIK";

export interface RigIKPreviewResult {
  project: MineMotionProject;
  solves: Readonly<Record<string, IKSolveResult>>;
  warnings: readonly string[];
}

export interface RigIKCommandResult extends RigIKBakeResult {
  historyLabel: string | null;
}

export function previewRigIKControls(
  project: MineMotionProject,
  characterId: string | null,
  controls: unknown
): RigIKPreviewResult {
  if (!characterId) return { project, solves: {}, warnings: [] };
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  if (!character) return { project, solves: {}, warnings: ["IK_CHARACTER_MISSING: The selected character no longer exists."] };
  const safeControls = sanitizeRigIKControls(controls);
  const solves: Record<string, IKSolveResult> = {};
  const warnings: string[] = [];
  let preview = project;
  for (const control of safeControls) {
    if (!control.enabled) continue;
    const mapping = resolveRigIKChain(character, control);
    if (!mapping.ok || !mapping.chain) {
      warnings.push(mapping.error ?? "IK_CHAIN_INVALID: The limb chain is invalid.");
      continue;
    }
    const solve = solveTwoBoneIK(mapping.chain, {
      id: control.id,
      label: control.targetLabel,
      position: control.targetPosition
    }, {
      poleDirection: control.poleDirection,
      influence: control.influence
    });
    solves[control.id] = solve;
    warnings.push(...solve.warnings);
    if (!solve.solved) continue;
    preview = updateProjectBoneRotation(preview, characterId, control.upperBoneId, solve.rotations[control.upperBoneId]);
    preview = updateProjectBoneRotation(preview, characterId, control.lowerBoneId, solve.rotations[control.lowerBoneId]);
  }
  return { project: preview, solves, warnings: [...new Set(warnings)] };
}

export function bakeProjectRigIKControl(
  project: MineMotionProject,
  characterId: string,
  control: RigIKControl,
  frame = project.animation.currentFrame
): RigIKCommandResult {
  if (!Number.isFinite(frame) || !Number.isInteger(frame) || frame < 0 || frame > project.animation.durationFrames) {
    return { ...failure(project, "IK_FRAME_INVALID: Bake frame must be an integer inside the project range."), historyLabel: null };
  }
  const safeControl = sanitizeRigIKControls([control])[0];
  if (!safeControl) {
    return { ...failure(project, "IK_CONTROL_INVALID: The IK control contains invalid or unsafe data."), historyLabel: null };
  }
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  if (!character) {
    return { ...failure(project, "IK_CHARACTER_MISSING: The target character does not exist."), historyLabel: null };
  }
  if (character.locked) {
    return { ...failure(project, "IK_CHARACTER_LOCKED: Unlock the character before baking IK."), historyLabel: null };
  }
  const mapping = resolveRigIKChain(character, safeControl);
  if (!mapping.ok || !mapping.chain) {
    return { ...failure(project, mapping.error ?? "IK_CHAIN_INVALID: The limb chain is invalid."), historyLabel: null };
  }
  const baked = bakeRigIKControl(project, characterId, safeControl, mapping.chain, frame);
  if (!baked.ok || !baked.changed) return { ...baked, historyLabel: null };
  return {
    ...baked,
    project: syncCinematicTimeline(baked.project),
    historyLabel: `Bake ${safeControl.targetLabel} IK at frame ${frame}`
  };
}

function failure(project: MineMotionProject, error: string): RigIKBakeResult {
  return { ok: false, changed: false, project, solve: null, error };
}
