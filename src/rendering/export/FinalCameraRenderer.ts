import type { ExportSettings } from "../../export/ExportTypes";
import type { CameraEntity, MineMotionProject } from "../../project/ProjectFile";

export function resolveExportCamera(
  project: MineMotionProject,
  cameraId: ExportSettings["cameraId"]
): CameraEntity | null {
  if (cameraId === "viewport") return null;
  const resolvedId = cameraId === "active" ? project.activeCameraId : cameraId;
  return project.scene.cameras.find((camera) => camera.id === resolvedId) ?? null;
}

export function createFinalCameraFrame(
  project: MineMotionProject,
  settings: ExportSettings,
  frame: number
): MineMotionProject {
  const camera = resolveExportCamera(project, settings.cameraId);
  if (settings.cameraId !== "viewport" && !camera) {
    throw new Error("The selected final render camera does not exist.");
  }
  const heldFrame = Math.min(
    project.animation.durationFrames,
    Math.max(0, Math.round(frame))
  );
  return {
    ...project,
    activeCameraId: camera?.id ?? project.activeCameraId,
    scene: {
      ...project.scene,
      cameras: camera
        ? project.scene.cameras.map((item) => ({
            ...item,
            active: item.id === camera.id
          }))
        : project.scene.cameras
    },
    renderSettings: {
      ...project.renderSettings,
      renderPreviewEnabled: true,
      cinematicBarsEnabled: settings.includeCinematicBars
    },
    animation: {
      ...project.animation,
      currentFrame: heldFrame,
      isPlaying: false
    }
  };
}
