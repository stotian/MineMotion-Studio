import { createVectorKeyframe } from "../../animation/Keyframe";
import type {
  AnimationTrack,
  CameraEntity,
  MineMotionProject,
  Vector3Tuple
} from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import {
  calculateSubjectFrame,
  cameraPositionFromOrbit,
  lookAtRotation,
  subtractVector,
  vectorLength
} from "./CameraMath";

export const CINEMA_CAMERA_PROFILES = [
  profile("ultra-wide-14", "Ultra-wide 14 mm", 14, 2.8, 180, 400),
  profile("establishing-18", "Establishing 18 mm", 18, 4, 180, 320),
  profile("wide-24", "Wide 24 mm", 24, 2.8, 180, 400),
  profile("documentary-28", "Documentary 28 mm", 28, 2.8, 144, 640),
  profile("natural-35", "Natural 35 mm", 35, 2.8, 180, 400),
  profile("standard-50", "Standard 50 mm", 50, 2, 180, 320),
  profile("portrait-85", "Portrait 85 mm", 85, 1.8, 180, 400),
  profile("telephoto-135", "Telephoto 135 mm", 135, 2.8, 180, 640),
  profile("action-32", "Action shutter 32 mm", 32, 4, 90, 800),
  profile("dream-58", "Dream portrait 58 mm", 58, 1.4, 216, 500)
] as const;
export type CinemaCameraProfileId = (typeof CINEMA_CAMERA_PROFILES)[number]["id"];

export const PROFESSIONAL_CAMERA_MOVES = [
  "dolly-in",
  "dolly-out",
  "truck-left",
  "truck-right",
  "crane-up",
  "orbit-clockwise"
] as const;
export type ProfessionalCameraMove = (typeof PROFESSIONAL_CAMERA_MOVES)[number];

export interface CameraProfile {
  id: string;
  name: string;
  focalLengthMm: number;
  apertureFStop: number;
  shutterAngleDegrees: number;
  iso: number;
  sensorWidthMm: number;
  sensorHeightMm: number;
}

export interface ProfessionalCameraResult {
  project: MineMotionProject;
  changed: boolean;
  cameraId: string;
  affectedTrackIds: string[];
  error: string | null;
}

export function applyCinemaCameraProfile(
  project: MineMotionProject,
  shotId: string,
  profileId: CinemaCameraProfileId
): ProfessionalCameraResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return failure(project, "", "CAMERA_PROFILE_SHOT_MISSING");
  const camera = project.scene.cameras.find((candidate) => candidate.id === shot.cameraId);
  const selected = CINEMA_CAMERA_PROFILES.find((candidate) => candidate.id === profileId);
  if (!camera || !selected) return failure(project, shot.cameraId, "CAMERA_PROFILE_TARGET_MISSING");
  const fov = horizontalFov(selected.sensorWidthMm, selected.focalLengthMm);
  const nextCamera: CameraEntity = {
    ...camera,
    fov,
    focalLength: selected.focalLengthMm,
    metadata: {
      ...camera.metadata,
      cinemaProfileId: selected.id,
      sensorWidthMm: selected.sensorWidthMm,
      sensorHeightMm: selected.sensorHeightMm,
      apertureFStop: selected.apertureFStop,
      shutterAngleDegrees: selected.shutterAngleDegrees,
      iso: selected.iso,
      exposureValue100: exposureValue(selected.apertureFStop, selected.shutterAngleDegrees, selected.iso, project.animation.fps)
    }
  };
  return success({
    ...project,
    scene: {
      ...project.scene,
      cameras: project.scene.cameras.map((candidate) => candidate.id === camera.id ? nextCamera : candidate)
    },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  }, camera.id, []);
}

