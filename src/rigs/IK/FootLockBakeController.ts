import { createProjectGroundSampler } from "../../minecraft/GroundSampler";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import type { MineMotionProject } from "../../project/ProjectFile";
import { bakeRigIKControl } from "./IKBakeController";
import {
  createFootLockAnchor,
  type FootLockAnchor,
  type FootLockFrameSample,
  type FootLockLimb,
  sampleFootLockFrame
} from "./FootLock";
import {
  sampleFootKinematics,
  worldTargetToFootIKPosition
} from "./FootKinematics";
import { createRigIKControlsForCharacter, resolveRigIKChain } from "./RigIKMapping";

export interface RigFootLockBakeRequest {
  limb: FootLockLimb;
  startFrame: number;
  endFrame: number;
  groundOffset?: number;
}

export interface RigFootLockBakeResult {
  ok: boolean;
  changed: boolean;
  project: MineMotionProject;
  anchor: FootLockAnchor | null;
  samples: readonly FootLockFrameSample[];
  warnings: readonly string[];
  error: string | null;
  historyLabel: string | null;
}

export function bakeProjectFootLockRange(
  project: MineMotionProject,
  characterId: string,
  request: RigFootLockBakeRequest
): RigFootLockBakeResult {
  if (!Number.isInteger(request.startFrame) ||
    !Number.isInteger(request.endFrame) ||
    request.startFrame < 0 ||
    request.endFrame > project.animation.durationFrames) {
    return failure(project, "FOOT_LOCK_RANGE_INVALID: Bake range must stay inside the project timeline.");
  }
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  if (!character) return failure(project, "FOOT_LOCK_CHARACTER_MISSING: The target character does not exist.");
  if (character.locked) return failure(project, "FOOT_LOCK_CHARACTER_LOCKED: Unlock the character before baking.");
  const control = createRigIKControlsForCharacter(character).find((entry) => entry.limb === request.limb);
  if (!control) return failure(project, "FOOT_LOCK_RIG_UNSUPPORTED: Foot lock currently supports Steve and Alex rigs.");
  const mapping = resolveRigIKChain(character, control);
  if (!mapping.ok || !mapping.chain) {
    return failure(project, mapping.error ?? "FOOT_LOCK_CHAIN_INVALID: The leg chain is invalid.");
  }

  const startKinematics = sampleFootKinematics(
    project,
    characterId,
    control,
    mapping.chain,
    request.startFrame
  );
  if (!startKinematics.ok) return failure(project, startKinematics.error);
  const ground = createProjectGroundSampler(project).sample(startKinematics.sample.worldPosition);
  const anchorResult = createFootLockAnchor(
    request.limb,
    request.startFrame,
    request.endFrame,
    startKinematics.sample.worldPosition,
    ground,
    request.groundOffset
  );
  if (!anchorResult.ok || !anchorResult.anchor) {
    return failure(project, anchorResult.error ?? "FOOT_LOCK_ANCHOR_INVALID: Foot lock anchor is invalid.");
  }

  const anchor = anchorResult.anchor;
  const samples: FootLockFrameSample[] = [];
  const warnings: string[] = [];
  let next = project;
  for (let frame = anchor.startFrame; frame <= anchor.endFrame; frame += 1) {
    const kinematics = sampleFootKinematics(project, characterId, control, mapping.chain, frame);
    if (!kinematics.ok) return failure(project, kinematics.error, anchor, samples, warnings);
    const sample = sampleFootLockFrame(anchor, frame, kinematics.sample.worldPosition);
    const targetPosition = worldTargetToFootIKPosition(
      kinematics.sample,
      sample.targetWorldPosition
    );
    if (!targetPosition) {
      return failure(
        project,
        `FOOT_LOCK_TARGET_INVALID: Could not transform the world anchor at frame ${frame}.`,
        anchor,
        samples,
        warnings
      );
    }
    const baked = bakeRigIKControl(next, characterId, {
      ...control,
      enabled: true,
      influence: 1,
      targetPosition
    }, mapping.chain, frame);
    if (!baked.ok || !baked.solve?.solved || !baked.solve.reachedTarget) {
      return failure(
        project,
        `FOOT_LOCK_UNREACHABLE: The planted target cannot be reached at frame ${frame}.`,
        anchor,
        samples,
        [...warnings, ...(baked.solve?.warnings ?? [])]
      );
    }
    next = baked.project;
    samples.push(sample);
    warnings.push(...baked.solve.warnings);
  }

  const synchronized = syncCinematicTimeline(next);
  if (JSON.stringify(synchronized) === JSON.stringify(project)) {
    return {
      ok: true,
      changed: false,
      project,
      anchor,
      samples,
      warnings: [...new Set(warnings)],
      error: null,
      historyLabel: null
    };
  }
  return {
    ok: true,
    changed: true,
    project: synchronized,
    anchor,
    samples,
    warnings: [...new Set(warnings)],
    error: null,
    historyLabel: `Bake ${request.limb === "leftLeg" ? "Left Foot" : "Right Foot"} lock frames ${anchor.startFrame}-${anchor.endFrame}`
  };
}

function failure(
  project: MineMotionProject,
  error: string,
  anchor: FootLockAnchor | null = null,
  samples: readonly FootLockFrameSample[] = [],
  warnings: readonly string[] = []
): RigFootLockBakeResult {
  return {
    ok: false,
    changed: false,
    project,
    anchor,
    samples,
    warnings: [...new Set(warnings)],
    error,
    historyLabel: null
  };
}
