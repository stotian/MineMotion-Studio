import { createKeyframeId } from "../Keyframe";
import { lerpVector3 } from "../Interpolation";
import { createDeterministicId } from "../../core/ids/Id";
import type {
  AnimationTrack,
  KeyframeInterpolation,
  Vector3Tuple
} from "../../project/ProjectFile";
import {
  ensureKeyframeMetadata,
  keyframeRefKey,
  type KeyframeRef
} from "./KeyframeModel";

export interface KeyframeCleanupResult {
  tracks: AnimationTrack[];
  selection: KeyframeRef[];
  changed: boolean;
  removedCount: number;
}

export interface KeyframeTransformResult {
  tracks: AnimationTrack[];
  selection: KeyframeRef[];
  changed: boolean;
  error: string | null;
}

export function moveSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  deltaFrames: number,
  maxFrame = Number.MAX_SAFE_INTEGER
): AnimationTrack[] {
  const selected = new Set(selection.map(keyframeRefKey));
  const delta = Math.round(deltaFrames);
  return ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: track.keyframes
      .map((keyframe) =>
        selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
          ? {
              ...keyframe,
              frame: Math.min(maxFrame, Math.max(0, keyframe.frame + delta))
            }
          : keyframe
      )
      .sort((left, right) => left.frame - right.frame)
  }));
}

export function deleteSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[]
): AnimationTrack[] {
  const selected = new Set(selection.map(keyframeRefKey));
  return ensureKeyframeMetadata(tracks)
    .map((track) => ({
      ...track,
      keyframes: track.keyframes.filter(
        (keyframe) =>
          !selected.has(
            keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! })
          )
      )
    }))
    .filter((track) => track.keyframes.length > 0);
}

export function duplicateSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  offsetFrames = 1,
  maxFrame = Number.MAX_SAFE_INTEGER
): { tracks: AnimationTrack[]; selection: KeyframeRef[] } {
  const selected = new Set(selection.map(keyframeRefKey));
  const nextSelection: KeyframeRef[] = [];
  const nextTracks = ensureKeyframeMetadata(tracks).map((track) => {
    const duplicates = track.keyframes.flatMap((keyframe) => {
      const ref = { trackId: track.id, keyframeId: keyframe.id! };
      if (!selected.has(keyframeRefKey(ref))) return [];
      const frame = Math.min(maxFrame, Math.max(0, keyframe.frame + Math.round(offsetFrames)));
      const id = createKeyframeId(frame);
      nextSelection.push({ trackId: track.id, keyframeId: id });
      return [{ ...keyframe, id, frame, value: [...keyframe.value] as Vector3Tuple }];
    });
    return {
      ...track,
      keyframes: [...track.keyframes, ...duplicates].sort(
        (left, right) => left.frame - right.frame
      )
    };
  });
  return { tracks: nextTracks, selection: nextSelection };
}

export function snapSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  interval = 1,
  maxFrame = Number.MAX_SAFE_INTEGER
): AnimationTrack[] {
  const step = Math.max(1, Math.round(interval));
  const selected = new Set(selection.map(keyframeRefKey));
  return ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: track.keyframes
      .map((keyframe) =>
        selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
          ? {
              ...keyframe,
              frame: Math.min(maxFrame, Math.round(keyframe.frame / step) * step)
            }
          : keyframe
      )
      .sort((left, right) => left.frame - right.frame)
  }));
}

export function scaleSelectedKeyframeTiming(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  scale: number,
  pivotFrame: number,
  maxFrame = Number.MAX_SAFE_INTEGER
): AnimationTrack[] {
  const safeScale = Math.max(0.01, scale);
  const selected = new Set(selection.map(keyframeRefKey));
  return ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: track.keyframes
      .map((keyframe) =>
        selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
          ? {
              ...keyframe,
              frame: Math.min(
                maxFrame,
                Math.max(0, Math.round(pivotFrame + (keyframe.frame - pivotFrame) * safeScale))
              )
            }
          : keyframe
      )
      .sort((left, right) => left.frame - right.frame)
  }));
}

export function setSelectedInterpolation(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  interpolation: KeyframeInterpolation
): AnimationTrack[] {
  const selected = new Set(selection.map(keyframeRefKey));
  return ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: track.keyframes.map((keyframe) =>
      selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
        ? { ...keyframe, interpolation }
        : keyframe
    )
  }));
}

export function removeRedundantSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[]
): KeyframeCleanupResult {
  return removeSelectedKeysWithinError(tracks, selection, 1e-6, true);
}

export function reduceSelectedKeyframeNoise(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  tolerance = 0.25
): KeyframeCleanupResult {
  return removeSelectedKeysWithinError(
    tracks,
    selection,
    boundedNumber(tolerance, 0, 180, 0.25),
    false
  );
}