export function setCameraFocusTarget(
  project: MineMotionProject,
  shotId: string,
  targetId: string
): ProfessionalCameraResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const camera = shot ? project.scene.cameras.find((candidate) => candidate.id === shot.cameraId) : null;
  const target = findSceneEntity(project, targetId);
  if (!shot || !camera || !target) return failure(project, camera?.id ?? "", "CAMERA_FOCUS_TARGET_MISSING");
  const distance = vectorLength(subtractVector(target.transform.position, camera.transform.position));
  const next = {
    ...project,
    scene: {
      ...project.scene,
      cameras: project.scene.cameras.map((candidate) => candidate.id === camera.id ? {
        ...candidate,
        metadata: {
          ...candidate.metadata,
          focusTargetId: target.id,
          focusDistance: round(Math.max(0.1, distance))
        }
      } : candidate)
    }
  };
  return success(next, camera.id, []);
}

export function autoFrameShot(
  project: MineMotionProject,
  shotId: string,
  subjectIds: string[],
  framing: "wide" | "medium" | "close" = "medium"
): ProfessionalCameraResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const camera = shot ? project.scene.cameras.find((candidate) => candidate.id === shot.cameraId) : null;
  const subjects = subjectIds.map((id) => findSceneEntity(project, id)).filter((value): value is NonNullable<typeof value> => Boolean(value));
  if (!shot || !camera || subjects.length === 0) return failure(project, camera?.id ?? "", "AUTO_FRAME_INPUT_MISSING");
  const frame = calculateSubjectFrame(subjects);
  const multiplier = framing === "wide" ? 2.8 : framing === "close" ? 1.15 : 1.8;
  const distance = Math.max(2.25, Math.max(frame.width, frame.height) * multiplier);
  const yaw = camera.transform.rotation[1];
  const position = cameraPositionFromOrbit(frame.center, distance, yaw, framing === "wide" ? 0.4 : 0.1);
  const rotation = lookAtRotation(position, frame.center);
  const next = {
    ...project,
    scene: {
      ...project.scene,
      cameras: project.scene.cameras.map((candidate) => candidate.id === camera.id ? {
        ...candidate,
        transform: { ...candidate.transform, position, rotation },
        metadata: { ...candidate.metadata, autoFramedSubjectIds: subjectIds, autoFraming: framing }
      } : candidate)
    }
  };
  return success(next, camera.id, []);
}

export function addProfessionalCameraMove(
  project: MineMotionProject,
  shotId: string,
  move: ProfessionalCameraMove,
  amount = 2.5
): ProfessionalCameraResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const camera = shot ? project.scene.cameras.find((candidate) => candidate.id === shot.cameraId) : null;
  if (!shot || !camera) return failure(project, camera?.id ?? "", "CAMERA_MOVE_TARGET_MISSING");
  const distance = Math.max(0.25, Math.min(32, Math.abs(amount)));
  const start = camera.transform.position;
  const target = focusTargetPosition(project, camera) ?? forwardTarget(camera);
  const direction = normalize(subtractVector(target, start));
  const right: Vector3Tuple = normalize([direction[2], 0, -direction[0]]);
  let end: Vector3Tuple;
  let endRotation = camera.transform.rotation;
  if (move === "dolly-in") end = add(start, scale(direction, distance));
  else if (move === "dolly-out") end = add(start, scale(direction, -distance));
  else if (move === "truck-left") end = add(start, scale(right, -distance));
  else if (move === "truck-right") end = add(start, scale(right, distance));
  else if (move === "crane-up") end = add(start, [0, distance, 0]);
  else {
    const relative = subtractVector(start, target);
    const rotated = rotateY(relative, 45);
    end = add(target, rotated);
    endRotation = lookAtRotation(end, target);
  }
  if (move !== "orbit-clockwise") endRotation = lookAtRotation(end, target);
  const positionTrack = upsertTrack(project.animation.tracks, camera.id, "transform.position", [
    [shot.startFrame, start],
    [shot.endFrame, end]
  ]);
  const rotationTrack = upsertTrack(positionTrack, camera.id, "transform.rotation", [
    [shot.startFrame, camera.transform.rotation],
    [shot.endFrame, endRotation]
  ]);
  const next = syncCinematicTimeline({
    ...project,
    animation: { ...project.animation, tracks: rotationTrack },
    scene: {
      ...project.scene,
      cameras: project.scene.cameras.map((candidate) => candidate.id === camera.id ? {
        ...candidate,
        metadata: { ...candidate.metadata, professionalCameraMove: move }
      } : candidate)
    }
  });
  return success(next, camera.id, [`${camera.id}:transform.position`, `${camera.id}:transform.rotation`]);
}

