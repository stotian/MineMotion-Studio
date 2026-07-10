import type { AnimationTrack, MineMotionProject, Vector3Tuple } from "../project/ProjectFile";
import { findObject } from "../project/ProjectStore";
import {
  applyRigAnimationPreset,
  RIG_ANIMATION_PRESETS
} from "../rigs/AnimationPresetLibrary";

export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  targetTypes: Array<"character" | "camera">;
  apply: (project: MineMotionProject, targetId: string) => MineMotionProject;
}

function vectorTrack(
  targetId: string,
  property: AnimationTrack["property"],
  keyframes: Array<[number, Vector3Tuple]>
): AnimationTrack {
  return {
    id: `${targetId}:${property}:${Date.now().toString(36)}`,
    targetId,
    property,
    keyframes: keyframes.map(([frame, value]) => ({
      frame,
      value: [...value]
    }))
  };
}

const RIG_PRESETS: AnimationPreset[] = RIG_ANIMATION_PRESETS.map((preset) => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
  targetTypes: ["character"],
  apply(project, targetId) {
    return applyRigAnimationPreset(project, targetId, preset.id);
  }
}));

export const ANIMATION_PRESETS: AnimationPreset[] = [
  ...RIG_PRESETS,
  {
    id: "simple-walk-cycle",
    name: "Simple Walk Travel",
    description: "Moves a character forward while the rig walk preset handles limbs.",
    targetTypes: ["character"],
    apply(project, targetId) {
      const lookup = findObject(project, targetId);
      if (!lookup || lookup.entity.type !== "character") return project;
      const start = lookup.entity.transform.position;
      return {
        ...project,
        animation: {
          ...project.animation,
          durationFrames: Math.max(project.animation.durationFrames, 48),
          tracks: [
            ...project.animation.tracks,
            vectorTrack(targetId, "transform.position", [
              [project.animation.currentFrame, start],
              [project.animation.currentFrame + 24, [start[0] + 1.5, start[1], start[2]]],
              [project.animation.currentFrame + 48, [start[0] + 3, start[1], start[2]]]
            ])
          ]
        }
      };
    }
  },
  {
    id: "camera-push-in",
    name: "Camera Push-In",
    description: "Moves a camera forward over 96 frames.",
    targetTypes: ["camera"],
    apply(project, targetId) {
      const lookup = findObject(project, targetId);
      if (!lookup || lookup.entity.type !== "camera") return project;
      const start = lookup.entity.transform.position;
      const frame = project.animation.currentFrame;
      return {
        ...project,
        animation: {
          ...project.animation,
          durationFrames: Math.max(project.animation.durationFrames, frame + 96),
          tracks: [
            ...project.animation.tracks,
            vectorTrack(targetId, "transform.position", [
              [frame, start],
              [frame + 96, [start[0] * 0.55, start[1] * 0.85, start[2] * 0.55]]
            ])
          ]
        }
      };
    }
  },
  {
    id: "camera-orbit",
    name: "Camera Orbit",
    description: "Simple camera orbit placeholder around the origin.",
    targetTypes: ["camera"],
    apply(project, targetId) {
      const frame = project.animation.currentFrame;
      return {
        ...project,
        animation: {
          ...project.animation,
          durationFrames: Math.max(project.animation.durationFrames, frame + 120),
          tracks: [
            ...project.animation.tracks,
            vectorTrack(targetId, "transform.position", [
              [frame, [9, 5, 0]],
              [frame + 60, [0, 5, 9]],
              [frame + 120, [-9, 5, 0]]
            ]),
            vectorTrack(targetId, "transform.rotation", [
              [frame, [-18, 90, 0]],
              [frame + 60, [-18, 180, 0]],
              [frame + 120, [-18, 270, 0]]
            ])
          ]
        }
      };
    }
  }
];
