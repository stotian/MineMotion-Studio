import { lerpVector3 } from "../../animation/Interpolation";
import { applyInterpolationCurve } from "../../animation/editor/InterpolationCurves";
import type {
  AnimatableProperty,
  CharacterEntity,
  Keyframe,
  MineMotionProject,
  TransformData,
  Vector3Tuple
} from "../../project/ProjectFile";
import { getRigDefinition } from "../MinecraftRigPresets";
import {
  evaluateAnimationLayers,
  isPropertyAllowedForAnimationLayer
} from "../../animation/layers/AnimationLayerEvaluator";
import { getTargetAnimationLayers } from "../../animation/layers/AnimationLayerNlaAdapter";
import {
  isFiniteRigVector,
  isValidRigTransform
} from "../RigSpaceMath";
import type { RigVector3Tuple } from "../RigTypes";
import {
  evaluateRigPointWorld,
  type RigPointPose
} from "./RigPointKinematics";

export type MotionPathKind =
  | "characterRoot"
  | "leftHand"
  | "rightHand"
  | "camera";

export interface MotionPathRequest {
  kind: MotionPathKind;
  subjectId: string;
  startFrame: number;
  endFrame: number;
}

export interface MotionPathPoint {
  frame: number;
  position: RigVector3Tuple;
  keyframe: boolean;
}

export interface MotionPathBounds {
  minimum: RigVector3Tuple;
  maximum: RigVector3Tuple;
}

export interface SampledMotionPath {
  kind: MotionPathKind;
  subjectId: string;
  subjectName: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  durationSeconds: number;
  distance: number;
  points: MotionPathPoint[];
  keyframeFrames: number[];
  bounds: MotionPathBounds;
}

export type MotionPathSampleResult =
  | { ok: true; path: SampledMotionPath; error: null }
  | { ok: false; path: null; error: string };

export const MOTION_PATH_LIMITS = Object.freeze({
  maximumBaseFrames: 1_201,
  maximumPoints: 1_600,
  maximumRelevantTracks: 16,
  maximumKeyframesPerTrack: 4_096,
  maximumCoordinate: 30_000_000
});

const KINDS = new Set<MotionPathKind>([
  "characterRoot",
  "leftHand",
  "rightHand",
  "camera"
]);
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

interface PreparedMotionTrack {
  property: AnimatableProperty;
  keyframes: Keyframe<Vector3Tuple>[];
}

export function sampleProjectMotionPath(
  project: MineMotionProject,
  request: unknown
): MotionPathSampleResult {
  if (!Number.isInteger(project.animation.durationFrames) ||
    project.animation.durationFrames < 0 ||
    !Number.isFinite(project.animation.fps) ||
    project.animation.fps <= 0) {
    return failure("MOTION_PATH_TIMELINE_INVALID: Timeline duration and FPS must be finite and positive.");
  }
  const safeRequest = sanitizeRequest(project, request);
  if (!safeRequest) {
    return failure("MOTION_PATH_REQUEST_INVALID: Path range and subject must be bounded valid data.");
  }
  const subject = resolveSubject(project, safeRequest);
  if (!subject.ok || !subject.sample || !subject.name) return failure(subject.error);
  const frameCount = safeRequest.endFrame - safeRequest.startFrame + 1;
  if (frameCount > MOTION_PATH_LIMITS.maximumBaseFrames) {
    return failure("MOTION_PATH_RANGE_TOO_LARGE: Requested range exceeds the path sampling limit.");
  }
  const tracks = collectRelevantTracks(
    project,
    safeRequest.subjectId,
    subject.properties
  );
  if (!tracks.ok || !tracks.tracks) return failure(tracks.error);
  const keyframeFrames = collectKeyframeFrames(
    tracks.tracks,
    safeRequest.startFrame,
    safeRequest.endFrame
  );
  const layerKeyframes = collectLayerKeyframeFrames(
    project,
    safeRequest.subjectId,
    subject.properties,
    safeRequest.startFrame,
    safeRequest.endFrame
  );
  if (!layerKeyframes) {
    return failure("MOTION_PATH_POINT_LIMIT: Layer keys exceed the path point limit.");
  }
  keyframeFrames.push(...layerKeyframes);
  keyframeFrames.sort((left, right) => left - right);
  const uniqueKeyframeFrames = [...new Set(keyframeFrames)];
  const frameSet = new Set<number>(uniqueKeyframeFrames);
  for (let frame = safeRequest.startFrame; frame <= safeRequest.endFrame; frame += 1) {
    frameSet.add(frame);
  }
  const frames = [...frameSet].sort((left, right) => left - right);
  if (frames.length > MOTION_PATH_LIMITS.maximumPoints) {
    return failure("MOTION_PATH_POINT_LIMIT: Timeline keys exceed the path point limit.");
  }
  const keyframeSet = new Set(uniqueKeyframeFrames);
  const points: MotionPathPoint[] = [];
  for (const frame of frames) {
    const position = subject.sample(frame, tracks.tracks);
    if (!position || !boundedPosition(position)) {
      return failure("MOTION_PATH_SAMPLE_INVALID: A path point could not be evaluated safely.");
    }
    points.push({
      frame,
      position: [...position],
      keyframe: keyframeSet.has(frame)
    });
  }
  if (points.length === 0) {
    return failure("MOTION_PATH_EMPTY: The requested path has no points.");
  }
  return {
    ok: true,
    path: {
      kind: safeRequest.kind,
      subjectId: safeRequest.subjectId,
      subjectName: subject.name,
      startFrame: safeRequest.startFrame,
      endFrame: safeRequest.endFrame,
      durationFrames: safeRequest.endFrame - safeRequest.startFrame,
      durationSeconds: (safeRequest.endFrame - safeRequest.startFrame) /
        Math.max(1, project.animation.fps),
      distance: pathDistance(points),
      points,
      keyframeFrames: uniqueKeyframeFrames,
      bounds: pathBounds(points)
    },
    error: null
  };
}

