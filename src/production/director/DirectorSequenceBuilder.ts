import type { MineMotionProject, TimelineTrackLane } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { createStoryboardCard } from "../ShotManager";
import { buildDirectorShot, type DirectorShotRequest } from "./ShotRecipes";
import { synchronizeStoryboard } from "./StoryboardSync";

export interface DirectorSequenceBlueprint {
  name: string;
  requests: DirectorShotRequest[];
  replaceExisting?: boolean;
}

export interface DirectorSequenceBuildResult {
  project: MineMotionProject;
  createdCameraIds: string[];
  createdShotIds: string[];
  warnings: string[];
}

export function buildDirectorSequence(
  project: MineMotionProject,
  blueprint: DirectorSequenceBlueprint
): DirectorSequenceBuildResult {
  let next = blueprint.replaceExisting
    ? removeGeneratedDirectorContent(project)
    : project;
  const cameras = [...next.scene.cameras];
  const tracks = [...next.animation.tracks];
  const shots = [...next.production.shots];
  const storyboard = [...next.production.storyboard];
  const createdCameraIds: string[] = [];
  const createdShotIds: string[] = [];
  const warnings: string[] = [];
  let durationFrames = next.animation.durationFrames;

  for (const request of blueprint.requests) {
    const result = buildDirectorShot(
      {
        ...next,
        scene: { ...next.scene, cameras },
        animation: { ...next.animation, tracks, durationFrames },
        production: { ...next.production, shots, storyboard }
      },
      request
    );
    cameras.push(result.camera);
    tracks.push(...result.tracks);
    shots.push(result.shot);
    storyboard.push(createStoryboardCard(result.shot, next.animation.fps));
    durationFrames = Math.max(durationFrames, result.shot.endFrame);
    createdCameraIds.push(result.camera.id);
    createdShotIds.push(result.shot.id);
    warnings.push(...result.warnings);
  }

  const activeShotId = createdShotIds[0] ?? next.production.activeShotId;
  const activeCameraId = createdCameraIds[0] ?? next.activeCameraId;
  next = {
    ...next,
    activeCameraId,
    scene: {
      ...next.scene,
      cameras: cameras.map((camera) => ({ ...camera, active: camera.id === activeCameraId }))
    },
    animation: {
      ...next.animation,
      durationFrames,
      tracks
    },
    projectSettings: {
      ...next.projectSettings,
      durationFrames
    },
    exportSettings: {
      ...next.exportSettings,
      endFrame: Math.max(next.exportSettings.endFrame, durationFrames)
    },
    production: {
      ...next.production,
      shots,
      storyboard,
      activeShotId
    },
    metadata: {
      ...next.metadata,
      updatedAt: new Date().toISOString()
    }
  };
  next = syncCinematicTimeline(next);
  next = synchronizeStoryboard(next);
  return { project: next, createdCameraIds, createdShotIds, warnings };
}

export function removeGeneratedDirectorContent(project: MineMotionProject): MineMotionProject {
  const generatedCameraIds = new Set(
    project.scene.cameras
      .filter((camera) => camera.metadata.generatedBy === "MineMotion Director")
      .map((camera) => camera.id)
  );
  const shots = project.production.shots.filter((shot) => !generatedCameraIds.has(shot.cameraId));
  const shotIds = new Set(shots.map((shot) => shot.id));
  const cameras = project.scene.cameras.filter((camera) => !generatedCameraIds.has(camera.id));
  const activeCameraId = cameras.some((camera) => camera.id === project.activeCameraId)
    ? project.activeCameraId
    : cameras[0]?.id ?? "";
  return {
    ...project,
    activeCameraId,
    scene: {
      ...project.scene,
      cameras: cameras.map((camera) => ({ ...camera, active: camera.id === activeCameraId }))
    },
    animation: {
      ...project.animation,
      tracks: project.animation.tracks.filter((track) => !generatedCameraIds.has(track.targetId)),
      timelineTracks: project.animation.timelineTracks.map((lane): TimelineTrackLane => ({
        ...lane,
        items: lane.items.filter((item) => !generatedCameraIds.has(item.targetId))
      }))
    },
    production: {
      ...project.production,
      shots,
      storyboard: project.production.storyboard.filter((card) => card.shotId === null || shotIds.has(card.shotId)),
      activeShotId: shots.some((shot) => shot.id === project.production.activeShotId)
        ? project.production.activeShotId
        : shots[0]?.id ?? null
    }
  };
}
