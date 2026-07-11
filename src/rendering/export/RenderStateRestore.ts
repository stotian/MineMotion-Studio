import type { MineMotionProject } from "../../project/ProjectFile";
import type { RenderStateSnapshot } from "./RenderStateSnapshot";

export function restoreRenderState(
  project: MineMotionProject,
  snapshot: RenderStateSnapshot
): MineMotionProject {
  return {
    ...project,
    activeCameraId: snapshot.activeCameraId,
    scene: {
      ...project.scene,
      cameras: project.scene.cameras.map((camera) => ({
        ...camera,
        active: snapshot.activeCameraFlags[camera.id] ?? false
      }))
    },
    renderSettings: {
      ...project.renderSettings,
      renderPreviewEnabled: snapshot.renderPreviewEnabled
    },
    animation: {
      ...project.animation,
      currentFrame: snapshot.currentFrame,
      isPlaying: snapshot.isPlaying
    }
  };
}
