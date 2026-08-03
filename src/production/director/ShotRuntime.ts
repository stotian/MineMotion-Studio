import type { MineMotionProject } from "../../project/ProjectFile";
import type { ProductionShot } from "../ShotTypes";

export function resolveActiveProductionShot(
  project: MineMotionProject,
  frame = project.animation.currentFrame
): ProductionShot | null {
  const candidates = project.production.shots
    .filter((shot) =>
      shot.enabled &&
      shot.activeTake &&
      frame >= shot.startFrame &&
      frame <= shot.endFrame
    )
    .sort((a, b) => {
      const approvedDelta = Number(b.approved) - Number(a.approved);
      if (approvedDelta !== 0) return approvedDelta;
      const takeDelta = b.takeNumber - a.takeNumber;
      if (takeDelta !== 0) return takeDelta;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  return candidates[0] ?? null;
}

export function applyProductionCameraCut(
  project: MineMotionProject,
  frame = project.animation.currentFrame
): MineMotionProject {
  const shot = resolveActiveProductionShot(project, frame);
  if (!shot || !project.scene.cameras.some((camera) => camera.id === shot.cameraId)) {
    return project;
  }
  if (project.activeCameraId === shot.cameraId) return project;
  return {
    ...project,
    activeCameraId: shot.cameraId,
    scene: {
      ...project.scene,
      cameras: project.scene.cameras.map((camera) => ({
        ...camera,
        active: camera.id === shot.cameraId
      }))
    },
    production: {
      ...project.production,
      activeShotId: shot.id
    }
  };
}
