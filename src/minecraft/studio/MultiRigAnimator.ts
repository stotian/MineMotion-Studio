import type { AnimationTrack, CharacterEntity, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { createCharacter, createId } from "../../project/ProjectStore";
import { RIG_ANIMATION_PRESETS } from "../../rigs/AnimationPresetLibrary";
import { mirrorRotation } from "../../rigs/BoneTransform";
import { getDefaultBoneRotations } from "../../rigs/RigDefinition";
import { getRigDefinition } from "../../rigs/MinecraftRigPresets";
import type { RigAnimationClip, RigPresetId } from "../../rigs/RigTypes";
import type { MinecraftEntityCatalogEntry, MultiRigGroup } from "./MinecraftStudioTypes";

export interface MultiRigOperationResult {
  project: MineMotionProject;
  changed: boolean;
  groupId: string | null;
  affectedCharacterIds: string[];
  affectedTrackIds: string[];
}

export function spawnCatalogEntity(project: MineMotionProject, entry: MinecraftEntityCatalogEntry, position: Vector3Tuple = [0, 1.05, 0]): MultiRigOperationResult {
  const character = createCharacter(entry.name, position);
  const definition = getRigDefinition(entry.rigPresetId);
  const next: CharacterEntity = {
    ...character,
    rigPreset: entry.rigPresetId,
    modelType: entry.modelType,
    boneRotations: getDefaultBoneRotations(definition),
    metadata: { ...character.metadata, catalogEntityId: entry.id, namespace: entry.namespace, source: entry.source, modId: entry.modId ?? "" }
  };
  return { project: { ...project, scene: { ...project.scene, characters: [...project.scene.characters, next] } }, changed: true, groupId: null, affectedCharacterIds: [next.id], affectedTrackIds: [] };
}

export function createRigGroup(project: MineMotionProject, name: string, characterIds: string[]): MultiRigOperationResult {
  const validIds = [...new Set(characterIds)].filter((id) => project.scene.characters.some((character) => character.id === id)).slice(0, 256);
  if (validIds.length === 0) return unchanged(project);
  const group: MultiRigGroup = {
    id: createId("rig_group"),
    name: name.trim().slice(0, 120) || `Rig group ${project.creationSuite.rigGroups.length + 1}`,
    characterIds: validIds,
    defaultPresetId: "walk-cycle",
    staggerFrames: 0,
    mirrorAlternating: false,
    speed: 1,
    createdAt: new Date().toISOString()
  };
  return {
    project: { ...project, creationSuite: { ...project.creationSuite, rigGroups: [...project.creationSuite.rigGroups, group], workspace: { ...project.creationSuite.workspace, selectedRigGroupId: group.id, activeTab: "rig" } } },
    changed: true,
    groupId: group.id,
    affectedCharacterIds: validIds,
    affectedTrackIds: []
  };
}

export function updateRigGroup(project: MineMotionProject, groupId: string, patch: Partial<MultiRigGroup>): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  const validIds = patch.characterIds ? [...new Set(patch.characterIds)].filter((id) => project.scene.characters.some((character) => character.id === id)).slice(0, 256) : group.characterIds;
  const nextGroup: MultiRigGroup = {
    ...group,
    ...patch,
    id: group.id,
    characterIds: validIds,
    name: patch.name?.trim().slice(0, 120) || group.name,
    staggerFrames: patch.staggerFrames === undefined ? group.staggerFrames : Math.max(0, Math.min(2400, Math.round(patch.staggerFrames))),
    speed: patch.speed === undefined ? group.speed : Math.max(0.05, Math.min(20, patch.speed))
  };
  return { project: { ...project, creationSuite: { ...project.creationSuite, rigGroups: project.creationSuite.rigGroups.map((candidate) => candidate.id === groupId ? nextGroup : candidate) } }, changed: true, groupId, affectedCharacterIds: validIds, affectedTrackIds: [] };
}

export function deleteRigGroup(project: MineMotionProject, groupId: string): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  return { project: { ...project, creationSuite: { ...project.creationSuite, rigGroups: project.creationSuite.rigGroups.filter((candidate) => candidate.id !== groupId), workspace: { ...project.creationSuite.workspace, selectedRigGroupId: project.creationSuite.workspace.selectedRigGroupId === groupId ? null : project.creationSuite.workspace.selectedRigGroupId } } }, changed: true, groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: [] };
}