export function trackSubjectDuringShot(
  project: MineMotionProject,
  shotId: string,
  subjectId: string,
  samples = 8
): ProfessionalCameraResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const camera = shot ? project.scene.cameras.find((candidate) => candidate.id === shot.cameraId) : null;
  const subject = findSceneEntity(project, subjectId);
  if (!shot || !camera || !subject) return failure(project, camera?.id ?? "", "SUBJECT_TRACKING_INPUT_MISSING");
  const count = Math.max(2, Math.min(60, Math.round(samples)));
  const rotations: Array<[number, Vector3Tuple]> = [];
  for (let index = 0; index <= count; index += 1) {
    const progress = index / count;
    const frame = Math.round(shot.startFrame + (shot.endFrame - shot.startFrame) * progress);
    const cameraPosition = sampleTransform(project, camera.id, "transform.position", frame, camera.transform.position);
    const subjectPosition = sampleTransform(project, subject.id, "transform.position", frame, subject.transform.position);
    const target: Vector3Tuple = [subjectPosition[0], subjectPosition[1] + (subject.type === "character" ? 1.45 : 0.5), subjectPosition[2]];
    rotations.push([frame, lookAtRotation(cameraPosition, target)]);
  }
  const tracks = upsertTrack(project.animation.tracks, camera.id, "transform.rotation", rotations);
  const next = syncCinematicTimeline({
    ...project,
    animation: { ...project.animation, tracks },
    scene: {
      ...project.scene,
      cameras: project.scene.cameras.map((candidate) => candidate.id === camera.id ? {
        ...candidate,
        metadata: { ...candidate.metadata, trackingTargetId: subject.id, trackingSamples: count }
      } : candidate)
    }
  });
  return success(next, camera.id, [`${camera.id}:transform.rotation`]);
}

export function stabilizeCameraHorizon(
  project: MineMotionProject,
  shotId: string
): ProfessionalCameraResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const camera = shot ? project.scene.cameras.find((candidate) => candidate.id === shot.cameraId) : null;
  if (!shot || !camera) return failure(project, camera?.id ?? "", "HORIZON_CAMERA_MISSING");
  let touched = false;
  const tracks = project.animation.tracks.map((track) => {
    if (track.targetId !== camera.id || track.property !== "transform.rotation") return track;
    const keyframes = track.keyframes.map((keyframe) => {
      if (keyframe.frame < shot.startFrame || keyframe.frame > shot.endFrame) return keyframe;
      touched = true;
      return { ...keyframe, value: [keyframe.value[0], keyframe.value[1], 0] as Vector3Tuple };
    });
    return { ...track, keyframes };
  });
  const cameras = project.scene.cameras.map((candidate) => candidate.id === camera.id ? {
    ...candidate,
    transform: { ...candidate.transform, rotation: [candidate.transform.rotation[0], candidate.transform.rotation[1], 0] as Vector3Tuple },
    metadata: { ...candidate.metadata, horizonStabilized: true }
  } : candidate);
  return success({ ...project, animation: { ...project.animation, tracks }, scene: { ...project.scene, cameras } }, camera.id, touched ? [`${camera.id}:transform.rotation`] : []);
}

function profile(id: string, name: string, focalLengthMm: number, apertureFStop: number, shutterAngleDegrees: number, iso: number): CameraProfile {
  return { id, name, focalLengthMm, apertureFStop, shutterAngleDegrees, iso, sensorWidthMm: 36, sensorHeightMm: 20.25 };
}

function horizontalFov(sensorWidthMm: number, focalLengthMm: number): number {
  return round(2 * Math.atan(sensorWidthMm / (2 * focalLengthMm)) * 180 / Math.PI);
}

function exposureValue(aperture: number, shutterAngle: number, iso: number, fps: number): number {
  const shutterSeconds = Math.max(1 / 8000, shutterAngle / 360 / Math.max(1, fps));
  return round(Math.log2((aperture * aperture) / shutterSeconds) - Math.log2(iso / 100));
}

