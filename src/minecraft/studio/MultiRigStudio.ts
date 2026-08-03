import type { AnimationTrack, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import type { MinecraftEntityCatalogEntry } from "./MinecraftStudioTypes";
import { createRigGroup, spawnCatalogEntity, type MultiRigOperationResult } from "./MultiRigAnimator";

export const RIG_GROUP_FORMATIONS = ["line", "grid", "circle", "semicircle", "column", "battle-lines"] as const;
export type RigGroupFormation = (typeof RIG_GROUP_FORMATIONS)[number];

export interface CrowdSpawnOptions {
  count: number;
  origin?: Vector3Tuple;
  spacing?: number;
  columns?: number;
  groupName?: string;
}

export function spawnRigCrowd(project: MineMotionProject, entry: MinecraftEntityCatalogEntry, options: CrowdSpawnOptions): MultiRigOperationResult {
  const count = Math.max(1, Math.min(128, Math.round(options.count)));
  const origin = options.origin ?? [0, 1.05, 0];
  const spacing = Math.max(0.25, Math.min(16, options.spacing ?? 1.6));
  const columns = Math.max(1, Math.min(32, Math.round(options.columns ?? Math.ceil(Math.sqrt(count)))));
  let next = project;
  const ids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const spawned = spawnCatalogEntity(next, entry, [origin[0] + column * spacing, origin[1], origin[2] + row * spacing]);
    next = spawned.project;
    ids.push(...spawned.affectedCharacterIds);
  }
  const grouped = createRigGroup(next, options.groupName ?? `${entry.name} Crowd`, ids);
  return { ...grouped, affectedCharacterIds: ids };
}

export function arrangeRigGroup(project: MineMotionProject, groupId: string, formation: RigGroupFormation, origin: Vector3Tuple = [0, 1.05, 0], spacing = 1.8): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  const positions = formationPositions(formation, group.characterIds.length, origin, Math.max(0.25, Math.min(16, spacing)));
  const characters = project.scene.characters.map((character) => {
    const index = group.characterIds.indexOf(character.id);
    if (index < 0) return character;
    const position = positions[index] ?? character.transform.position;
    const yaw = Math.atan2(origin[0] - position[0], origin[2] - position[2]);
    return { ...character, transform: { ...character.transform, position, rotation: [character.transform.rotation[0], yaw, character.transform.rotation[2]] as Vector3Tuple } };
  });
  return { project: { ...project, scene: { ...project.scene, characters }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } }, changed: true, groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: [] };
}

export function animateRigGroupTranslation(project: MineMotionProject, groupId: string, offset: Vector3Tuple, startFrame: number, durationFrames: number): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  const start = Math.max(0, Math.round(startFrame));
  const duration = Math.max(1, Math.round(durationFrames));
  let tracks = [...project.animation.tracks];
  const affected: string[] = [];
  for (const characterId of group.characterIds) {
    const character = project.scene.characters.find((candidate) => candidate.id === characterId);
    if (!character) continue;
    const id = `${characterId}:transform.position`;
    const existing = tracks.find((track) => track.id === id);
    const keyframes = [...(existing?.keyframes ?? [])].filter((keyframe) => keyframe.frame !== start && keyframe.frame !== start + duration);
    keyframes.push(
      { frame: start, value: [...character.transform.position], interpolation: "ease-in-out" },
      { frame: start + duration, value: [character.transform.position[0] + offset[0], character.transform.position[1] + offset[1], character.transform.position[2] + offset[2]], interpolation: "ease-in-out" }
    );
    const track: AnimationTrack = { id, targetId: characterId, property: "transform.position", keyframes: keyframes.sort((a, b) => a.frame - b.frame) };
    tracks = existing ? tracks.map((candidate) => candidate.id === id ? track : candidate) : [...tracks, track];
    affected.push(id);
  }
  const endFrame = start + duration;
  return {
    project: { ...project, animation: { ...project.animation, tracks, durationFrames: Math.max(project.animation.durationFrames, endFrame + 1) }, projectSettings: { ...project.projectSettings, durationFrames: Math.max(project.projectSettings.durationFrames, endFrame + 1) }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } },
    changed: affected.length > 0,
    groupId,
    affectedCharacterIds: group.characterIds,
    affectedTrackIds: affected
  };
}

export function retimeRigGroup(project: MineMotionProject, groupId: string, sourceStart: number, sourceEnd: number, targetStart: number, targetEnd: number): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group || sourceEnd <= sourceStart || targetEnd <= targetStart) return unchanged(project);
  const sourceDuration = sourceEnd - sourceStart;
  const targetDuration = targetEnd - targetStart;
  const affected = project.animation.tracks.filter((track) => group.characterIds.includes(track.targetId));
  const ids = new Set(affected.map((track) => track.id));
  const tracks = project.animation.tracks.map((track) => ids.has(track.id) ? {
    ...track,
    keyframes: track.keyframes.map((keyframe) => keyframe.frame >= sourceStart && keyframe.frame <= sourceEnd
      ? { ...keyframe, frame: Math.round(targetStart + (keyframe.frame - sourceStart) / sourceDuration * targetDuration) }
      : keyframe).sort((a, b) => a.frame - b.frame)
  } : track);
  return { project: { ...project, animation: { ...project.animation, tracks, durationFrames: Math.max(project.animation.durationFrames, targetEnd + 1) }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } }, changed: ids.size > 0, groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: [...ids] };
}

