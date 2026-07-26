import { applyAnimationClip } from "../../animation/editor/ClipSystem";
import { createDeterministicId } from "../../core/ids/Id";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import type {
  MineMotionProject,
  ReusableAnimationClip
} from "../../project/ProjectFile";
import { getRigDefinition } from "../MinecraftRigPresets";
import type {
  BlockbenchBoneMappingOverride,
  BlockbenchModelAsset,
  RigPresetId
} from "../RigTypes";
import {
  convertBlockbenchAnimation,
  listBlockbenchAnimations,
  type BlockbenchAnimationOption
} from "./BlockbenchAnimationConverter";
import { BbmodelParser } from "./BbmodelParser";
import {
  resolveBlockbenchBoneMappings,
  type BlockbenchBoneMappingReport
} from "./BlockbenchMapping";

export interface BlockbenchMappingView {
  report: BlockbenchBoneMappingReport | null;
  animations: BlockbenchAnimationOption[];
  error: string | null;
}

export interface BlockbenchProjectCommandResult {
  project: MineMotionProject;
  changed: boolean;
  historyLabel: string | null;
  warnings: string[];
  error: string | null;
}

export function inspectBlockbenchMapping(
  asset: BlockbenchModelAsset,
  rigPresetId: RigPresetId
): BlockbenchMappingView {
  try {
    const model = BbmodelParser.parse(asset.rawJson);
    return {
      report: resolveBlockbenchBoneMappings(
        model,
        getRigDefinition(rigPresetId),
        asset.boneMappings
      ),
      animations: listBlockbenchAnimations(model),
      error: null
    };
  } catch {
    return {
      report: null,
      animations: [],
      error:
        "BLOCKBENCH_MAPPING_SOURCE_INVALID: The Blockbench source cannot be mapped."
    };
  }
}

export function setBlockbenchBoneMapping(
  project: MineMotionProject,
  assetId: string,
  rigPresetId: RigPresetId,
  sourceGroupId: string,
  targetBoneId: string | null | undefined
): BlockbenchProjectCommandResult {
  const asset = project.assets.blockbench.find((entry) => entry.id === assetId);
  if (!asset) {
    return failure(
      project,
      "BLOCKBENCH_MAPPING_ASSET_MISSING: The Blockbench asset does not exist."
    );
  }
  let model;
  try {
    model = BbmodelParser.parse(asset.rawJson);
  } catch {
    return failure(
      project,
      "BLOCKBENCH_MAPPING_SOURCE_INVALID: The Blockbench source cannot be mapped."
    );
  }
  const definition = getRigDefinition(rigPresetId);
  const report = resolveBlockbenchBoneMappings(
    model,
    definition,
    asset.boneMappings
  );
  if (!report.entries.some((entry) => entry.sourceGroupId === sourceGroupId)) {
    return failure(
      project,
      "BLOCKBENCH_MAPPING_GROUP_MISSING: The source group does not exist."
    );
  }
  if (targetBoneId !== null &&
    targetBoneId !== undefined &&
    !definition.bones.some((bone) => bone.id === targetBoneId)) {
    return failure(
      project,
      "BLOCKBENCH_MAPPING_BONE_MISSING: The target rig bone does not exist."
    );
  }
  const normalizedPresetId = definition.id;
  const existing = asset.boneMappings ?? [];
  if (targetBoneId && existing.some((entry) =>
    entry.rigPresetId === normalizedPresetId &&
    entry.sourceGroupId !== sourceGroupId &&
    entry.targetBoneId === targetBoneId)) {
    return failure(
      project,
      "BLOCKBENCH_MAPPING_TARGET_CONFLICT: A manual mapping already uses this target bone."
    );
  }
  const nextMappings = existing.filter((entry) =>
    entry.rigPresetId !== normalizedPresetId ||
    entry.sourceGroupId !== sourceGroupId
  );
  if (targetBoneId !== undefined) {
    nextMappings.push({
      rigPresetId: normalizedPresetId,
      sourceGroupId,
      targetBoneId
    });
  }
  if (sameMappings(existing, nextMappings)) {
    return failure(project, "BLOCKBENCH_MAPPING_UNCHANGED");
  }
  const updatedAsset: BlockbenchModelAsset = {
    ...asset,
    boneMappings: nextMappings
  };
  return {
    project: replaceBlockbenchAsset(project, updatedAsset),
    changed: true,
    historyLabel: "Map Blockbench bone",
    warnings: [],
    error: null
  };
}

