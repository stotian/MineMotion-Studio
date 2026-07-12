import type {
  TimelineItem,
  TimelineTrackLane,
  TimelineTrackType
} from "./ProjectFile";

const TIMELINE_TRACK_TYPES = new Set<TimelineTrackType>([
  "transform",
  "rig",
  "camera",
  "effect",
  "audio",
  "postProcessing",
  "sky"
]);
const MAX_TIMELINE_TRACKS = 128;
const MAX_TIMELINE_ITEMS_PER_TRACK = 4_096;
const MAX_TIMELINE_TEXT_LENGTH = 512;
const OPTIONAL_ITEM_IDS = [
  "boneId",
  "effectId",
  "audioClipId",
  "environmentKeyframeId"
] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    return Reflect.ownKeys(descriptors).every((key) => {
      if (typeof key === "symbol") return false;
      const descriptor = descriptors[key];
      return Boolean(
        descriptor && "value" in descriptor && descriptor.enumerable
      );
    });
  } catch {
    return false;
  }
}

function requireText(
  value: unknown,
  path: string,
  allowEmpty = false
): string {
  if (
    typeof value !== "string" ||
    value.length > MAX_TIMELINE_TEXT_LENGTH ||
    (!allowEmpty && value.trim() === "")
  ) {
    throw new Error(`${path} must be a bounded string.`);
  }
  return value;
}

function requireTrackType(value: unknown, path: string): TimelineTrackType {
  if (typeof value !== "string" || !TIMELINE_TRACK_TYPES.has(value as TimelineTrackType)) {
    throw new Error(`${path} is not a supported timeline track type.`);
  }
  return value as TimelineTrackType;
}

function sanitizeTimelineItem(value: unknown, path: string): TimelineItem {
  if (!isPlainRecord(value)) {
    throw new Error(`${path} must be a plain timeline item object.`);
  }
  const startFrame = value.startFrame;
  const durationFrames = value.durationFrames;
  if (!Number.isSafeInteger(startFrame) || (startFrame as number) < 0) {
    throw new Error(`${path}.startFrame must be a non-negative safe integer.`);
  }
  if (!Number.isSafeInteger(durationFrames) || (durationFrames as number) < 1) {
    throw new Error(`${path}.durationFrames must be a positive safe integer.`);
  }
  if (!Number.isSafeInteger((startFrame as number) + (durationFrames as number))) {
    throw new Error(`${path} has an unsafe inclusive frame range.`);
  }

  const item: TimelineItem = {
    id: requireText(value.id, `${path}.id`),
    type: requireTrackType(value.type, `${path}.type`),
    label: requireText(value.label, `${path}.label`),
    startFrame: startFrame as number,
    durationFrames: durationFrames as number,
    targetId: requireText(value.targetId, `${path}.targetId`, true)
  };
  for (const key of OPTIONAL_ITEM_IDS) {
    if (Object.hasOwn(value, key)) {
      item[key] = requireText(value[key], `${path}.${key}`, true);
    }
  }
  return item;
}

export function sanitizeTimelineTracks(value: unknown): TimelineTrackLane[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error("animation.timelineTracks must be an array.");
  }
  if (value.length > MAX_TIMELINE_TRACKS) {
    throw new Error(`animation.timelineTracks cannot exceed ${MAX_TIMELINE_TRACKS} tracks.`);
  }
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) {
      throw new Error("animation.timelineTracks must be dense.");
    }
  }

  const trackIds = new Set<string>();
  return value.map((candidate, trackIndex) => {
    const path = `animation.timelineTracks[${trackIndex}]`;
    if (!Object.hasOwn(value, trackIndex) || !isPlainRecord(candidate)) {
      throw new Error(`${path} must be a dense plain track object.`);
    }
    const id = requireText(candidate.id, `${path}.id`);
    if (trackIds.has(id)) {
      throw new Error(`${path}.id is duplicated: ${id}.`);
    }
    trackIds.add(id);
    const type = requireTrackType(candidate.type, `${path}.type`);
    const name = requireText(candidate.name, `${path}.name`);
    const isDerivedEffectLane = type === "effect" || id === "track_effects_main";
    if (!Array.isArray(candidate.items)) {
      throw new Error(`${path}.items must be an array.`);
    }
    if (
      !isDerivedEffectLane &&
      candidate.items.length > MAX_TIMELINE_ITEMS_PER_TRACK
    ) {
      throw new Error(
        `${path}.items cannot exceed ${MAX_TIMELINE_ITEMS_PER_TRACK} items.`
      );
    }
    if (!isDerivedEffectLane) {
      for (let itemIndex = 0; itemIndex < candidate.items.length; itemIndex += 1) {
        if (!Object.hasOwn(candidate.items, itemIndex)) {
          throw new Error(`${path}.items must be dense.`);
        }
      }
    }

    const itemIds = new Set<string>();
    const items =
      isDerivedEffectLane
        ? []
        : candidate.items.map((item, itemIndex) => {
            const sanitized = sanitizeTimelineItem(
              item,
              `${path}.items[${itemIndex}]`
            );
            if (itemIds.has(sanitized.id)) {
              throw new Error(
                `${path}.items[${itemIndex}].id is duplicated: ${sanitized.id}.`
              );
            }
            itemIds.add(sanitized.id);
            return sanitized;
          });

    return { id, type, name, items };
  });
}

export function mergeCanonicalTimelineTracks(
  sourceTracks: readonly TimelineTrackLane[],
  canonicalTracks: readonly TimelineTrackLane[]
): TimelineTrackLane[] {
  const canonicalById = new Map(
    canonicalTracks.map((track) => [track.id, track])
  );
  const emitted = new Set<string>();
  const merged: TimelineTrackLane[] = [];

  for (const source of sourceTracks) {
    const canonical = canonicalById.get(source.id);
    if (canonical) {
      if (!emitted.has(canonical.id)) {
        merged.push(canonical);
        emitted.add(canonical.id);
      }
      continue;
    }
    if (source.type !== "effect") merged.push(source);
  }
  for (const canonical of canonicalTracks) {
    if (!emitted.has(canonical.id)) merged.push(canonical);
  }
  return merged;
}