function focusTargetPosition(project: MineMotionProject, camera: CameraEntity): Vector3Tuple | null {
  const id = typeof camera.metadata.focusTargetId === "string" ? camera.metadata.focusTargetId : "";
  const target = id ? findSceneEntity(project, id) : null;
  if (!target) return null;
  return [target.transform.position[0], target.transform.position[1] + (target.type === "character" ? 1.45 : 0.5), target.transform.position[2]];
}

function findSceneEntity(project: MineMotionProject, id: string) {
  return [
    ...project.scene.characters,
    ...project.scene.cameras,
    ...project.scene.importedObjects,
    ...project.scene.lights
  ].find((entity) => entity.id === id) ?? null;
}

function forwardTarget(camera: CameraEntity): Vector3Tuple {
  const pitch = camera.transform.rotation[0] * Math.PI / 180;
  const yaw = camera.transform.rotation[1] * Math.PI / 180;
  return add(camera.transform.position, [
    -Math.sin(yaw) * Math.cos(pitch) * 10,
    Math.sin(pitch) * 10,
    -Math.cos(yaw) * Math.cos(pitch) * 10
  ]);
}

function sampleTransform(project: MineMotionProject, targetId: string, property: "transform.position" | "transform.rotation", frame: number, fallback: Vector3Tuple): Vector3Tuple {
  const track = project.animation.tracks.find((candidate) => candidate.targetId === targetId && candidate.property === property);
  if (!track || track.keyframes.length === 0) return [...fallback];
  const sorted = [...track.keyframes].sort((a, b) => a.frame - b.frame);
  const before = [...sorted].reverse().find((keyframe) => keyframe.frame <= frame) ?? sorted[0];
  const after = sorted.find((keyframe) => keyframe.frame >= frame) ?? sorted.at(-1)!;
  if (before.frame === after.frame) return [...before.value];
  const t = (frame - before.frame) / (after.frame - before.frame);
  return [
    before.value[0] + (after.value[0] - before.value[0]) * t,
    before.value[1] + (after.value[1] - before.value[1]) * t,
    before.value[2] + (after.value[2] - before.value[2]) * t
  ];
}

function upsertTrack(
  tracks: AnimationTrack[],
  targetId: string,
  property: "transform.position" | "transform.rotation",
  entries: Array<[number, Vector3Tuple]>
): AnimationTrack[] {
  const id = `${targetId}:${property}`;
  const existing = tracks.find((track) => track.id === id);
  const byFrame = new Map<number, AnimationTrack["keyframes"][number]>();
  for (const keyframe of existing?.keyframes ?? []) byFrame.set(keyframe.frame, keyframe);
  for (const [frame, value] of entries) byFrame.set(frame, { ...createVectorKeyframe(frame, value), interpolation: "ease-in-out" as const });
  const next: AnimationTrack = { id, targetId, property, keyframes: [...byFrame.values()].sort((a, b) => a.frame - b.frame) };
  return existing ? tracks.map((track) => track.id === id ? next : track) : [...tracks, next];
}

function normalize(value: Vector3Tuple): Vector3Tuple {
  const length = Math.hypot(value[0], value[1], value[2]);
  return length > 1e-6 ? [value[0] / length, value[1] / length, value[2] / length] : [0, 0, -1];
}

function add(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(value: Vector3Tuple, factor: number): Vector3Tuple {
  return [value[0] * factor, value[1] * factor, value[2] * factor];
}

function rotateY(value: Vector3Tuple, degrees: number): Vector3Tuple {
  const radians = degrees * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return [value[0] * cosine - value[2] * sine, value[1], value[0] * sine + value[2] * cosine];
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function success(project: MineMotionProject, cameraId: string, affectedTrackIds: string[]): ProfessionalCameraResult {
  return { project, changed: true, cameraId, affectedTrackIds, error: null };
}

function failure(project: MineMotionProject, cameraId: string, error: string): ProfessionalCameraResult {
  return { project, changed: false, cameraId, affectedTrackIds: [], error };
}
