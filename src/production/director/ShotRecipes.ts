import { createVectorKeyframe } from "../../animation/Keyframe";
import { createId, createSceneCamera } from "../../project/ProjectStore";
import type {
  AnimationTrack,
  CameraEntity,
  MineMotionProject,
  SceneEntity,
  Vector3Tuple
} from "../../project/ProjectFile";
import { createProductionShot } from "../ShotManager";
import type { ProductionShot } from "../ShotTypes";
import {
  addVector,
  calculateSubjectFrame,
  cameraPositionFromOrbit,
  horizontalDirection,
  lookAtRotation,
  midpoint,
  rotateAroundY,
  scaleVector
} from "./CameraMath";

export const DIRECTOR_SHOT_KINDS = [
  "establishing",
  "two-shot",
  "medium",
  "close-up",
  "over-shoulder-left",
  "over-shoulder-right",
  "low-angle",
  "high-angle",
  "dolly-in",
  "orbit-left",
  "orbit-right",
  "crane-rise",
  "tracking",
  "reveal"
] as const;
export type DirectorShotKind = (typeof DIRECTOR_SHOT_KINDS)[number];

export interface DirectorShotRequest {
  kind: DirectorShotKind;
  subjectIds: string[];
  startFrame: number;
  durationFrames: number;
  name?: string;
  yawDegrees?: number;
  intensity?: number;
}

export interface DirectorShotBuildResult {
  camera: CameraEntity;
  shot: ProductionShot;
  tracks: AnimationTrack[];
  warnings: string[];
}

interface CameraPose {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  fov: number;
  focalLength: number;
}

export function buildDirectorShot(
  project: MineMotionProject,
  request: DirectorShotRequest
): DirectorShotBuildResult {
  const subjects = resolveSubjects(project, request.subjectIds);
  const frame = calculateSubjectFrame(subjects);
  const startFrame = Math.max(0, Math.round(request.startFrame));
  const durationFrames = Math.max(8, Math.round(request.durationFrames));
  const endFrame = startFrame + durationFrames - 1;
  const intensity = Math.min(2, Math.max(0.25, request.intensity ?? 1));
  const yaw = request.yawDegrees ?? 35;
  const poses = buildCameraPoses(request.kind, subjects, frame.center, frame.width, yaw, intensity);
  const camera = createSceneCamera(request.name ?? labelForKind(request.kind));
  camera.id = createId("director_camera");
  camera.name = request.name ?? labelForKind(request.kind);
  camera.transform = {
    position: [...poses[0].position],
    rotation: [...poses[0].rotation],
    scale: [1, 1, 1]
  };
  camera.fov = poses[0].fov;
  camera.focalLength = poses[0].focalLength;
  camera.metadata = {
    directorShotKind: request.kind,
    subjectIds: subjects.map((subject) => subject.id),
    generatedBy: "MineMotion Director"
  };

  const tracks = createCameraTracks(camera.id, poses, startFrame, endFrame);
  const shot = createProductionShot(
    {
      ...project,
      projectSettings: {
        ...project.projectSettings,
        durationFrames: Math.max(project.projectSettings.durationFrames, endFrame)
      },
      animation: {
        ...project.animation,
        durationFrames: Math.max(project.animation.durationFrames, endFrame)
      },
      scene: { ...project.scene, cameras: [...project.scene.cameras, camera] }
    },
    {
      name: request.name ?? nextShotName(project),
      startFrame,
      endFrame,
      cameraId: camera.id,
      notes: `${labelForKind(request.kind)} generated for ${subjects.map((subject) => subject.name).join(", ") || "scene origin"}.`,
      status: "ready"
    }
  );
  shot.outputName = shot.name;
  shot.outputFolder = shot.name;
  shot.renderPreset = { ...shot.renderPreset, cameraId: camera.id, startFrame, endFrame };

  return {
    camera,
    shot,
    tracks,
    warnings: subjects.length === 0 ? ["No valid subject was found; the shot targets the scene origin."] : []
  };
}

