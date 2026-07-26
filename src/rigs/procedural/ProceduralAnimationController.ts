import { applyAnimationClip } from "../../animation/editor/ClipSystem";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import type { MineMotionProject } from "../../project/ProjectFile";
import {
  generateProceduralAnimation,
  type ProceduralAnimationSettings
} from "./ProceduralAnimation";

export interface ProceduralAnimationBakeResult {
  project: MineMotionProject;
  changed: boolean;
  clipId: string | null;
  historyLabel: string | null;
  error: string | null;
}

export function bakeProceduralAnimation(
  project: MineMotionProject,
  targetId: string,
  settings: unknown
): ProceduralAnimationBakeResult {
  const character = project.scene.characters.find((entry) => entry.id === targetId);
  if (!character) {
    return failure(
      project,
      "PROCEDURAL_ANIMATION_TARGET_MISSING: Select a character before generating animation."
    );
  }
  if (character.locked) {
    return failure(
      project,
      "PROCEDURAL_ANIMATION_TARGET_LOCKED: Unlock the character before generating animation."
    );
  }
  const generated = generateProceduralAnimation(settings);
  if (!generated.ok) return failure(project, generated.error);
  const endFrame = project.animation.currentFrame + generated.clip.durationFrames;
  if (!Number.isSafeInteger(endFrame) || endFrame > 10_000_000) {
    return failure(
      project,
      "PROCEDURAL_ANIMATION_RANGE_INVALID: Generated animation exceeds the timeline limit."
    );
  }
  const clips = upsertGeneratedClip(
    project.animation.clips,
    generated.clip
  );
  const tracks = applyAnimationClip(
    project.animation.tracks,
    generated.clip,
    targetId,
    project.animation.currentFrame
  );
  const next = syncCinematicTimeline({
    ...project,
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
    clipId: generated.clip.id,
    historyLabel: `Generate ${generated.settings.kind} animation`,
    error: null
  };
}

function upsertGeneratedClip(
  clips: MineMotionProject["animation"]["clips"],
  clip: MineMotionProject["animation"]["clips"][number]
): MineMotionProject["animation"]["clips"] {
  const index = clips.findIndex((entry) => entry.id === clip.id);
  if (index < 0) return [...clips, clip];
  return clips.map((entry) => entry.id === clip.id ? clip : entry);
}

function failure(
  project: MineMotionProject,
  error: string
): ProceduralAnimationBakeResult {
  return {
    project,
    changed: false,
    clipId: null,
    historyLabel: null,
    error
  };
}

export type { ProceduralAnimationSettings };
