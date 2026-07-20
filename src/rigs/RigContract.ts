import type {
  AnimationTrack,
  CharacterEntity,
  KeyframeInterpolation,
  Vector3Tuple
} from "../project/ProjectFile";
import type { RigDefinition } from "./RigDefinition";
import type {
  BoneAnimationTrack,
  BoneInterpolation,
  CharacterAttachment,
  RigPose,
  RigVector3Tuple
} from "./RigTypes";

export const RIG_CONTRACT_VERSION = 1 as const;
export const RIG_CONTRACT_LIMITS = Object.freeze({
  bones: 128,
  attachments: 32,
  poses: 128,
  tracksPerCharacter: 128,
  keyframesPerTrack: 4096,
  textLength: 256,
  frame: 1_000_000
});

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const ATTACHMENT_KINDS = new Set(["placeholder_sword", "placeholder_item_cube", "obj"]);
const BONE_INTERPOLATIONS = new Set<BoneInterpolation>([
  "constant",
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut"
]);

export interface RigContractIssue {
  code: string;
  path: string;
  message: string;
}

export interface ReconciledRigAnimation {
  characters: CharacterEntity[];
  tracks: AnimationTrack[];
}

function issue(code: string, path: string, message: string): RigContractIssue {
  return Object.freeze({ code, path, message });
}

function validId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function validText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= RIG_CONTRACT_LIMITS.textLength;
}

export function sanitizeRigVector(
  value: unknown,
  fallback: RigVector3Tuple = [0, 0, 0]
): RigVector3Tuple {
  if (!Array.isArray(value) || value.length !== 3 || value.some((item) => typeof item !== "number" || !Number.isFinite(item))) {
    return [...fallback];
  }
  return [value[0], value[1], value[2]];
}

export function validateRigDefinition(definition: RigDefinition): readonly RigContractIssue[] {
  const issues: RigContractIssue[] = [];
  if (!validId(definition.id)) issues.push(issue("RIG_ID_INVALID", "id", "Rig ID is invalid."));
  if (!validText(definition.name)) issues.push(issue("RIG_NAME_INVALID", "name", "Rig name is invalid."));
  if (!Array.isArray(definition.bones) || definition.bones.length === 0 || definition.bones.length > RIG_CONTRACT_LIMITS.bones) {
    issues.push(issue("RIG_BONE_COUNT_INVALID", "bones", "Rig bone count is outside supported bounds."));
    return Object.freeze(issues);
  }
  const ids = new Set<string>();
  for (const [index, bone] of definition.bones.entries()) {
    const path = `bones.${index}`;
    if (!validId(bone.id)) issues.push(issue("RIG_BONE_ID_INVALID", `${path}.id`, "Bone ID is invalid."));
    else if (ids.has(bone.id)) issues.push(issue("RIG_BONE_ID_DUPLICATE", `${path}.id`, "Bone ID is duplicated."));
    ids.add(bone.id);
    if (!validText(bone.label)) issues.push(issue("RIG_BONE_LABEL_INVALID", `${path}.label`, "Bone label is invalid."));
    for (const [field, vector] of [["size", bone.size], ["pivot", bone.pivot], ["offset", bone.offset]] as const) {
      if (!Array.isArray(vector) || vector.length !== 3 || vector.some((value) => !Number.isFinite(value))) {
        issues.push(issue("RIG_BONE_VECTOR_INVALID", `${path}.${field}`, "Bone vector must contain three finite numbers."));
      }
    }
  }
  for (const [index, bone] of definition.bones.entries()) {
    if (bone.parentId !== null && !ids.has(bone.parentId)) {
      issues.push(issue("RIG_BONE_PARENT_MISSING", `bones.${index}.parentId`, "Bone parent does not exist."));
    }
    if (bone.mirrorOf !== undefined && !ids.has(bone.mirrorOf)) {
      issues.push(issue("RIG_BONE_MIRROR_MISSING", `bones.${index}.mirrorOf`, "Mirrored bone does not exist."));
    }
    const visited = new Set([bone.id]);
    let parentId = bone.parentId;
    while (parentId !== null) {
      if (visited.has(parentId)) {
        issues.push(issue("RIG_BONE_CYCLE", `bones.${index}.parentId`, "Bone hierarchy contains a cycle."));
        break;
      }
      visited.add(parentId);
      parentId = definition.bones.find((candidate) => candidate.id === parentId)?.parentId ?? null;
    }
  }
  const attachmentIds = new Set<string>();
  for (const [index, point] of definition.attachmentPoints.entries()) {
    if (attachmentIds.has(point.id)) issues.push(issue("RIG_ATTACHMENT_POINT_DUPLICATE", `attachmentPoints.${index}.id`, "Attachment point is duplicated."));
    attachmentIds.add(point.id);
    if (!ids.has(point.boneId)) issues.push(issue("RIG_ATTACHMENT_BONE_MISSING", `attachmentPoints.${index}.boneId`, "Attachment point bone does not exist."));
  }
  return Object.freeze(issues);
}

