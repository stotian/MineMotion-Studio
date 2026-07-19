import { Animator } from "../../animation/Animator";
import type { MineMotionProject } from "../../project/ProjectFile";
import { resolveVfxAnimationSampleFrame } from "./VfxProjectFrame";

export function sampleProjectAnimationWithVfxTiming(
  project: MineMotionProject,
  timelineFrame = project.animation.currentFrame
): MineMotionProject {
  const sampled = Animator.sampleProject(
    project,
    resolveVfxAnimationSampleFrame(project, timelineFrame)
  );
  if (sampled.animation.currentFrame === timelineFrame) return sampled;
  return {
    ...sampled,
    animation: { ...sampled.animation, currentFrame: timelineFrame }
  };
}
