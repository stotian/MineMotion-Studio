import { sampleProjectWithAnimationLayers } from "../../animation/layers/ProjectAnimationLayerEvaluator";
import type { MineMotionProject } from "../../project/ProjectFile";
import { resolveVfxAnimationSampleFrame } from "./VfxProjectFrame";

export function sampleProjectAnimationWithVfxTiming(
  project: MineMotionProject,
  timelineFrame = project.animation.currentFrame
): MineMotionProject {
  const sampled = sampleProjectWithAnimationLayers(
    project,
    resolveVfxAnimationSampleFrame(project, timelineFrame)
  ).project;
  if (sampled.animation.currentFrame === timelineFrame) return sampled;
  return {
    ...sampled,
    animation: { ...sampled.animation, currentFrame: timelineFrame }
  };
}