export function addRigGroupTimingVariation(project: MineMotionProject, groupId: string, maximumOffsetFrames = 4): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  const maximum = Math.max(0, Math.min(60, Math.round(maximumOffsetFrames)));
  const affected = new Set<string>();
  const tracks = project.animation.tracks.map((track) => {
    const index = group.characterIds.indexOf(track.targetId);
    if (index < 0) return track;
    const offset = deterministicOffset(`${group.id}:${track.targetId}`, maximum);
    affected.add(track.id);
    return { ...track, keyframes: track.keyframes.map((keyframe) => ({ ...keyframe, frame: Math.max(0, keyframe.frame + offset) })).sort((a, b) => a.frame - b.frame) };
  });
  return { project: { ...project, animation: { ...project.animation, tracks }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } }, changed: affected.size > 0, groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: [...affected] };
}

export function faceRigGroupTarget(project: MineMotionProject, groupId: string, target: Vector3Tuple): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  const characters = project.scene.characters.map((character) => {
    if (!group.characterIds.includes(character.id)) return character;
    const yaw = Math.atan2(target[0] - character.transform.position[0], target[2] - character.transform.position[2]);
    return { ...character, transform: { ...character.transform, rotation: [character.transform.rotation[0], yaw, character.transform.rotation[2]] as Vector3Tuple } };
  });
  return { project: { ...project, scene: { ...project.scene, characters }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } }, changed: true, groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: [] };
}

export function muteRigGroupAnimation(project: MineMotionProject, groupId: string, muted: boolean): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  const targetIds = new Set(group.characterIds);
  const nlaTracks = project.animation.nlaTracks.map((track) => targetIds.has(track.targetId) ? { ...track, muted } : track);
  return { project: { ...project, animation: { ...project.animation, nlaTracks }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } }, changed: nlaTracks.some((track, index) => track.muted !== project.animation.nlaTracks[index]?.muted), groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: nlaTracks.filter((track) => targetIds.has(track.targetId)).map((track) => track.id) };
}

export function removeRigGroupAnimation(project: MineMotionProject, groupId: string): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  const ids = new Set(group.characterIds);
  const removed = project.animation.tracks.filter((track) => ids.has(track.targetId)).map((track) => track.id);
  return { project: { ...project, animation: { ...project.animation, tracks: project.animation.tracks.filter((track) => !ids.has(track.targetId)), nlaTracks: project.animation.nlaTracks.filter((track) => !ids.has(track.targetId)) }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } }, changed: removed.length > 0, groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: removed };
}

function formationPositions(formation: RigGroupFormation, count: number, origin: Vector3Tuple, spacing: number): Vector3Tuple[] {
  if (count <= 0) return [];
  if (formation === "line") return Array.from({ length: count }, (_, index) => [origin[0] + (index - (count - 1) / 2) * spacing, origin[1], origin[2]]);
  if (formation === "column") return Array.from({ length: count }, (_, index) => [origin[0], origin[1], origin[2] + index * spacing]);
  if (formation === "circle" || formation === "semicircle") {
    const span = formation === "circle" ? Math.PI * 2 : Math.PI;
    const radius = Math.max(spacing, count * spacing / (formation === "circle" ? Math.PI * 2 : Math.PI));
    return Array.from({ length: count }, (_, index) => { const angle = count === 1 ? 0 : -span / 2 + index / (formation === "circle" ? count : count - 1) * span; return [origin[0] + Math.sin(angle) * radius, origin[1], origin[2] + Math.cos(angle) * radius]; });
  }
  if (formation === "battle-lines") return Array.from({ length: count }, (_, index) => { const side = index % 2 === 0 ? -1 : 1; const rank = Math.floor(index / 2); return [origin[0] + side * spacing * 1.5, origin[1], origin[2] + (rank - Math.floor(count / 4)) * spacing]; });
  const columns = Math.ceil(Math.sqrt(count));
  return Array.from({ length: count }, (_, index) => [origin[0] + (index % columns - (columns - 1) / 2) * spacing, origin[1], origin[2] + Math.floor(index / columns) * spacing]);
}
function deterministicOffset(value: string, maximum: number): number { let hash = 2166136261; for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return maximum === 0 ? 0 : Math.abs(hash) % (maximum * 2 + 1) - maximum; }
function unchanged(project: MineMotionProject): MultiRigOperationResult { return { project, changed: false, groupId: null, affectedCharacterIds: [], affectedTrackIds: [] }; }
