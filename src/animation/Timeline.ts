import type {
  AnimatableProperty,
  AnimationTrack,
  MineMotionProject,
  TimelineData,
  TransformData
} from "../project/ProjectFile";
import { findObject } from "../project/ProjectStore";
import { createVectorKeyframe } from "./Keyframe";

const TRANSFORM_PROPERTIES: AnimatableProperty[] = [
  "transform.position",
  "transform.rotation",
  "transform.scale"
];

export function clampFrame(timeline: TimelineData, frame: number): number {
  return Math.min(timeline.durationFrames, Math.max(0, Math.round(frame)));
}

export function setCurrentFrame(
  timeline: TimelineData,
  frame: number
): TimelineData {
  return {
    ...timeline,
    currentFrame: clampFrame(timeline, frame)
  };
}

export function addTransformKeyframes(
  project: MineMotionProject,
  targetId: string,
  frame = project.animation.currentFrame
): MineMotionProject {
  const lookup = findObject(project, targetId);
  if (!lookup) {
    return project;
  }

  const transform = lookup.entity.transform;
  const tracks = [...project.animation.tracks];
  const safeFrame = clampFrame(project.animation, frame);

  for (const property of TRANSFORM_PROPERTIES) {
    const trackId = `${targetId}:${property}`;
    const value = readTransformProperty(transform, property);
    const existingTrack = tracks.find((track) => track.id === trackId);

    if (!existingTrack) {
      tracks.push({
        id: trackId,
        targetId,
        property,
        keyframes: [createVectorKeyframe(safeFrame, value)]
      });
      continue;
    }

    const existingFrame = existingTrack.keyframes.findIndex(
      (keyframe) => keyframe.frame === safeFrame
    );
    const nextKeyframes = [...existingTrack.keyframes];

    if (existingFrame >= 0) {
      nextKeyframes[existingFrame] = createVectorKeyframe(safeFrame, value);
    } else {
      nextKeyframes.push(createVectorKeyframe(safeFrame, value));
    }

    const updatedTrack: AnimationTrack = {
      ...existingTrack,
      keyframes: nextKeyframes.sort((a, b) => a.frame - b.frame)
    };
    const index = tracks.findIndex((track) => track.id === existingTrack.id);
    tracks[index] = updatedTrack;
  }

  return {
    ...project,
    animation: {
      ...project.animation,
      tracks
    }
  };
}

function readTransformProperty(
  transform: TransformData,
  property: AnimatableProperty
) {
  if (property === "transform.position") {
    return transform.position;
  }
  if (property === "transform.rotation") {
    return transform.rotation;
  }
  return transform.scale;
}

