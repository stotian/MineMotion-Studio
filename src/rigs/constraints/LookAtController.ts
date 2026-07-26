import { sampleProjectWithAnimationLayers } from "../../animation/layers/ProjectAnimationLayerEvaluator";
import { addTransformRotationKeyframe } from "../../animation/Timeline";
import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { findObject, updateObjectTransform } from "../../project/ProjectStore";
import {
  addBoneRotationKeyframe,
  updateProjectBoneRotation
} from "../RigController";
import type { LookAtSolveResult } from "./LookAtConstraint";
import { solveLookAtConstraint } from "./LookAtConstraint";
import {
  sanitizeLookAtControl,
  type LookAtControl
} from "./LookAtControl";
import {
  mapProjectLookAtControl,
  type LookAtMappedSubject
} from "./LookAtMapping";

export interface LookAtPreviewResult {
  project: MineMotionProject;
  solve: LookAtSolveResult | null;
  warnings: readonly string[];
}

export interface LookAtCommandResult {
  ok: boolean;
  changed: boolean;
  project: MineMotionProject;
  solve: LookAtSolveResult | null;
  error: string | null;
  historyLabel: string | null;
}

export function previewProjectLookAt(
  project: MineMotionProject,
  control: unknown
): LookAtPreviewResult {
  const safeControl = sanitizeLookAtControl(control);
  if (!safeControl) {
    return {
      project,
      solve: null,
      warnings: ["LOOK_AT_CONTROL_INVALID: The session control is invalid."]
    };
  }
  if (!safeControl.enabled) return { project, solve: null, warnings: [] };
  const mapped = mapProjectLookAtControl(project, safeControl);
  if (!mapped.ok || !mapped.mapping) {
    return { project, solve: null, warnings: [mapped.error] };
  }
  const solve = solveLookAtConstraint(mapped.mapping.solveInput);
  if (!solve.solved || !solve.rotation) {
    return { project, solve, warnings: solve.warnings };
  }
  return {
    project: applyLookAtRotation(project, mapped.mapping, solve.rotation),
    solve,
    warnings: solve.warnings
  };
}

export function bakeProjectLookAt(
  project: MineMotionProject,
  control: LookAtControl,
  frame = project.animation.currentFrame
): LookAtCommandResult {
  if (!Number.isInteger(frame) || frame < 0 || frame > project.animation.durationFrames) {
    return failure(project, "LOOK_AT_FRAME_INVALID: Bake frame must be an integer inside the project range.");
  }
  const safeControl = sanitizeLookAtControl(control);
  if (!safeControl) {
    return failure(project, "LOOK_AT_CONTROL_INVALID: The session control is invalid.");
  }
  if (!safeControl.enabled) {
    return failure(project, "LOOK_AT_CONTROL_DISABLED: Enable the constraint before baking.");
  }
  const subject = findObject(project, safeControl.subject.id);
  if (!subject) {
    return failure(project, "LOOK_AT_SUBJECT_MISSING: The subject no longer exists.");
  }
  if (subject.entity.locked) {
    return failure(project, "LOOK_AT_SUBJECT_LOCKED: Unlock the subject before baking.");
  }

  const sampled = sampleProjectWithAnimationLayers(project, frame).project;
  const mapped = mapProjectLookAtControl(sampled, safeControl);
  if (!mapped.ok || !mapped.mapping) return failure(project, mapped.error);
  const solve = solveLookAtConstraint(mapped.mapping.solveInput);
  if (!solve.solved || !solve.rotation) {
    return failure(
      project,
      solve.warnings[0] ?? "LOOK_AT_SOLVE_FAILED: The constraint could not be solved.",
      solve
    );
  }
  if (hasExactBakedRotation(project, mapped.mapping, solve.rotation, frame)) {
    return {
      ok: true,
      changed: false,
      project,
      solve,
      error: null,
      historyLabel: null
    };
  }

  let next = applyLookAtRotation(project, mapped.mapping, solve.rotation);
  next = mapped.mapping.kind === "head"
    ? addBoneRotationKeyframe(next, mapped.mapping.id, "head", frame)
    : addTransformRotationKeyframe(next, mapped.mapping.id, frame);
  next = syncCinematicTimeline(next);
  return {
    ok: true,
    changed: true,
    project: next,
    solve,
    error: null,
    historyLabel: `Bake ${subjectLabel(mapped.mapping.kind)} look-at at frame ${frame}`
  };
}

function applyLookAtRotation(
  project: MineMotionProject,
  mapping: LookAtMappedSubject,
  rotation: Vector3Tuple
): MineMotionProject {
  if (mapping.kind === "head") {
    return updateProjectBoneRotation(project, mapping.id, "head", rotation);
  }
  const lookup = findObject(project, mapping.id);
  if (!lookup) return project;
  return updateObjectTransform(project, mapping.id, {
    ...lookup.entity.transform,
    rotation: [...rotation]
  });
}

function hasExactBakedRotation(
  project: MineMotionProject,
  mapping: LookAtMappedSubject,
  rotation: Vector3Tuple,
  frame: number
): boolean {
  const property = mapping.kind === "head"
    ? "bone.rotation.head"
    : "transform.rotation";
  const track = project.animation.tracks.find((entry) =>
    entry.targetId === mapping.id && entry.property === property
  );
  const globalKey = track?.keyframes.find((keyframe) => keyframe.frame === frame);
  if (!globalKey || !sameVector(globalKey.value, rotation)) return false;
  if (mapping.kind !== "head") {
    const lookup = findObject(project, mapping.id);
    return Boolean(lookup && sameVector(lookup.entity.transform.rotation, rotation));
  }
  const character = project.scene.characters.find((entry) => entry.id === mapping.id);
  const legacyTrack = character?.boneKeyframes?.find((entry) => entry.boneId === "head");
  const legacyKey = legacyTrack?.keyframes.find((keyframe) => keyframe.frame === frame);
  return Boolean(
    character &&
    sameVector(character.boneRotations.head, rotation) &&
    legacyKey &&
    sameVector(legacyKey.rotation, rotation)
  );
}

function sameVector(left: Vector3Tuple | undefined, right: Vector3Tuple): boolean {
  return Boolean(left && left.every((component, index) =>
    Math.abs(component - right[index]) <= 1e-9
  ));
}

function subjectLabel(kind: LookAtMappedSubject["kind"]): string {
  if (kind === "head") return "head";
  if (kind === "camera") return "camera";
  return "object";
}

function failure(
  project: MineMotionProject,
  error: string,
  solve: LookAtSolveResult | null = null
): LookAtCommandResult {
  return {
    ok: false,
    changed: false,
    project,
    solve,
    error,
    historyLabel: null
  };
}
