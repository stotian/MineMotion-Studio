import type { MineMotionProject } from "../../project/ProjectFile";

export interface RenderStateSnapshot {
  currentFrame: number;
  isPlaying: boolean;
  activeCameraId: string;
  activeCameraFlags: Record<string, boolean>;
  renderPreviewEnabled: boolean;
}

export function createRenderStateSnapshot(
  project: MineMotionProject
): RenderStateSnapshot {
  return {
    currentFrame: project.animation.currentFrame,
    isPlaying: project.animation.isPlaying,
    activeCameraId: project.activeCameraId,
    activeCameraFlags: Object.fromEntries(
      project.scene.cameras.map((camera) => [camera.id, camera.active])
    ),
    renderPreviewEnabled: project.renderSettings.renderPreviewEnabled
  };
}