export function sanitizeRigAttachments(
  value: unknown,
  definition: RigDefinition,
  fallback: readonly CharacterAttachment[]
): CharacterAttachment[] {
  if (!Array.isArray(value)) return fallback.map((attachment) => ({ ...attachment }));
  const validPoints = new Set(definition.attachmentPoints.map((point) => point.id));
  const ids = new Set<string>();
  return value.slice(0, RIG_CONTRACT_LIMITS.attachments).flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const attachment = candidate as Partial<CharacterAttachment>;
    if (!validId(attachment.id) || ids.has(attachment.id) || !validText(attachment.name) || !validPoints.has(attachment.pointId as never) || !ATTACHMENT_KINDS.has(attachment.kind as string)) return [];
    if (attachment.kind === "obj" && !validId(attachment.assetId)) return [];
    ids.add(attachment.id);
    return [{
      id: attachment.id,
      name: attachment.name,
      pointId: attachment.pointId!,
      kind: attachment.kind!,
      ...(attachment.assetId === undefined ? {} : { assetId: attachment.assetId }),
      visible: attachment.visible === true
    }];
  });
}

export function sanitizeRigPose(value: unknown, index = 0): RigPose | null {
  if (!value || typeof value !== "object") return null;
  const pose = value as Partial<RigPose>;
  if (!validId(pose.id) || !validText(pose.name)) return null;
  const rotations: Record<string, RigVector3Tuple> = {};
  for (const [boneId, rotation] of Object.entries(pose.boneRotations ?? {}).slice(0, RIG_CONTRACT_LIMITS.bones)) {
    if (validId(boneId)) rotations[boneId] = sanitizeRigVector(rotation);
  }
  return {
    id: pose.id || `pose_${index}`,
    name: pose.name,
    description: typeof pose.description === "string" ? pose.description.slice(0, RIG_CONTRACT_LIMITS.textLength) : "",
    boneRotations: rotations
  };
}

function toGlobalInterpolation(value: BoneInterpolation): KeyframeInterpolation {
  if (value === "easeIn") return "ease-in";
  if (value === "easeOut") return "ease-out";
  if (value === "easeInOut") return "ease-in-out";
  return value;
}

function toLegacyInterpolation(value: KeyframeInterpolation | undefined): BoneInterpolation {
  if (value === "ease-in") return "easeIn";
  if (value === "ease-out") return "easeOut";
  if (value === "ease-in-out" || value === "bezier") return "easeInOut";
  return value === "constant" ? "constant" : "linear";
}

function sanitizeFrame(value: unknown, durationFrames: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(Math.max(0, Math.round(value)), Math.min(RIG_CONTRACT_LIMITS.frame, Math.max(0, durationFrames)));
}

function legacyTrackToGlobal(
  character: CharacterEntity,
  track: BoneAnimationTrack,
  durationFrames: number
): AnimationTrack | null {
  if (!validId(track.boneId) || !Array.isArray(track.keyframes)) return null;
  const property = `bone.rotation.${track.boneId}` as const;
  const keyframes = track.keyframes.slice(0, RIG_CONTRACT_LIMITS.keyframesPerTrack).flatMap((keyframe) => {
    const frame = sanitizeFrame(keyframe.frame, durationFrames);
    if (frame === null) return [];
    return [{ frame, value: sanitizeRigVector(keyframe.rotation), interpolation: BONE_INTERPOLATIONS.has(keyframe.interpolation) ? toGlobalInterpolation(keyframe.interpolation) : "linear" as const }];
  });
  if (keyframes.length === 0) return null;
  return { id: `${character.id}:${property}`, targetId: character.id, property, keyframes };
}

