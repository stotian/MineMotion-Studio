import type { AnimationTrack, MineMotionProject, Vector3Tuple } from "../project/ProjectFile";
import { findObject } from "../project/ProjectStore";

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

export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: "simple-walk-cycle",
    name: "Simple walk cycle",
    description: "Placeholder character travel over 48 frames.",
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
              [0, start],
              [24, [start[0] + 1.5, start[1], start[2]]],
              [48, [start[0] + 3, start[1], start[2]]]
            ])
          ]
        }
      };
    }
  },
  {
    id: "camera-push-in",
    name: "Camera push-in",
    description: "Moves a camera forward over 96 frames.",
    targetTypes: ["camera"],
    apply(project, targetId) {
      const lookup = findObject(project, targetId);
      if (!lookup || lookup.entity.type !== "camera") return project;
      const start = lookup.entity.transform.position;
      return {
        ...project,
        animation: {
          ...project.animation,
          durationFrames: Math.max(project.animation.durationFrames, 96),
          tracks: [
            ...project.animation.tracks,
            vectorTrack(targetId, "transform.position", [
              [0, start],
              [96, [start[0] * 0.55, start[1] * 0.85, start[2] * 0.55]]
            ])
          ]
        }
      };
    }
  },
  {
    id: "camera-orbit",
    name: "Camera orbit",
    description: "Simple camera orbit placeholder around the origin.",
    targetTypes: ["camera"],
    apply(project, targetId) {
      return {
        ...project,
        animation: {
          ...project.animation,
          durationFrames: Math.max(project.animation.durationFrames, 120),
          tracks: [
            ...project.animation.tracks,
            vectorTrack(targetId, "transform.position", [
              [0, [9, 5, 0]],
              [60, [0, 5, 9]],
              [120, [-9, 5, 0]]
            ]),
            vectorTrack(targetId, "transform.rotation", [
              [0, [-18, 90, 0]],
              [60, [-18, 180, 0]],
              [120, [-18, 270, 0]]
            ])
          ]
        }
      };
    }
  },
  {
    id: "head-look-around",
    name: "Head look around",
    description: "Global rotation placeholder until per-bone tracks are wired.",
    targetTypes: ["character"],
    apply(project, targetId) {
      const lookup = findObject(project, targetId);
      if (!lookup || lookup.entity.type !== "character") return project;
      const rotation = lookup.entity.transform.rotation;
      return {
        ...project,
        animation: {
          ...project.animation,
          durationFrames: Math.max(project.animation.durationFrames, 72),
          tracks: [
            ...project.animation.tracks,
            vectorTrack(targetId, "transform.rotation", [
              [0, rotation],
              [36, [rotation[0], rotation[1] + 30, rotation[2]]],
              [72, [rotation[0], rotation[1] - 30, rotation[2]]]
            ])
          ]
        }
      };
    }
  }
];