export function bakeBlockbenchAnimation(
  project: MineMotionProject,
  assetId: string,
  characterId: string,
  animationId: string
): BlockbenchProjectCommandResult {
  const asset = project.assets.blockbench.find((entry) => entry.id === assetId);
  const character = project.scene.characters.find(
    (entry) => entry.id === characterId
  );
  if (!asset) {
    return failure(
      project,
      "BLOCKBENCH_ANIMATION_ASSET_MISSING: The Blockbench asset does not exist."
    );
  }
  if (!character) {
    return failure(
      project,
      "BLOCKBENCH_ANIMATION_TARGET_MISSING: Select a character before applying a clip."
    );
  }
  if (character.locked) {
    return failure(
      project,
      "BLOCKBENCH_ANIMATION_TARGET_LOCKED: Unlock the character before applying a clip."
    );
  }
  let model;
  try {
    model = BbmodelParser.parse(asset.rawJson);
  } catch {
    return failure(
      project,
      "BLOCKBENCH_MAPPING_SOURCE_INVALID: The Blockbench source cannot be mapped."
    );
  }
  const mapping = resolveBlockbenchBoneMappings(
    model,
    getRigDefinition(character.rigPreset),
    asset.boneMappings
  );
  const converted = convertBlockbenchAnimation(
    model,
    mapping,
    animationId,
    project.animation.fps,
    asset.id,
    asset.importedAt
  );
  if (!converted.clip) {
    return failure(
      project,
      converted.error ?? "BLOCKBENCH_ANIMATION_CONVERSION_FAILED",
      converted.warnings
    );
  }
  const endFrame = project.animation.currentFrame +
    converted.clip.durationFrames;
  if (!Number.isSafeInteger(endFrame) || endFrame > 10_000_000) {
    return failure(
      project,
      "BLOCKBENCH_ANIMATION_RANGE_INVALID: Imported clip exceeds the timeline limit.",
      converted.warnings
    );
  }
  const clips = upsertClip(project.animation.clips, converted.clip);
  const tracks = makeAppliedKeyIdsDeterministic(
    applyAnimationClip(
      project.animation.tracks,
      converted.clip,
      character.id,
      project.animation.currentFrame
    ),
    converted.clip,
    character.id,
    project.animation.currentFrame
  );
  if (JSON.stringify(clips) === JSON.stringify(project.animation.clips) &&
    JSON.stringify(tracks) === JSON.stringify(project.animation.tracks)) {
    return failure(
      project,
      "BLOCKBENCH_ANIMATION_UNCHANGED",
      converted.warnings
    );
  }
  const next = syncCinematicTimeline({
    ...project,
    projectSettings: {
      ...project.projectSettings,
      durationFrames: Math.max(
        project.projectSettings.durationFrames,
        endFrame
      )
    },
    animation: {
      ...project.animation,
      durationFrames: Math.max(project.animation.durationFrames, endFrame),
      clips,
      tracks
    }
  });
  return {
    project: next,
    changed: true,
    historyLabel: "Apply Blockbench animation",
    warnings: converted.warnings,
    error: null
  };
}

function replaceBlockbenchAsset(
  project: MineMotionProject,
  asset: BlockbenchModelAsset
): MineMotionProject {
  const authoritative = project.assets.blockbench.map((entry) =>
    entry.id === asset.id ? asset : entry
  );
  const compatibility = project.rigs.blockbenchModels.some(
    (entry) => entry.id === asset.id
  )
    ? project.rigs.blockbenchModels.map((entry) =>
        entry.id === asset.id ? asset : entry
      )
    : [...project.rigs.blockbenchModels, asset];
  return {
    ...project,
    assets: {
      ...project.assets,
      blockbench: authoritative
    },
    rigs: {
      ...project.rigs,
      blockbenchModels: compatibility
    }
  };
}

function upsertClip(
  clips: readonly ReusableAnimationClip[],
  clip: ReusableAnimationClip
): ReusableAnimationClip[] {
  const index = clips.findIndex((entry) => entry.id === clip.id);
  return index < 0
    ? [...clips, clip]
    : clips.map((entry) => entry.id === clip.id ? clip : entry);
}

function makeAppliedKeyIdsDeterministic(
  tracks: MineMotionProject["animation"]["tracks"],
  clip: ReusableAnimationClip,
  targetId: string,
  startFrame: number
): MineMotionProject["animation"]["tracks"] {
  const framesByProperty = new Map(
    clip.tracks.map((track) => [
      track.property,
      new Set(track.keyframes.map((keyframe) =>
        Math.max(0, Math.round(startFrame + keyframe.frame))
      ))
    ])
  );
  return tracks.map((track) => {
    if (track.targetId !== targetId) return track;
    const importedFrames = framesByProperty.get(track.property);
    if (!importedFrames) return track;
    return {
      ...track,
      keyframes: track.keyframes.map((keyframe) =>
        importedFrames.has(keyframe.frame)
          ? {
              ...keyframe,
              id: createDeterministicId(
                "blockbench_key",
                `${clip.id}:${targetId}:${track.property}:${keyframe.frame}`
              )
            }
          : keyframe
      )
    };
  });
}

function sameMappings(
  left: readonly BlockbenchBoneMappingOverride[],
  right: readonly BlockbenchBoneMappingOverride[]
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function failure(
  project: MineMotionProject,
  error: string,
  warnings: string[] = []
): BlockbenchProjectCommandResult {
  return {
    project,
    changed: false,
    historyLabel: null,
    warnings,
    error
  };
}