function globalTracksToLegacy(
  characterId: string,
  tracks: readonly AnimationTrack[]
): BoneAnimationTrack[] {
  return tracks
    .filter((track) => track.targetId === characterId && track.property.startsWith("bone.rotation."))
    .slice(0, RIG_CONTRACT_LIMITS.tracksPerCharacter)
    .map((track) => {
      const boneId = track.property.slice("bone.rotation.".length);
      return {
        id: `bone:${boneId}`,
        boneId,
        keyframes: track.keyframes.slice(0, RIG_CONTRACT_LIMITS.keyframesPerTrack).map((keyframe) => ({
          frame: keyframe.frame,
          rotation: sanitizeRigVector(keyframe.value),
          interpolation: toLegacyInterpolation(keyframe.interpolation)
        }))
      };
    });
}

export function reconcileRigAnimation(
  characters: readonly CharacterEntity[],
  tracks: readonly AnimationTrack[],
  durationFrames: number
): ReconciledRigAnimation {
  const characterIds = new Set(characters.map((character) => character.id));
  const rigTracks = new Map<string, AnimationTrack>();
  const trackOrder: Array<AnimationTrack | string> = [];
  for (const track of tracks) {
    if (!track.property.startsWith("bone.rotation.")) {
      trackOrder.push(track);
      continue;
    }
    if (!characterIds.has(track.targetId) || !Array.isArray(track.keyframes)) continue;
    const boneId = track.property.slice("bone.rotation.".length);
    if (!validId(boneId)) continue;
    const key = `${track.targetId}\u0000${boneId}`;
    const existing = rigTracks.get(key);
    if (!existing) trackOrder.push(key);
    const merged = [...(existing?.keyframes ?? []), ...track.keyframes]
      .flatMap((keyframe) => {
        const frame = sanitizeFrame(keyframe.frame, durationFrames);
        if (frame === null) return [];
        return [{ ...keyframe, frame, value: sanitizeRigVector(keyframe.value) }];
      });
    const byFrame = new Map<number, (typeof merged)[number]>();
    for (const keyframe of merged) if (!byFrame.has(keyframe.frame)) byFrame.set(keyframe.frame, keyframe);
    rigTracks.set(key, {
      ...(existing ?? track),
      targetId: track.targetId,
      property: `bone.rotation.${boneId}`,
      keyframes: [...byFrame.values()].sort((left, right) => left.frame - right.frame).slice(0, RIG_CONTRACT_LIMITS.keyframesPerTrack)
    });
  }
  for (const character of characters) {
    for (const legacy of (character.boneKeyframes ?? []).slice(0, RIG_CONTRACT_LIMITS.tracksPerCharacter)) {
      const key = `${character.id}\u0000${legacy.boneId}`;
      const converted = legacyTrackToGlobal(character, legacy, durationFrames);
      if (!converted) continue;
      const existing = rigTracks.get(key);
      if (!existing) {
        rigTracks.set(key, converted);
        trackOrder.push(key);
        continue;
      }
      const byFrame = new Map(existing.keyframes.map((keyframe) => [keyframe.frame, keyframe]));
      for (const keyframe of converted.keyframes) if (!byFrame.has(keyframe.frame)) byFrame.set(keyframe.frame, keyframe);
      rigTracks.set(key, { ...existing, keyframes: [...byFrame.values()].sort((left, right) => left.frame - right.frame) });
    }
  }
  const consolidatedTracks = trackOrder.flatMap((entry) =>
    typeof entry === "string" ? (rigTracks.has(entry) ? [rigTracks.get(entry)!] : []) : [entry]
  );
  return {
    tracks: consolidatedTracks,
    characters: characters.map((character) => ({
      ...character,
      boneKeyframes: globalTracksToLegacy(character.id, consolidatedTracks)
    }))
  };
}
