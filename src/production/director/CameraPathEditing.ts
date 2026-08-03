import { createVectorKeyframe } from "../../animation/Keyframe";
import type { AnimationTrack, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";

export interface CameraPathEditResult {
  project: MineMotionProject;
  changed: boolean;
  shotId: string;
  affectedTrackIds: string[];
  error: string | null;
}

export function addHandheldCameraMotion(
  project: MineMotionProject,
  shotId: string,
  intensity = 0.45,
  samples = 12
): CameraPathEditResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return failure(project, shotId, "HANDHELD_SHOT_MISSING");
  const camera = project.scene.cameras.find((candidate) => candidate.id === shot.cameraId);
  if (!camera) return failure(project, shotId, "HANDHELD_CAMERA_MISSING");
  const clampedIntensity = Math.max(0.05, Math.min(2, intensity));
  const count = Math.max(4, Math.min(120, Math.round(samples)));
  const duration = Math.max(1, shot.endFrame - shot.startFrame);
  const rotationEntries: Array<[number, Vector3Tuple]> = [];
  const positionEntries: Array<[number, Vector3Tuple]> = [];
  for (let index = 0; index <= count; index += 1) {
    const progress = index / count;
    const frame = Math.round(shot.startFrame + duration * progress);
    const envelope = Math.sin(Math.PI * progress);
    const seed = hash(`${shot.id}:${index}`);
    const yaw = (noise(seed) * 2 - 1) * 0.75 * clampedIntensity * envelope;
    const pitch = (noise(seed + 17) * 2 - 1) * 0.5 * clampedIntensity * envelope;
    const roll = (noise(seed + 41) * 2 - 1) * 0.3 * clampedIntensity * envelope;
    rotationEntries.push([frame, [
      camera.transform.rotation[0] + pitch,
      camera.transform.rotation[1] + yaw,
      camera.transform.rotation[2] + roll
    ]]);
    positionEntries.push([frame, [
      camera.transform.position[0] + (noise(seed + 73) * 2 - 1) * 0.025 * clampedIntensity * envelope,
      camera.transform.position[1] + (noise(seed + 101) * 2 - 1) * 0.02 * clampedIntensity * envelope,
      camera.transform.position[2]
    ]]);
  }
  const tracks = upsertEntries(
    upsertEntries(project.animation.tracks, camera.id, "transform.rotation", rotationEntries),
    camera.id,
    "transform.position",
    positionEntries
  );
  return success(project, shotId, tracks, [`${camera.id}:transform.rotation`, `${camera.id}:transform.position`]);
}

export function smoothCameraPath(
  project: MineMotionProject,
  shotId: string,
  passes = 2
): CameraPathEditResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return failure(project, shotId, "SMOOTH_SHOT_MISSING");
  const affected: string[] = [];
  let tracks = project.animation.tracks.map((track) => {
    if (track.targetId !== shot.cameraId || track.keyframes.length < 3) return track;
    if (track.property !== "transform.position" && track.property !== "transform.rotation") return track;
    const inside = track.keyframes.filter((keyframe) => keyframe.frame >= shot.startFrame && keyframe.frame <= shot.endFrame);
    if (inside.length < 3) return track;
    let values = inside.map((keyframe) => [...keyframe.value] as Vector3Tuple);
    for (let pass = 0; pass < Math.max(1, Math.min(8, Math.round(passes))); pass += 1) {
      values = values.map((value, index) => {
        if (index === 0 || index === values.length - 1) return value;
        return average3(values[index - 1], value, values[index + 1]);
      });
    }
    const byFrame = new Map(inside.map((keyframe, index) => [keyframe.frame, values[index]]));
    affected.push(track.id);
    return {
      ...track,
      keyframes: track.keyframes.map((keyframe) => byFrame.has(keyframe.frame)
        ? { ...keyframe, value: byFrame.get(keyframe.frame)!, interpolation: "ease-in-out" as const }
        : keyframe)
    };
  });
  if (affected.length === 0) return failure(project, shotId, "SMOOTH_CAMERA_HAS_NO_EDITABLE_PATH");
  return success(project, shotId, tracks, affected);
}