export function smoothSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  amount = 0.5
): AnimationTrack[] {
  const influence = boundedNumber(amount, 0, 1, 0.5);
  if (influence === 0 || selection.length === 0) return tracks;
  const selected = new Set(selection.map(keyframeRefKey));
  let changed = false;
  const normalized = ensureKeyframeMetadata(tracks);
  const output = normalized.map((track) => {
    const keyframes = track.keyframes.map((keyframe, index, source) => {
      if (index === 0 || index === source.length - 1 ||
        !selected.has(keyframeRefKey({
          trackId: track.id,
          keyframeId: keyframe.id!
        }))) {
        return keyframe;
      }
      const predicted = interpolateBetweenNeighbors(
        source[index - 1],
        source[index + 1],
        keyframe.frame
      );
      if (!predicted) return keyframe;
      const value = lerpVector3(keyframe.value, predicted, influence);
      if (maximumVectorError(value, keyframe.value) <= Number.EPSILON) {
        return keyframe;
      }
      changed = true;
      return { ...keyframe, value };
    });
    return { ...track, keyframes };
  });
  return changed ? output : tracks;
}

export function loopSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  repeatCount = 1,
  maximumFrame = Number.MAX_SAFE_INTEGER
): KeyframeTransformResult {
  const normalized = ensureKeyframeMetadata(tracks);
  const range = selectedFrameRange(normalized, selection);
  const repeats = Math.min(16, Math.max(1, Math.round(
    Number.isFinite(repeatCount) ? repeatCount : 1
  )));
  const safeMaximum = Number.isFinite(maximumFrame)
    ? Math.max(0, Math.round(maximumFrame))
    : Number.MAX_SAFE_INTEGER;
  if (!range || range.endFrame <= range.startFrame) {
    return transformFailure(
      tracks,
      selection,
      "KEYFRAME_LOOP_RANGE_INVALID: Select keys across at least two frames."
    );
  }
  const selected = new Set(selection.map(keyframeRefKey));
  const nextSelection: KeyframeRef[] = [];
  let changed = false;
  const output = normalized.map((track) => {
    const source = track.keyframes.filter((keyframe) =>
      selected.has(keyframeRefKey({
        trackId: track.id,
        keyframeId: keyframe.id!
      }))
    );
    if (source.length === 0) return track;
    const keyframes = track.keyframes.map((keyframe) => ({
      ...keyframe,
      value: [...keyframe.value] as Vector3Tuple
    }));
    const occupied = new Set(keyframes.map((keyframe) => keyframe.frame));
    const boundaryInterpolations = new Map<
      number,
      KeyframeInterpolation | undefined
    >();
    let trackChanged = false;
    for (let repeat = 1; repeat <= repeats; repeat += 1) {
      const offset = (range.endFrame - range.startFrame) * repeat;
      for (const keyframe of source) {
        const frame = keyframe.frame + offset;
        if (frame > safeMaximum) continue;
        if (occupied.has(frame)) {
          if (keyframe.frame === range.startFrame) {
            boundaryInterpolations.set(frame, keyframe.interpolation);
          }
          continue;
        }
        const id = createDeterministicId(
          "loop_key",
          `${track.id}:${keyframe.id}:${frame}:${repeat}`
        );
        keyframes.push({
          ...keyframe,
          id,
          frame,
          value: [...keyframe.value]
        });
        occupied.add(frame);
        nextSelection.push({ trackId: track.id, keyframeId: id });
        trackChanged = true;
        changed = true;
      }
    }
    if (!trackChanged) return track;
    for (const [frame, interpolation] of boundaryInterpolations) {
      const boundary = keyframes.find((keyframe) => keyframe.frame === frame);
      if (boundary) boundary.interpolation = interpolation;
    }
    return {
      ...track,
      keyframes: keyframes.sort((left, right) => left.frame - right.frame)
    };
  });
  return changed
    ? { tracks: output, selection: nextSelection, changed: true, error: null }
    : transformFailure(
        tracks,
        selection,
        "KEYFRAME_LOOP_NO_SPACE: The loop would exceed or collide with the timeline."
      );
}