function buildCameraPoses(
  kind: DirectorShotKind,
  subjects: SceneEntity[],
  target: Vector3Tuple,
  subjectWidth: number,
  yaw: number,
  intensity: number
): CameraPose[] {
  const distances = {
    establishing: Math.max(12, subjectWidth * 5.2),
    "two-shot": Math.max(5.5, subjectWidth * 2.2),
    medium: Math.max(3.5, subjectWidth * 1.55),
    "close-up": Math.max(1.8, subjectWidth * 0.78)
  };
  const staticPose = (distance: number, height: number, fov: number, focalLength: number, poseYaw = yaw): CameraPose => {
    const position = cameraPositionFromOrbit(target, distance, poseYaw, height);
    return { position, rotation: lookAtRotation(position, target), fov, focalLength };
  };

  switch (kind) {
    case "establishing":
      return [staticPose(distances.establishing, Math.max(3, subjectWidth * 0.8), 58, 24)];
    case "two-shot":
      return [staticPose(distances["two-shot"], 0.25, 44, 35)];
    case "medium":
      return [staticPose(distances.medium, 0.05, 38, 50)];
    case "close-up":
      return [staticPose(distances["close-up"], 0, 28, 85)];
    case "low-angle": {
      const position = cameraPositionFromOrbit(target, distances.medium, yaw, -1.2 * intensity);
      const raisedTarget = addVector(target, [0, 0.4, 0]);
      return [{ position, rotation: lookAtRotation(position, raisedTarget), fov: 42, focalLength: 40 }];
    }
    case "high-angle": {
      const position = cameraPositionFromOrbit(target, distances.medium * 1.3, yaw, 4 * intensity);
      return [{ position, rotation: lookAtRotation(position, target), fov: 46, focalLength: 35 }];
    }
    case "dolly-in": {
      const far = staticPose(distances.establishing * 0.72, 1.2, 48, 32);
      const near = staticPose(distances.medium, 0.35, 38, 50);
      return [far, near];
    }
    case "orbit-left":
    case "orbit-right": {
      const direction = kind === "orbit-left" ? -1 : 1;
      return [-38, 0, 38].map((offset) => staticPose(distances["two-shot"], 0.55, 42, 40, yaw + offset * direction * intensity));
    }
    case "crane-rise": {
      const low = staticPose(distances["two-shot"] * 1.2, -0.4, 48, 32);
      const high = staticPose(distances.establishing * 0.85, 5.5 * intensity, 54, 28);
      return [low, high];
    }
    case "tracking": {
      const subject = subjects[0];
      const startTarget = subject ? addVector(subject.transform.position, [0, 1.45, 0]) : target;
      const facing = subject && Array.isArray(subject.metadata.motionDirection)
        ? horizontalDirection([0, 0, 0], subject.metadata.motionDirection as Vector3Tuple)
        : [0, 0, -1] as Vector3Tuple;
      const side = rotateAroundY(facing, 90);
      const startPosition = addVector(addVector(startTarget, scaleVector(side, 4.2)), [0, 0.35, 0]);
      const travel = scaleVector(facing, 5 * intensity);
      const endTarget = addVector(startTarget, travel);
      const endPosition = addVector(startPosition, travel);
      return [
        { position: startPosition, rotation: lookAtRotation(startPosition, startTarget), fov: 42, focalLength: 40 },
        { position: endPosition, rotation: lookAtRotation(endPosition, endTarget), fov: 42, focalLength: 40 }
      ];
    }
    case "reveal": {
      const end = staticPose(distances["two-shot"], 0.45, 40, 45);
      const lateral = rotateAroundY(horizontalDirection(end.position, target), 90);
      const startPosition = addVector(end.position, scaleVector(lateral, 4.5 * intensity));
      const hiddenTarget = addVector(target, scaleVector(lateral, 1.7));
      return [
        { position: startPosition, rotation: lookAtRotation(startPosition, hiddenTarget), fov: 45, focalLength: 35 },
        end
      ];
    }
    case "over-shoulder-left":
    case "over-shoulder-right":
      return [buildOverShoulderPose(subjects, kind === "over-shoulder-left" ? 1 : 0, target)];
  }
}

function buildOverShoulderPose(subjects: SceneEntity[], foregroundIndex: number, fallbackTarget: Vector3Tuple): CameraPose {
  const foreground = subjects[foregroundIndex] ?? subjects[0];
  const background = subjects[foregroundIndex === 0 ? 1 : 0] ?? subjects[0];
  if (!foreground || !background) {
    const position = cameraPositionFromOrbit(fallbackTarget, 3.4, foregroundIndex === 0 ? -35 : 35, 0.1);
    return { position, rotation: lookAtRotation(position, fallbackTarget), fov: 36, focalLength: 55 };
  }
  const foregroundEye = addVector(foreground.transform.position, [0, 1.45, 0]);
  const backgroundEye = addVector(background.transform.position, [0, 1.45, 0]);
  const direction = horizontalDirection(foregroundEye, backgroundEye);
  const shoulderSide = scaleVector(rotateAroundY(direction, foregroundIndex === 0 ? 90 : -90), 0.7);
  const position = addVector(addVector(foregroundEye, scaleVector(direction, -1.35)), shoulderSide);
  const target = midpoint(backgroundEye, addVector(backgroundEye, [0, 0.1, 0]));
  return { position, rotation: lookAtRotation(position, target), fov: 34, focalLength: 65 };
}

function createCameraTracks(
  cameraId: string,
  poses: CameraPose[],
  startFrame: number,
  endFrame: number
): AnimationTrack[] {
  if (poses.length <= 1) return [];
  const frames = poses.map((_, index) => Math.round(startFrame + (endFrame - startFrame) * index / (poses.length - 1)));
  const positionTrack: AnimationTrack = {
    id: `${cameraId}:transform.position`,
    targetId: cameraId,
    property: "transform.position",
    keyframes: poses.map((pose, index) => ({
      ...createVectorKeyframe(frames[index], pose.position),
      interpolation: "ease-in-out"
    }))
  };
  const rotationTrack: AnimationTrack = {
    id: `${cameraId}:transform.rotation`,
    targetId: cameraId,
    property: "transform.rotation",
    keyframes: poses.map((pose, index) => ({
      ...createVectorKeyframe(frames[index], pose.rotation),
      interpolation: "ease-in-out"
    }))
  };
  return [positionTrack, rotationTrack];
}

function resolveSubjects(project: MineMotionProject, ids: string[]): SceneEntity[] {
  const all: SceneEntity[] = [
    ...project.scene.characters,
    ...project.scene.importedObjects,
    ...project.scene.lights,
    ...project.scene.cameras
  ];
  const requested = new Set(ids);
  return all.filter((entity) => requested.has(entity.id) && entity.type !== "camera");
}

function nextShotName(project: MineMotionProject): string {
  return `SH${String((project.production.shots.length + 1) * 10).padStart(3, "0")}`;
}

export function labelForKind(kind: DirectorShotKind): string {
  return kind.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

