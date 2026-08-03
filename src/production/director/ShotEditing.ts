import { createId } from "../../project/ProjectStore";
import type {
  AnimationTrack,
  CameraEntity,
  MineMotionProject,
  TimelineMarker
} from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import type { ProductionShot } from "../ShotTypes";
import { synchronizeStoryboard } from "./StoryboardSync";

export interface ShotEditResult {
  project: MineMotionProject;
  changed: boolean;
  affectedShotIds: string[];
}

export function splitProductionShot(
  project: MineMotionProject,
  shotId: string,
  frame: number
): ShotEditResult {
  const source = project.production.shots.find((shot) => shot.id === shotId);
  const splitFrame = Math.round(frame);
  if (!source || splitFrame <= source.startFrame || splitFrame > source.endFrame) {
    return unchanged(project);
  }
  const now = new Date().toISOString();
  const left: ProductionShot = {
    ...source,
    endFrame: splitFrame - 1,
    renderPreset: { ...source.renderPreset, endFrame: splitFrame - 1 },
    updatedAt: now
  };
  const rightId = createId("shot");
  const right: ProductionShot = {
    ...source,
    id: rightId,
    takeGroupId: createId("take_group"),
    name: `${source.name} B`,
    startFrame: splitFrame,
    renderPreset: {
      ...source.renderPreset,
      startFrame: splitFrame,
      outputName: `${source.outputName}_B`
    },
    outputName: `${source.outputName}_B`,
    outputFolder: `${source.outputFolder}_B`,
    approved: false,
    status: "planned",
    validation: {
      valid: false,
      errors: [],
      warnings: ["Split shot requires validation."],
      checkedAt: ""
    },
    createdAt: now,
    updatedAt: now
  };
  const index = project.production.shots.findIndex((shot) => shot.id === shotId);
  const shots = [...project.production.shots];
  shots.splice(index, 1, left, right);
  return finalize({
    ...project,
    production: {
      ...project.production,
      shots,
      activeShotId: right.id
    }
  }, [left.id, right.id]);
}

export function moveShotWithCameraAnimation(
  project: MineMotionProject,
  shotId: string,
  newStartFrame: number
): ShotEditResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return unchanged(project);
  const nextStart = Math.max(0, Math.round(newStartFrame));
  const delta = nextStart - shot.startFrame;
  if (delta === 0) return unchanged(project);
  const nextShot = shiftShot(shot, delta);
  const projectWithShot = {
    ...project,
    production: {
      ...project.production,
      shots: project.production.shots.map((candidate) => candidate.id === shot.id ? nextShot : candidate)
    }
  };
  return finalize(shiftCameraTracksForShot(projectWithShot, shot, delta), [shot.id]);
}

export function closeSequenceGaps(project: MineMotionProject): ShotEditResult {
  const active = [...project.production.shots]
    .filter((shot) => shot.enabled && shot.activeTake)
    .sort((a, b) => a.startFrame - b.startFrame || a.endFrame - b.endFrame);
  if (active.length === 0) return unchanged(project);
  let next = project;
  let cursor = 0;
  const affected: string[] = [];
  for (const shot of active) {
    if (shot.startFrame !== cursor) {
      const moved = moveShotWithCameraAnimation(next, shot.id, cursor);
      next = moved.project;
      if (moved.changed) affected.push(shot.id);
    }
    const current = next.production.shots.find((candidate) => candidate.id === shot.id) ?? shot;
    cursor = current.endFrame + 1;
  }
  return affected.length > 0 ? finalize(next, affected) : unchanged(project);
}

export function rippleDeleteShot(
  project: MineMotionProject,
  shotId: string
): ShotEditResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return unchanged(project);
  const duration = shot.endFrame - shot.startFrame + 1;
  const laterShots = project.production.shots
    .filter((candidate) => candidate.id !== shot.id && candidate.startFrame > shot.endFrame)
    .sort((a, b) => a.startFrame - b.startFrame);
  let next: MineMotionProject = {
    ...project,
    production: {
      ...project.production,
      shots: project.production.shots.filter((candidate) => candidate.id !== shot.id),
      activeShotId: project.production.activeShotId === shot.id ? null : project.production.activeShotId
    }
  };
  next = removeOrphanDirectorCamera(next, shot.cameraId);
  const affected: string[] = [shot.id];
  for (const later of laterShots) {
    const moved = moveShotWithCameraAnimation(next, later.id, Math.max(0, later.startFrame - duration));
    next = moved.project;
    if (moved.changed) affected.push(later.id);
  }
  if (!next.production.activeShotId) {
    next = {
      ...next,
      production: {
        ...next.production,
        activeShotId: next.production.shots.find((candidate) => candidate.activeTake)?.id ?? next.production.shots[0]?.id ?? null
      }
    };
  }
  return finalize(next, affected);
}