interface ResolvedSubject {
  ok: boolean;
  name: string | null;
  properties: AnimatableProperty[];
  sample: (frame: number, tracks: PreparedMotionTrack[]) => RigVector3Tuple | null;
  error: string;
}

function resolveSubject(
  project: MineMotionProject,
  request: MotionPathRequest
): ResolvedSubject {
  if (request.kind === "camera") {
    const camera = project.scene.cameras.find((entry) => entry.id === request.subjectId);
    if (!camera || !boundedPosition(camera.transform.position)) {
      return subjectFailure("MOTION_PATH_CAMERA_MISSING: The requested camera does not exist.");
    }
    return {
      ok: true,
      name: camera.name,
      properties: [
        "transform.position",
        "transform.rotation",
        "transform.scale"
      ],
      sample: (frame, tracks) => {
        const baseValues = {
          "transform.position": sampleProperty(
            tracks,
            "transform.position",
            camera.transform.position,
            frame
          ),
          "transform.rotation": sampleProperty(
            tracks,
            "transform.rotation",
            camera.transform.rotation,
            frame
          ),
          "transform.scale": sampleProperty(
            tracks,
            "transform.scale",
            camera.transform.scale,
            frame
          )
        };
        return evaluateAnimationLayers(
          getTargetAnimationLayers(project.animation.nlaTracks, camera.id),
          project.animation.clips,
          baseValues,
          frame
        ).values["transform.position"] ?? null;
      },
      error: ""
    };
  }

  const character = project.scene.characters.find((entry) => entry.id === request.subjectId);
  if (!character || !isValidRigTransform(character.transform)) {
    return subjectFailure("MOTION_PATH_CHARACTER_MISSING: The requested character is invalid or missing.");
  }
  const definition = getRigDefinition(character.rigPreset);
  const attachmentId = request.kind === "leftHand"
    ? "leftHand"
    : request.kind === "rightHand"
      ? "rightHand"
      : null;
  const attachment = attachmentId
    ? definition.attachmentPoints.find((entry) => entry.id === attachmentId)
    : null;
  const boneId = attachment?.boneId ?? "root";
  const localPoint = attachment?.offset ?? [0, 0, 0];
  const boneIds = resolveBoneChain(definition, boneId);
  if (!boneIds) {
    return subjectFailure("MOTION_PATH_RIG_HIERARCHY_INVALID: The path rig point is unavailable.");
  }
  const properties: AnimatableProperty[] = [
    "transform.position",
    "transform.rotation",
    "transform.scale",
    ...boneIds.map((id) => `bone.rotation.${id}` as const)
  ];
  return {
    ok: true,
    name: `${character.name} ${request.kind === "characterRoot" ? "Root" : attachmentId}`,
    properties,
    sample: (frame, tracks) => sampleCharacterPoint(
      character,
      boneIds,
      boneId,
      localPoint,
      frame,
      tracks,
      project
    ),
    error: ""
  };
}