export function reverseSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[]
): KeyframeTransformResult {
  const normalized = ensureKeyframeMetadata(tracks);
  const range = selectedFrameRange(normalized, selection);
  if (!range || range.endFrame <= range.startFrame) {
    return transformFailure(
      tracks,
      selection,
      "KEYFRAME_REVERSE_RANGE_INVALID: Select keys across at least two frames."
    );
  }
  const selected = new Set(selection.map(keyframeRefKey));
  for (const track of normalized) {
    const unselectedFrames = new Set(track.keyframes.flatMap((keyframe) =>
      selected.has(keyframeRefKey({
        trackId: track.id,
        keyframeId: keyframe.id!
      }))
        ? []
        : [keyframe.frame]
    ));
    for (const keyframe of track.keyframes) {
      if (!selected.has(keyframeRefKey({
        trackId: track.id,
        keyframeId: keyframe.id!
      }))) {
        continue;
      }
      const frame = range.startFrame + range.endFrame - keyframe.frame;
      if (unselectedFrames.has(frame)) {
        return transformFailure(
          tracks,
          selection,
          "KEYFRAME_REVERSE_COLLISION: Reversal would overwrite an unselected key."
        );
      }
    }
  }
  let changed = false;
  const output = normalized.map((track) => {
    const selectedKeys = track.keyframes.filter((keyframe) =>
      selected.has(keyframeRefKey({
        trackId: track.id,
        keyframeId: keyframe.id!
      }))
    );
    return {
      ...track,
      keyframes: track.keyframes.map((keyframe) => {
        if (!selected.has(keyframeRefKey({
          trackId: track.id,
          keyframeId: keyframe.id!
        }))) {
          return keyframe;
        }
        const frame = range.startFrame + range.endFrame - keyframe.frame;
        if (frame !== keyframe.frame) changed = true;
        const sourceIndex = selectedKeys.indexOf(keyframe);
        const previous = sourceIndex > 0 ? selectedKeys[sourceIndex - 1] : null;
        return {
          ...keyframe,
          frame,
          interpolation: previous
            ? reverseInterpolation(previous.interpolation)
            : keyframe.interpolation
        };
      }).sort((left, right) => left.frame - right.frame)
    };
  });
  return changed
    ? { tracks: output, selection, changed: true, error: null }
    : transformFailure(
        tracks,
        selection,
        "KEYFRAME_REVERSE_UNCHANGED: The selected range is symmetric."
      );
}

export function mirrorSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[]
): KeyframeTransformResult {
  const normalized = ensureKeyframeMetadata(tracks);
  const selected = new Set(selection.map(keyframeRefKey));
  const snapshots = normalized.flatMap((track) =>
    track.keyframes.flatMap((keyframe) =>
      selected.has(keyframeRefKey({
        trackId: track.id,
        keyframeId: keyframe.id!
      }))
        ? [{
            targetId: track.targetId,
            sourceProperty: track.property,
            targetProperty: mirroredProperty(track.property),
            keyframe
          }]
        : []
    )
  ).filter((entry) => entry.targetProperty !== null);
  if (snapshots.length === 0) {
    return transformFailure(
      tracks,
      selection,
      "KEYFRAME_MIRROR_UNSUPPORTED: Select rig rotation or transform motion keys."
    );
  }
  const output: AnimationTrack[] = normalized.map((track) => ({
    ...track,
    keyframes: track.keyframes.map((keyframe) => ({
      ...keyframe,
      value: [...keyframe.value] as Vector3Tuple
    }))
  }));
  const nextSelection: KeyframeRef[] = [];
  let changed = false;
  for (const snapshot of snapshots) {
    const targetProperty = snapshot.targetProperty!;
    let targetTrack = output.find((track) =>
      track.targetId === snapshot.targetId &&
      track.property === targetProperty
    );
    if (!targetTrack) {
      targetTrack = {
        id: `${snapshot.targetId}:${targetProperty}`,
        targetId: snapshot.targetId,
        property: targetProperty,
        keyframes: []
      };
      output.push(targetTrack);
      changed = true;
    }
    const existing = targetTrack.keyframes.find(
      (keyframe) => keyframe.frame === snapshot.keyframe.frame
    );
    const value = mirrorKeyframeValue(
      snapshot.sourceProperty,
      snapshot.keyframe.value
    );
    const id = existing?.id ?? createDeterministicId(
      "mirror_key",
      `${targetTrack.id}:${snapshot.keyframe.id}:${snapshot.keyframe.frame}`
    );
    const mirrored = {
      ...snapshot.keyframe,
      id,
      value
    };
    if (existing) {
      if (!keyframesEqual(existing, mirrored)) {
        targetTrack.keyframes = targetTrack.keyframes.map((keyframe) =>
          keyframe.frame === mirrored.frame ? mirrored : keyframe
        );
        changed = true;
      }
    } else {
      targetTrack.keyframes.push(mirrored);
      targetTrack.keyframes.sort((left, right) => left.frame - right.frame);
      changed = true;
    }
    nextSelection.push({ trackId: targetTrack.id, keyframeId: id });
  }
  return changed
    ? {
        tracks: output,
        selection: deduplicateRefs(nextSelection),
        changed: true,
        error: null
      }
    : transformFailure(
        tracks,
        selection,
        "KEYFRAME_MIRROR_UNCHANGED: The selected motion is already symmetric."
      );
}