export function duplicateDirectedShotAsTake(
  project: MineMotionProject,
  shotId: string
): ShotEditResult {
  const source = project.production.shots.find((shot) => shot.id === shotId);
  const sourceCamera = source
    ? project.scene.cameras.find((camera) => camera.id === source.cameraId)
    : null;
  if (!source || !sourceCamera) return unchanged(project);
  const group = project.production.shots.filter((shot) => shot.takeGroupId === source.takeGroupId);
  const takeNumber = Math.max(...group.map((shot) => shot.takeNumber), 0) + 1;
  const cameraId = createId("director_camera");
  const camera: CameraEntity = {
    ...sourceCamera,
    id: cameraId,
    name: `${sourceCamera.name} Take ${takeNumber}`,
    active: false,
    transform: {
      position: [...sourceCamera.transform.position],
      rotation: [...sourceCamera.transform.rotation],
      scale: [...sourceCamera.transform.scale]
    },
    metadata: {
      ...sourceCamera.metadata,
      generatedBy: "MineMotion Director",
      sourceCameraId: sourceCamera.id,
      takeNumber
    }
  };
  const now = new Date().toISOString();
  const clone: ProductionShot = {
    ...source,
    id: createId("shot"),
    cameraId,
    name: `${source.name} Take ${takeNumber}`,
    takeNumber,
    revision: 1,
    activeTake: true,
    approved: false,
    status: "planned",
    validation: {
      valid: false,
      errors: [],
      warnings: ["New camera take requires validation."],
      checkedAt: ""
    },
    renderPreset: { ...source.renderPreset, cameraId },
    referenceImages: source.referenceImages.map((image) => ({ ...image })),
    createdAt: now,
    updatedAt: now
  };
  const clonedTracks = project.animation.tracks
    .filter((track) => track.targetId === sourceCamera.id)
    .map((track): AnimationTrack => ({
      ...track,
      id: `${cameraId}:${track.property}`,
      targetId: cameraId,
      keyframes: track.keyframes.map((keyframe) => ({
        ...keyframe,
        id: createId("key"),
        value: [...keyframe.value]
      }))
    }));
  const shots = project.production.shots.map((shot) =>
    shot.takeGroupId === source.takeGroupId ? { ...shot, activeTake: false } : shot
  );
  shots.push(clone);
  return finalize({
    ...project,
    scene: {
      ...project.scene,
      cameras: [...project.scene.cameras, camera]
    },
    animation: {
      ...project.animation,
      tracks: [...project.animation.tracks, ...clonedTracks]
    },
    production: {
      ...project.production,
      shots,
      activeShotId: clone.id
    }
  }, [source.id, clone.id]);
}

function shiftCameraTracksForShot(
  project: MineMotionProject,
  originalShot: ProductionShot,
  delta: number
): MineMotionProject {
  if (delta === 0) return project;
  const camera = project.scene.cameras.find((candidate) => candidate.id === originalShot.cameraId);
  const exclusivelyUsed = project.production.shots.filter((shot) => shot.cameraId === originalShot.cameraId).length <= 1;
  if (camera?.metadata.generatedBy !== "MineMotion Director" && !exclusivelyUsed) return project;
  return {
    ...project,
    animation: {
      ...project.animation,
      tracks: project.animation.tracks.map((track) => {
        if (track.targetId !== originalShot.cameraId) return track;
        return {
          ...track,
          keyframes: track.keyframes.map((keyframe) => ({
            ...keyframe,
            frame: Math.max(0, keyframe.frame + delta)
          }))
        };
      })
    }
  };
}

function removeOrphanDirectorCamera(project: MineMotionProject, cameraId: string): MineMotionProject {
  const stillUsed = project.production.shots.some((shot) => shot.cameraId === cameraId);
  const camera = project.scene.cameras.find((candidate) => candidate.id === cameraId);
  if (stillUsed || camera?.metadata.generatedBy !== "MineMotion Director") return project;
  const cameras = project.scene.cameras.filter((candidate) => candidate.id !== cameraId);
  const activeCameraId = project.activeCameraId === cameraId
    ? cameras[0]?.id ?? ""
    : project.activeCameraId;
  return {
    ...project,
    activeCameraId,
    scene: {
      ...project.scene,
      cameras: cameras.map((candidate) => ({ ...candidate, active: candidate.id === activeCameraId }))
    },
    animation: {
      ...project.animation,
      tracks: project.animation.tracks.filter((track) => track.targetId !== cameraId)
    }
  };
}

function shiftShot(shot: ProductionShot, delta: number): ProductionShot {
  return {
    ...shot,
    startFrame: Math.max(0, shot.startFrame + delta),
    endFrame: Math.max(0, shot.endFrame + delta),
    renderPreset: {
      ...shot.renderPreset,
      startFrame: Math.max(0, shot.renderPreset.startFrame + delta),
      endFrame: Math.max(0, shot.renderPreset.endFrame + delta)
    },
    updatedAt: new Date().toISOString()
  };
}

function finalize(project: MineMotionProject, affectedShotIds: string[]): ShotEditResult {
  const synchronized = synchronizeStoryboard(syncCinematicTimeline({
    ...project,
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  }));
  return { project: synchronized, changed: true, affectedShotIds };
}

function unchanged(project: MineMotionProject): ShotEditResult {
  return { project, changed: false, affectedShotIds: [] };
}