function sampleCharacterPoint(
  character: CharacterEntity,
  boneIds: string[],
  boneId: string,
  localPoint: RigVector3Tuple,
  frame: number,
  tracks: PreparedMotionTrack[],
  project: MineMotionProject
): RigVector3Tuple | null {
  const transform: TransformData = {
    position: sampleProperty(
      tracks,
      "transform.position",
      character.transform.position,
      frame
    ),
    rotation: sampleProperty(
      tracks,
      "transform.rotation",
      character.transform.rotation,
      frame
    ),
    scale: sampleProperty(
      tracks,
      "transform.scale",
      character.transform.scale,
      frame
    )
  };
  const boneRotations: Record<string, RigVector3Tuple> = {};
  for (const id of boneIds) {
    boneRotations[id] = sampleProperty(
      tracks,
      `bone.rotation.${id}`,
      character.boneRotations[id] ?? [0, 0, 0],
      frame
    );
  }
  const baseValues: Record<string, RigVector3Tuple> = {
    "transform.position": transform.position,
    "transform.rotation": transform.rotation,
    "transform.scale": transform.scale,
    ...Object.fromEntries(Object.entries(boneRotations).map(([id, rotation]) => [
      `bone.rotation.${id}`,
      rotation
    ]))
  };
  const layered = evaluateAnimationLayers(
    getTargetAnimationLayers(project.animation.nlaTracks, character.id),
    project.animation.clips,
    baseValues,
    frame
  ).values;
  transform.position = layered["transform.position"] ?? transform.position;
  transform.rotation = layered["transform.rotation"] ?? transform.rotation;
  transform.scale = layered["transform.scale"] ?? transform.scale;
  for (const id of boneIds) {
    boneRotations[id] = layered[`bone.rotation.${id}`] ?? boneRotations[id];
  }
  const evaluated = evaluateRigPointWorld(
    getRigDefinition(character.rigPreset),
    { transform, boneRotations } satisfies RigPointPose,
    boneId,
    localPoint
  );
  return evaluated.ok ? evaluated.worldPosition : null;
}

function sampleProperty(
  tracks: PreparedMotionTrack[],
  property: AnimatableProperty,
  fallback: Vector3Tuple,
  frame: number
): RigVector3Tuple {
  const track = tracks.find((entry) => entry.property === property);
  const sampled = track ? samplePreparedTrack(track.keyframes, frame) : null;
  return isFiniteRigVector(sampled) ? [...sampled] : [...fallback];
}

function collectRelevantTracks(
  project: MineMotionProject,
  subjectId: string,
  properties: AnimatableProperty[]
): { ok: boolean; tracks: PreparedMotionTrack[] | null; error: string } {
  const propertySet = new Set<AnimatableProperty>(properties);
  const relevant = project.animation.tracks.filter((track) =>
    track.targetId === subjectId && propertySet.has(track.property)
  );
  if (relevant.length > MOTION_PATH_LIMITS.maximumRelevantTracks ||
    relevant.some((track) =>
      !Array.isArray(track.keyframes) ||
      track.keyframes.length > MOTION_PATH_LIMITS.maximumKeyframesPerTrack ||
      track.keyframes.some((keyframe) =>
        typeof keyframe.frame !== "number" ||
        !Number.isFinite(keyframe.frame) ||
        !isFiniteRigVector(keyframe.value)
      )
    )) {
    return {
      ok: false,
      tracks: null,
      error: "MOTION_PATH_TRACK_LIMIT: Relevant animation data exceeds the path limits."
    };
  }
  const tracks = relevant.map((track) => ({
    property: track.property,
    keyframes: [...track.keyframes].sort((left, right) => left.frame - right.frame)
  }));
  return { ok: true, tracks, error: "" };
}

function collectKeyframeFrames(
  tracks: PreparedMotionTrack[],
  startFrame: number,
  endFrame: number
): number[] {
  return [...new Set(tracks.flatMap((track) =>
    track.keyframes.flatMap((keyframe) =>
      typeof keyframe.frame === "number" &&
      Number.isFinite(keyframe.frame) &&
      keyframe.frame >= startFrame &&
      keyframe.frame <= endFrame
        ? [keyframe.frame]
        : []
    )
  ))].sort((left, right) => left - right);
}