function removeSelectedKeysWithinError(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  tolerance: number,
  requireLinear: boolean
): KeyframeCleanupResult {
  if (selection.length === 0) {
    return { tracks, selection, changed: false, removedCount: 0 };
  }
  const selected = new Set(selection.map(keyframeRefKey));
  const removed = new Set<string>();
  const normalized = ensureKeyframeMetadata(tracks);
  const output = normalized.map((track) => {
    const keyframes = [...track.keyframes];
    let index = 1;
    while (index < keyframes.length - 1) {
      const keyframe = keyframes[index];
      const ref = { trackId: track.id, keyframeId: keyframe.id! };
      const refKey = keyframeRefKey(ref);
      if (!selected.has(refKey)) {
        index += 1;
        continue;
      }
      const left = keyframes[index - 1];
      const right = keyframes[index + 1];
      if (requireLinear &&
        ((left.interpolation ?? "linear") !== "linear" ||
          (keyframe.interpolation ?? "linear") !== "linear")) {
        index += 1;
        continue;
      }
      const predicted = interpolateBetweenNeighbors(
        left,
        right,
        keyframe.frame
      );
      if (!predicted ||
        maximumVectorError(predicted, keyframe.value) > tolerance) {
        index += 1;
        continue;
      }
      removed.add(refKey);
      keyframes.splice(index, 1);
    }
    return { ...track, keyframes };
  });
  if (removed.size === 0) {
    return { tracks, selection, changed: false, removedCount: 0 };
  }
  return {
    tracks: output,
    selection: selection.filter((ref) => !removed.has(keyframeRefKey(ref))),
    changed: true,
    removedCount: removed.size
  };
}

function selectedFrameRange(
  tracks: AnimationTrack[],
  selection: KeyframeRef[]
): { startFrame: number; endFrame: number } | null {
  const selected = new Set(selection.map(keyframeRefKey));
  const frames = tracks.flatMap((track) =>
    track.keyframes.flatMap((keyframe) =>
      selected.has(keyframeRefKey({
        trackId: track.id,
        keyframeId: keyframe.id!
      }))
        ? [keyframe.frame]
        : []
    )
  );
  return frames.length > 0
    ? {
        startFrame: Math.min(...frames),
        endFrame: Math.max(...frames)
      }
    : null;
}

function mirroredProperty(
  property: AnimationTrack["property"]
): AnimationTrack["property"] | null {
  if (property === "transform.position" ||
    property === "transform.rotation") {
    return property;
  }
  if (!property.startsWith("bone.rotation.")) return null;
  const boneId = property.slice("bone.rotation.".length);
  const pairs: Record<string, string> = {
    leftArm: "rightArm",
    rightArm: "leftArm",
    leftForearm: "rightForearm",
    rightForearm: "leftForearm",
    leftLeg: "rightLeg",
    rightLeg: "leftLeg"
  };
  return `bone.rotation.${pairs[boneId] ?? boneId}`;
}

function mirrorKeyframeValue(
  property: AnimationTrack["property"],
  value: Vector3Tuple
): Vector3Tuple {
  return property === "transform.position"
    ? [-value[0], value[1], value[2]]
    : [value[0], -value[1], -value[2]];
}

function deduplicateRefs(refs: KeyframeRef[]): KeyframeRef[] {
  const keys = new Set<string>();
  return refs.filter((ref) => {
    const key = keyframeRefKey(ref);
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}

function reverseInterpolation(
  interpolation: KeyframeInterpolation | undefined
): KeyframeInterpolation {
  if (interpolation === "ease-in") return "ease-out";
  if (interpolation === "ease-out") return "ease-in";
  return interpolation ?? "linear";
}

function keyframesEqual(
  left: AnimationTrack["keyframes"][number],
  right: AnimationTrack["keyframes"][number]
): boolean {
  return left.id === right.id &&
    left.frame === right.frame &&
    left.interpolation === right.interpolation &&
    maximumVectorError(left.value, right.value) <= Number.EPSILON;
}

function transformFailure(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  error: string
): KeyframeTransformResult {
  return { tracks, selection, changed: false, error };
}

function interpolateBetweenNeighbors(
  left: AnimationTrack["keyframes"][number],
  right: AnimationTrack["keyframes"][number],
  frame: number
): Vector3Tuple | null {
  const span = right.frame - left.frame;
  if (!Number.isFinite(span) || span <= 0) return null;
  const amount = (frame - left.frame) / span;
  if (!Number.isFinite(amount) || amount <= 0 || amount >= 1) return null;
  return lerpVector3(left.value, right.value, amount);
}

function maximumVectorError(
  left: Vector3Tuple,
  right: Vector3Tuple
): number {
  return Math.max(
    Math.abs(left[0] - right[0]),
    Math.abs(left[1] - right[1]),
    Math.abs(left[2] - right[2])
  );
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}
