import type { AnimationTrack, CameraEntity, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { lookAtRotation, midpoint } from "./CameraMath";

export interface ContinuityFinding {
  shotId: string;
  crossedAxis: boolean;
  side: -1 | 0 | 1;
  lensJump: boolean;
  angleJumpDegrees: number;
}

export interface ContinuityReport {
  findings: ContinuityFinding[];
  axisCrossings: number;
  lensJumps: number;
  jumpCuts: number;
}

export interface ContinuityRepairResult {
  project: MineMotionProject;
  changed: boolean;
  affectedShotIds: string[];
  error: string | null;
}

export function analyzeShotContinuity(
  project: MineMotionProject,
  firstActorId: string,
  secondActorId: string
): ContinuityReport {
  const first = project.scene.characters.find((actor) => actor.id === firstActorId);
  const second = project.scene.characters.find((actor) => actor.id === secondActorId);
  if (!first || !second) return { findings: [], axisCrossings: 0, lensJumps: 0, jumpCuts: 0 };
  const axis = normalizeXZ(subtract(second.transform.position, first.transform.position));
  const origin = midpoint(first.transform.position, second.transform.position);
  const shots = project.production.shots.filter((shot) => shot.enabled && !shot.rejected).sort((a, b) => a.startFrame - b.startFrame);
  const findings: ContinuityFinding[] = [];
  let previousSide: -1 | 0 | 1 = 0;
  let previousCamera: CameraEntity | null = null;
  for (const shot of shots) {
    const camera = project.scene.cameras.find((candidate) => candidate.id === shot.cameraId);
    if (!camera) continue;
    const relative = subtract(camera.transform.position, origin);
    const cross = axis[0] * relative[2] - axis[2] * relative[0];
    const side: -1 | 0 | 1 = Math.abs(cross) < 1e-5 ? 0 : cross > 0 ? 1 : -1;
    const crossedAxis = previousSide !== 0 && side !== 0 && previousSide !== side;
    const lensJump = Boolean(previousCamera && Math.abs(camera.focalLength - previousCamera.focalLength) >= 35);
    const angleJumpDegrees = previousCamera ? cameraAngleDifference(previousCamera, camera) : 180;
    findings.push({ shotId: shot.id, crossedAxis, side, lensJump, angleJumpDegrees: round(angleJumpDegrees) });
    if (side !== 0) previousSide = side;
    previousCamera = camera;
  }
  return {
    findings,
    axisCrossings: findings.filter((finding) => finding.crossedAxis).length,
    lensJumps: findings.filter((finding) => finding.lensJump).length,
    jumpCuts: findings.filter((finding) => finding.angleJumpDegrees < 20).length
  };
}

export function repairAxisCrossing(
  project: MineMotionProject,
  shotId: string,
  firstActorId: string,
  secondActorId: string
): ContinuityRepairResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  const camera = shot ? project.scene.cameras.find((candidate) => candidate.id === shot.cameraId) : null;
  const first = project.scene.characters.find((actor) => actor.id === firstActorId);
  const second = project.scene.characters.find((actor) => actor.id === secondActorId);
  if (!shot || !camera || !first || !second) return failure(project, "CONTINUITY_INPUT_MISSING");
  const origin = midpoint(first.transform.position, second.transform.position);
  const axis = normalizeXZ(subtract(second.transform.position, first.transform.position));
  const reflectedPosition = reflectAcrossAxis(camera.transform.position, origin, axis);
  const target = targetForCamera(project, camera, midpoint(first.transform.position, second.transform.position));
  const reflectedRotation = lookAtRotation(reflectedPosition, target, -camera.transform.rotation[2]);
  const tracks = project.animation.tracks.map((track) => reflectCameraTrack(track, camera.id, shot.startFrame, shot.endFrame, origin, axis, target));
  const cameras = project.scene.cameras.map((candidate) => candidate.id === camera.id ? {
    ...candidate,
    transform: { ...candidate.transform, position: reflectedPosition, rotation: reflectedRotation },
    metadata: { ...candidate.metadata, continuityAxisRepaired: true }
  } : candidate);
  return success({ ...project, scene: { ...project.scene, cameras }, animation: { ...project.animation, tracks } }, [shot.id]);
}

export function normalizeSequenceLens(
  project: MineMotionProject,
  focalLength = 35
): ContinuityRepairResult {
  const focal = Math.max(10, Math.min(300, focalLength));
  const cameraIds = new Set(project.production.shots.filter((shot) => shot.enabled && !shot.rejected).map((shot) => shot.cameraId));
  if (cameraIds.size === 0) return failure(project, "NO_SEQUENCE_CAMERAS");
  const fov = 2 * Math.atan(36 / (2 * focal)) * 180 / Math.PI;
  const cameras = project.scene.cameras.map((camera) => cameraIds.has(camera.id) ? {
    ...camera,
    focalLength: focal,
    fov: round(fov),
    metadata: { ...camera.metadata, continuityLensNormalized: true }
  } : camera);
  return success({ ...project, scene: { ...project.scene, cameras } }, project.production.shots.filter((shot) => cameraIds.has(shot.cameraId)).map((shot) => shot.id));
}