function collectLayerKeyframeFrames(
  project: MineMotionProject,
  targetId: string,
  properties: AnimatableProperty[],
  startFrame: number,
  endFrame: number
): number[] | null {
  const propertySet = new Set(properties);
  const clipById = new Map(project.animation.clips.map((clip) => [clip.id, clip]));
  const frames = new Set<number>();
  for (const layer of getTargetAnimationLayers(project.animation.nlaTracks, targetId)) {
    if (layer.muted || layer.weight <= 0 || layer.kind === "vfxSync") continue;
    for (const instance of layer.clips) {
      if (instance.muted || instance.weight <= 0) continue;
      const clip = clipById.get(instance.clipId);
      if (!clip) continue;
      for (const track of clip.tracks) {
        if (!propertySet.has(track.property) ||
          !isPropertyAllowedForAnimationLayer(layer.kind, track.property) ||
          track.keyframes.length > MOTION_PATH_LIMITS.maximumKeyframesPerTrack) {
          continue;
        }
        for (const keyframe of track.keyframes) {
          if (!Number.isFinite(keyframe.frame)) continue;
          const globalFrame = instance.startFrame + keyframe.frame / instance.timeScale;
          if (Number.isFinite(globalFrame) &&
            globalFrame >= startFrame &&
            globalFrame <= endFrame &&
            globalFrame <= instance.startFrame + instance.durationFrames) {
            frames.add(globalFrame);
            if (frames.size > MOTION_PATH_LIMITS.maximumPoints) return null;
          }
        }
      }
    }
  }
  return [...frames];
}

function samplePreparedTrack(
  keyframes: Keyframe<Vector3Tuple>[],
  frame: number
): RigVector3Tuple | null {
  if (keyframes.length === 0) return null;
  if (frame <= keyframes[0].frame) return [...keyframes[0].value];
  const last = keyframes[keyframes.length - 1];
  if (frame >= last.frame) return [...last.value];

  let low = 0;
  let high = keyframes.length - 1;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (keyframes[middle].frame <= frame) low = middle;
    else high = middle;
  }
  const left = keyframes[low];
  const right = keyframes[high];
  const span = right.frame - left.frame || 1;
  const amount = applyInterpolationCurve(
    left.interpolation ?? "linear",
    (frame - left.frame) / span
  );
  return lerpVector3(left.value, right.value, amount);
}

function resolveBoneChain(
  definition: ReturnType<typeof getRigDefinition>,
  boneId: string
): string[] | null {
  const byId = new Map(definition.bones.map((bone) => [bone.id, bone]));
  const ids: string[] = [];
  const visited = new Set<string>();
  let bone = byId.get(boneId);
  while (bone) {
    if (visited.has(bone.id) || ids.length >= 32) return null;
    visited.add(bone.id);
    ids.push(bone.id);
    if (!bone.parentId) return ids;
    bone = byId.get(bone.parentId);
  }
  return null;
}

function sanitizeRequest(
  project: MineMotionProject,
  value: unknown
): MotionPathRequest | null {
  const record = ownDataRecord(value);
  if (!record || !KINDS.has(record.kind as MotionPathKind) ||
    typeof record.subjectId !== "string" ||
    !ID_PATTERN.test(record.subjectId) ||
    !Number.isInteger(record.startFrame) ||
    !Number.isInteger(record.endFrame)) {
    return null;
  }
  const startFrame = record.startFrame as number;
  const endFrame = record.endFrame as number;
  if (startFrame < 0 || endFrame < startFrame ||
    endFrame > project.animation.durationFrames) {
    return null;
  }
  return {
    kind: record.kind as MotionPathKind,
    subjectId: record.subjectId,
    startFrame,
    endFrame
  };
}

function pathDistance(points: MotionPathPoint[]): number {
  let distance = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1].position;
    const current = points[index].position;
    distance += Math.hypot(
      current[0] - previous[0],
      current[1] - previous[1],
      current[2] - previous[2]
    );
  }
  return distance;
}

function pathBounds(points: MotionPathPoint[]): MotionPathBounds {
  const minimum = [...points[0].position] as RigVector3Tuple;
  const maximum = [...points[0].position] as RigVector3Tuple;
  for (const point of points.slice(1)) {
    for (let axis = 0; axis < 3; axis += 1) {
      minimum[axis] = Math.min(minimum[axis], point.position[axis]);
      maximum[axis] = Math.max(maximum[axis], point.position[axis]);
    }
  }
  return { minimum, maximum };
}

function boundedPosition(value: unknown): value is RigVector3Tuple {
  return isFiniteRigVector(value) &&
    value.every((component) =>
      Math.abs(component) <= MOTION_PATH_LIMITS.maximumCoordinate
    );
}

function subjectFailure(error: string): ResolvedSubject {
  return { ok: false, name: null, properties: [], sample: () => null, error };
}

function failure(error: string): MotionPathSampleResult {
  return { ok: false, path: null, error };
}

function ownDataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(descriptors).map(([key, descriptor]) => [key, descriptor.value])
    );
  } catch {
    return null;
  }
}