export function applyPresetToRigGroup(project: MineMotionProject, groupId: string, presetId?: string, startFrame = project.animation.currentFrame): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  const clip = RIG_ANIMATION_PRESETS.find((candidate) => candidate.id === (presetId ?? group?.defaultPresetId));
  if (!group || !clip) return unchanged(project);
  let tracks = [...project.animation.tracks];
  const affectedTrackIds = new Set<string>();
  group.characterIds.forEach((characterId, characterIndex) => {
    const character = project.scene.characters.find((candidate) => candidate.id === characterId);
    if (!character) return;
    const definition = getRigDefinition(character.rigPreset);
    const validBones = new Set(definition.bones.map((bone) => bone.id));
    const offset = startFrame + group.staggerFrames * characterIndex;
    const mirrored = group.mirrorAlternating && characterIndex % 2 === 1;
    for (const keyframe of clip.keyframes) {
      for (const [boneId, rotation] of Object.entries(keyframe.boneRotations)) {
        if (!validBones.has(boneId)) continue;
        const property = `bone.rotation.${boneId}` as const;
        const trackId = `${characterId}:${property}`;
        const frame = offset + Math.round(keyframe.frame / group.speed);
        const value = mirrored ? mirrorRotation(rotation) : [...rotation] as Vector3Tuple;
        tracks = upsertVectorKeyframe(tracks, trackId, characterId, property, frame, value);
        affectedTrackIds.add(trackId);
      }
    }
  });
  const duration = Math.max(1, Math.round(clip.durationFrames / group.speed)) + Math.max(0, group.characterIds.length - 1) * group.staggerFrames;
  return {
    project: {
      ...project,
      rigs: { ...project.rigs, animationClips: mergeClip(project.rigs.animationClips, clip) },
      animation: { ...project.animation, tracks, durationFrames: Math.max(project.animation.durationFrames, startFrame + duration) },
      projectSettings: { ...project.projectSettings, durationFrames: Math.max(project.projectSettings.durationFrames, startFrame + duration) }
    },
    changed: affectedTrackIds.size > 0,
    groupId,
    affectedCharacterIds: group.characterIds,
    affectedTrackIds: [...affectedTrackIds]
  };
}

export function synchronizeRigGroupPose(project: MineMotionProject, groupId: string, sourceCharacterId?: string): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  const source = project.scene.characters.find((candidate) => candidate.id === (sourceCharacterId ?? group?.characterIds[0]));
  if (!group || !source) return unchanged(project);
  const characters = project.scene.characters.map((character) => {
    if (!group.characterIds.includes(character.id) || character.id === source.id) return character;
    const validBones = new Set(getRigDefinition(character.rigPreset).bones.map((bone) => bone.id));
    return { ...character, boneRotations: Object.fromEntries(Object.entries(source.boneRotations).filter(([boneId]) => validBones.has(boneId)).map(([boneId, rotation]) => [boneId, [...rotation] as Vector3Tuple])) };
  });
  return { project: { ...project, scene: { ...project.scene, characters } }, changed: true, groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: [] };
}

export function mirrorRigGroupPose(project: MineMotionProject, groupId: string): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  const characters = project.scene.characters.map((character) => {
    if (!group.characterIds.includes(character.id)) return character;
    const definition = getRigDefinition(character.rigPreset);
    const rotations = { ...character.boneRotations };
    for (const bone of definition.bones) {
      if (!bone.mirrorOf || bone.id > bone.mirrorOf) continue;
      rotations[bone.id] = mirrorRotation(character.boneRotations[bone.mirrorOf] ?? [0, 0, 0]);
      rotations[bone.mirrorOf] = mirrorRotation(character.boneRotations[bone.id] ?? [0, 0, 0]);
    }
    return { ...character, boneRotations: rotations };
  });
  return { project: { ...project, scene: { ...project.scene, characters } }, changed: true, groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: [] };
}

export function offsetRigGroupAnimation(project: MineMotionProject, groupId: string, offsetFrames: number): MultiRigOperationResult {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) return unchanged(project);
  const offset = Math.round(offsetFrames);
  const affected = project.animation.tracks.filter((track) => group.characterIds.includes(track.targetId) && track.property.startsWith("bone.rotation.")).map((track) => track.id);
  if (affected.length === 0 || offset === 0) return unchanged(project);
  const tracks = project.animation.tracks.map((track) => affected.includes(track.id) ? { ...track, keyframes: track.keyframes.map((keyframe) => ({ ...keyframe, frame: Math.max(0, keyframe.frame + offset) })).sort((a, b) => a.frame - b.frame) } : track);
  return { project: { ...project, animation: { ...project.animation, tracks } }, changed: true, groupId, affectedCharacterIds: group.characterIds, affectedTrackIds: affected };
}

export function createRigGroupManifest(project: MineMotionProject, groupId: string): string {
  const group = project.creationSuite.rigGroups.find((candidate) => candidate.id === groupId);
  if (!group) throw new Error("Rig group not found.");
  return JSON.stringify({ schemaVersion: 1, group, characters: project.scene.characters.filter((character) => group.characterIds.includes(character.id)).map((character) => ({ id: character.id, name: character.name, rigPreset: character.rigPreset, modelType: character.modelType })) }, null, 2);
}

function upsertVectorKeyframe(tracks: AnimationTrack[], id: string, targetId: string, property: AnimationTrack["property"], frame: number, value: Vector3Tuple): AnimationTrack[] {
  const existing = tracks.find((track) => track.id === id);
  const keyframes = [...(existing?.keyframes ?? [])].filter((keyframe) => keyframe.frame !== frame);
  keyframes.push({ frame, value, interpolation: "ease-in-out" });
  const next: AnimationTrack = { id, targetId, property, keyframes: keyframes.sort((a, b) => a.frame - b.frame) };
  return existing ? tracks.map((track) => track.id === id ? next : track) : [...tracks, next];
}
function mergeClip(clips: RigAnimationClip[], clip: RigAnimationClip): RigAnimationClip[] { return clips.some((candidate) => candidate.id === clip.id) ? clips : [...clips, clip]; }
function unchanged(project: MineMotionProject): MultiRigOperationResult { return { project, changed: false, groupId: null, affectedCharacterIds: [], affectedTrackIds: [] }; }

export const VANILLA_RIG_PRESET_IDS: readonly RigPresetId[] = ["steve", "alex", "zombie", "skeleton", "creeper", "enderman", "villager", "pig", "cow", "wolf", "spider"];