export function alignDialogueEyelines(
  project: MineMotionProject,
  firstActorId: string,
  secondActorId: string
): ContinuityRepairResult {
  const first = project.scene.characters.find((actor) => actor.id === firstActorId);
  const second = project.scene.characters.find((actor) => actor.id === secondActorId);
  if (!first || !second) return failure(project, "DIALOGUE_ACTORS_MISSING");
  const affected: string[] = [];
  const cameras = project.scene.cameras.map((camera) => {
    const subjectIds = Array.isArray(camera.metadata.subjectIds) ? camera.metadata.subjectIds.filter((id): id is string => typeof id === "string") : [];
    const target = subjectIds.includes(first.id) && !subjectIds.includes(second.id)
      ? eyePoint(first.transform.position)
      : subjectIds.includes(second.id) && !subjectIds.includes(first.id)
        ? eyePoint(second.transform.position)
        : null;
    if (!target) return camera;
    const shot = project.production.shots.find((candidate) => candidate.cameraId === camera.id);
    if (shot) affected.push(shot.id);
    return {
      ...camera,
      transform: { ...camera.transform, rotation: lookAtRotation(camera.transform.position, target) },
      metadata: { ...camera.metadata, eyelineAligned: true }
    };
  });
  if (affected.length === 0) return failure(project, "NO_DIALOGUE_COVERAGE");
  return success({ ...project, scene: { ...project.scene, cameras } }, affected);
}

export function markIntentionalAxisCrossing(project: MineMotionProject, shotId: string): ContinuityRepairResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return failure(project, "SHOT_MISSING");
  const shots = project.production.shots.map((candidate) => candidate.id === shotId ? {
    ...candidate,
    reviewTags: [...new Set([...candidate.reviewTags, "intentional-axis-crossing"])],
    updatedAt: new Date().toISOString()
  } : candidate);
  return success({ ...project, production: { ...project.production, shots } }, [shotId]);
}

function reflectCameraTrack(
  track: AnimationTrack,
  cameraId: string,
  startFrame: number,
  endFrame: number,
  origin: Vector3Tuple,
  axis: Vector3Tuple,
  target: Vector3Tuple
): AnimationTrack {
  if (track.targetId !== cameraId) return track;
  if (track.property !== "transform.position" && track.property !== "transform.rotation") return track;
  if (track.property === "transform.position") {
    return {
      ...track,
      keyframes: track.keyframes.map((keyframe) => keyframe.frame >= startFrame && keyframe.frame <= endFrame
        ? { ...keyframe, value: reflectAcrossAxis(keyframe.value, origin, axis) }
        : keyframe)
    };
  }
  return {
    ...track,
    keyframes: track.keyframes.map((keyframe) => keyframe.frame >= startFrame && keyframe.frame <= endFrame
      ? { ...keyframe, value: reflectRotationAcrossAxis(keyframe.value, axis) }
      : keyframe)
  };
}

function reflectAcrossAxis(point: Vector3Tuple, origin: Vector3Tuple, axis: Vector3Tuple): Vector3Tuple {
  const relative = subtract(point, origin);
  const projection = axis[0] * relative[0] + axis[2] * relative[2];
  const projected: Vector3Tuple = [axis[0] * projection, relative[1], axis[2] * projection];
  const perpendicular: Vector3Tuple = [relative[0] - projected[0], 0, relative[2] - projected[2]];
  return [origin[0] + projected[0] - perpendicular[0], point[1], origin[2] + projected[2] - perpendicular[2]];
}

function reflectRotationAcrossAxis(rotation: Vector3Tuple, axis: Vector3Tuple): Vector3Tuple {
  const pitch = rotation[0] * Math.PI / 180;
  const yaw = rotation[1] * Math.PI / 180;
  const forward: Vector3Tuple = [
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  ];
  const projection = axis[0] * forward[0] + axis[2] * forward[2];
  const reflected: Vector3Tuple = [
    2 * axis[0] * projection - forward[0],
    forward[1],
    2 * axis[2] * projection - forward[2]
  ];
  return lookAtRotation([0, 0, 0], reflected, -rotation[2]);
}

function targetForCamera(project: MineMotionProject, camera: CameraEntity, fallback: Vector3Tuple): Vector3Tuple {
  const ids = Array.isArray(camera.metadata.subjectIds) ? camera.metadata.subjectIds.filter((id): id is string => typeof id === "string") : [];
  const subjects = project.scene.characters.filter((actor) => ids.includes(actor.id));
  if (subjects.length === 0) return eyePoint(fallback);
  const center = subjects.reduce<Vector3Tuple>((acc, actor) => [acc[0] + actor.transform.position[0], acc[1] + actor.transform.position[1], acc[2] + actor.transform.position[2]], [0, 0, 0]);
  return [center[0] / subjects.length, center[1] / subjects.length + 1.45, center[2] / subjects.length];
}

function cameraAngleDifference(first: CameraEntity, second: CameraEntity): number {
  const delta = Math.abs(normalizeAngle(second.transform.rotation[1] - first.transform.rotation[1]));
  return Math.min(delta, 360 - delta);
}

function normalizeAngle(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function normalizeXZ(value: Vector3Tuple): Vector3Tuple {
  const length = Math.hypot(value[0], value[2]);
  return length > 1e-6 ? [value[0] / length, 0, value[2] / length] : [0, 0, -1];
}

function subtract(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function eyePoint(position: Vector3Tuple): Vector3Tuple {
  return [position[0], position[1] + 1.45, position[2]];
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function success(project: MineMotionProject, affectedShotIds: string[]): ContinuityRepairResult {
  return { project, changed: true, affectedShotIds, error: null };
}

function failure(project: MineMotionProject, error: string): ContinuityRepairResult {
  return { project, changed: false, affectedShotIds: [], error };
}
