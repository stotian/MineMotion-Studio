import type { MineMotionProject } from "../../project/ProjectFile";

export interface RenderStateSnapshot {
  currentFrame: number;
  isPlaying: boolean;
}

export function createRenderStateSnapshot(
  project: MineMotionProject
): RenderStateSnapshot {
  return {
    currentFrame: project.animation.currentFrame,
    isPlaying: project.animation.isPlaying
  };
}