export function reverseCameraMove(
  project: MineMotionProject,
  shotId: string
): CameraPathEditResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return failure(project, shotId, "REVERSE_SHOT_MISSING");
  const affected: string[] = [];
  const tracks = project.animation.tracks.map((track) => {
    if (track.targetId !== shot.cameraId) return track;
    if (track.property !== "transform.position" && track.property !== "transform.rotation") return track;
    const inside = track.keyframes.filter((keyframe) => keyframe.frame >= shot.startFrame && keyframe.frame <= shot.endFrame);
    if (inside.length < 2) return track;
    const reversedValues = inside.map((keyframe) => keyframe.value).reverse();
    const byFrame = new Map(inside.map((keyframe, index) => [keyframe.frame, reversedValues[index]]));
    affected.push(track.id);
    return {
      ...track,
      keyframes: track.keyframes.map((keyframe) => byFrame.has(keyframe.frame)
        ? { ...keyframe, value: [...byFrame.get(keyframe.frame)!] as Vector3Tuple }
        : keyframe)
    };
  });
  if (affected.length === 0) return failure(project, shotId, "REVERSE_CAMERA_HAS_NO_ANIMATED_MOVE");
  return success(project, shotId, tracks, affected);
}

export function retimeShotWithCamera(
  project: MineMotionProject,
  shotId: string,
  durationFrames: number
): CameraPathEditResult {
  const shot = project.production.shots.find((candidate) => candidate.id === shotId);
  if (!shot) return failure(project, shotId, "RETIME_SHOT_MISSING");
  const oldDuration = Math.max(1, shot.endFrame - shot.startFrame + 1);
  const nextDuration = Math.max(2, Math.round(durationFrames));
  if (nextDuration === oldDuration) return failure(project, shotId, "RETIME_DURATION_UNCHANGED");
  const scale = (nextDuration - 1) / Math.max(1, oldDuration - 1);
  const delta = nextDuration - oldDuration;
  const affected: string[] = [];
  const tracks = project.animation.tracks.map((track) => {
    const ownsCamera = track.targetId === shot.cameraId;
    const belongsLater = track.targetId !== shot.cameraId && false;
    if (!ownsCamera && !belongsLater) return track;
    const keyframes = track.keyframes.map((keyframe) => {
      if (ownsCamera && keyframe.frame >= shot.startFrame && keyframe.frame <= shot.endFrame) {
        return { ...keyframe, frame: shot.startFrame + Math.round((keyframe.frame - shot.startFrame) * scale) };
      }
      return keyframe;
    }).sort((a, b) => a.frame - b.frame);
    affected.push(track.id);
    return { ...track, keyframes };
  });
  const shots = project.production.shots.map((candidate) => {
    if (candidate.id === shot.id) return { ...candidate, endFrame: candidate.startFrame + nextDuration - 1 };
    if (candidate.startFrame > shot.endFrame) return { ...candidate, startFrame: candidate.startFrame + delta, endFrame: candidate.endFrame + delta };
    return candidate;
  });
  const maxEnd = Math.max(...shots.map((candidate) => candidate.endFrame), 0);
  const next = syncCinematicTimeline({
    ...project,
    production: { ...project.production, shots },
    projectSettings: { ...project.projectSettings, durationFrames: Math.max(project.projectSettings.durationFrames + Math.max(0, delta), maxEnd) },
    animation: { ...project.animation, durationFrames: Math.max(project.animation.durationFrames + Math.max(0, delta), maxEnd), tracks },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, shotId, affectedTrackIds: affected, error: null };
}

function upsertEntries(
  tracks: AnimationTrack[],
  targetId: string,
  property: "transform.position" | "transform.rotation",
  entries: Array<[number, Vector3Tuple]>
): AnimationTrack[] {
  const id = `${targetId}:${property}`;
  const existing = tracks.find((track) => track.id === id);
  const byFrame = new Map<number, AnimationTrack["keyframes"][number]>();
  for (const keyframe of existing?.keyframes ?? []) byFrame.set(keyframe.frame, keyframe);
  for (const [frame, value] of entries) byFrame.set(frame, { ...createVectorKeyframe(frame, value), interpolation: "ease-in-out" });
  const track: AnimationTrack = { id, targetId, property, keyframes: [...byFrame.values()].sort((a, b) => a.frame - b.frame) };
  return existing ? tracks.map((candidate) => candidate.id === id ? track : candidate) : [...tracks, track];
}

function success(project: MineMotionProject, shotId: string, tracks: AnimationTrack[], affectedTrackIds: string[]): CameraPathEditResult {
  const next = syncCinematicTimeline({
    ...project,
    animation: { ...project.animation, tracks },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, shotId, affectedTrackIds, error: null };
}

function failure(project: MineMotionProject, shotId: string, error: string): CameraPathEditResult {
  return { project, changed: false, shotId, affectedTrackIds: [], error };
}

function average3(a: Vector3Tuple, b: Vector3Tuple, c: Vector3Tuple): Vector3Tuple {
  return [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function noise(seed: number): number {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
}
