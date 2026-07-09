import type { MineMotionProject } from "../../project/ProjectFile";
import type { RenderStateSnapshot } from "./RenderStateSnapshot";

export function restoreRenderState(
  project: MineMotionProject,
  snapshot: RenderStateSnapshot
): MineMotionProject {
  return {
    ...project,
    animation: {
      ...project.animation,
      currentFrame: snapshot.currentFrame,
      isPlaying: snapshot.isPlaying
    }
  };
}
