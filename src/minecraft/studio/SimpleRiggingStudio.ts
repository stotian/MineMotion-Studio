import type { CharacterEntity, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { createCharacter, createId } from "../../project/ProjectStore";
import { getDefaultBoneRotations } from "../../rigs/RigDefinition";
import { getRigDefinition } from "../../rigs/MinecraftRigPresets";
import type { CharacterCustomGeometry, RigPresetId, RiggedVoxelCube } from "../../rigs/RigTypes";
import type { VoxelModelAsset, VoxelModelCube } from "./MinecraftStudioTypes";

export interface SimpleRiggingResult {
  project: MineMotionProject;
  changed: boolean;
  characterId: string | null;
  assignedCubes: number;
  warnings: string[];
}

export interface SimpleRigValidationReport {
  characterId: string;
  valid: boolean;
  cubes: number;
  unassignedCubeIds: string[];
  missingBoneIds: string[];
  emptyBoneIds: string[];
  warnings: string[];
}

interface ModelBounds {
  min: Vector3Tuple;
  max: Vector3Tuple;
  center: Vector3Tuple;
  size: Vector3Tuple;
}

export function autoRigVoxelModel(
  project: MineMotionProject,
  modelId: string,
  rigPreset: RigPresetId = "generic_blocky",
  name?: string,
  position: Vector3Tuple = [0, 1.05, 0]
): SimpleRiggingResult {
  const model = project.creationSuite.models.find((entry) => entry.id === modelId);
  if (!model || model.cubes.length === 0) return unchanged(project, ["Select a non-empty voxel model before auto-rigging."]);
  const definition = getRigDefinition(rigPreset);
  const bounds = computeBounds(model);
  const character = createCharacter(name?.trim() || `${model.name} Rig`, position);
  const geometry: CharacterCustomGeometry = {
    schemaVersion: 1,
    sourceModelId: model.id,
    hideDefaultGeometry: true,
    cubes: model.cubes.slice(0, 4096).map((cube) => mapCubeToRig(cube, bounds, definition.bones.map((bone) => bone.id)))
  };
  const rigged: CharacterEntity = {
    ...character,
    rigPreset,
    modelType: definition.modelType,
    boneRotations: getDefaultBoneRotations(definition),
    customGeometry: geometry,
    metadata: {
      ...character.metadata,
      sourceVoxelModelId: model.id,
      simpleRig: true
    }
  };
  return {
    project: {
      ...project,
      scene: { ...project.scene, characters: [...project.scene.characters, rigged] },
      creationSuite: {
        ...project.creationSuite,
        workspace: { ...project.creationSuite.workspace, activeTab: "rig" }
      }
    },
    changed: true,
    characterId: rigged.id,
    assignedCubes: geometry.cubes.length,
    warnings: geometry.cubes.length < model.cubes.length ? ["The rig contract limited geometry to 4096 cubes."] : []
  };
}

export function rebindRiggedCube(
  project: MineMotionProject,
  characterId: string,
  cubeId: string,
  boneId: string
): SimpleRiggingResult {
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  if (!character?.customGeometry) return unchanged(project, ["The selected character has no editable voxel rig geometry."]);
  const validBones = new Set(getRigDefinition(character.rigPreset).bones.map((bone) => bone.id));
  if (!validBones.has(boneId)) return unchanged(project, [`Unknown target bone: ${boneId}`]);
  let changed = false;
  const cubes = character.customGeometry.cubes.map((cube) => {
    if (cube.id !== cubeId || cube.boneId === boneId) return cube;
    changed = true;
    return { ...cube, boneId };
  });
  if (!changed) return unchanged(project);
  return updateGeometry(project, characterId, { ...character.customGeometry, cubes }, [cubeId]);
}

export function updateRiggedCube(
  project: MineMotionProject,
  characterId: string,
  cubeId: string,
  patch: Partial<Omit<RiggedVoxelCube, "id">>
): SimpleRiggingResult {
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  if (!character?.customGeometry) return unchanged(project);
  const validBones = new Set(getRigDefinition(character.rigPreset).bones.map((bone) => bone.id));
  let changed = false;
  const cubes = character.customGeometry.cubes.map((cube) => {
    if (cube.id !== cubeId) return cube;
    changed = true;
    return {
      ...cube,
      ...patch,
      id: cube.id,
      boneId: patch.boneId && validBones.has(patch.boneId) ? patch.boneId : cube.boneId,
      position: patch.position ? finiteVector(patch.position, cube.position) : cube.position,
      size: patch.size ? positiveVector(patch.size, cube.size) : cube.size,
      color: patch.color && /^#[0-9a-f]{6}$/i.test(patch.color) ? patch.color : cube.color
    };
  });
  if (!changed) return unchanged(project);
  return updateGeometry(project, characterId, { ...character.customGeometry, cubes }, [cubeId]);
}

export function setRiggedGeometryVisible(
  project: MineMotionProject,
  characterId: string,
  hideDefaultGeometry: boolean
): SimpleRiggingResult {
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  if (!character?.customGeometry || character.customGeometry.hideDefaultGeometry === hideDefaultGeometry) return unchanged(project);
  return updateGeometry(project, characterId, { ...character.customGeometry, hideDefaultGeometry }, character.customGeometry.cubes.map((cube) => cube.id));
}

export function detachRiggedGeometry(project: MineMotionProject, characterId: string): SimpleRiggingResult {
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  if (!character?.customGeometry) return unchanged(project);
  const characters = project.scene.characters.map((entry) => entry.id === characterId ? { ...entry, customGeometry: undefined } : entry);
  return { project: { ...project, scene: { ...project.scene, characters } }, changed: true, characterId, assignedCubes: 0, warnings: [] };
}

export function refreshRiggedGeometryFromModel(project: MineMotionProject, characterId: string): SimpleRiggingResult {
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  const modelId = character?.customGeometry?.sourceModelId;
  const model = modelId ? project.creationSuite.models.find((entry) => entry.id === modelId) : null;
  if (!character?.customGeometry || !model || model.cubes.length === 0) return unchanged(project, ["The source voxel model is missing or empty."]);
  const definition = getRigDefinition(character.rigPreset);
  const bounds = computeBounds(model);
  const previousAssignments = new Map(character.customGeometry.cubes.map((cube) => [cube.id, cube.boneId]));
  const cubes = model.cubes.slice(0, 4096).map((cube) => {
    const mapped = mapCubeToRig(cube, bounds, definition.bones.map((bone) => bone.id));
    const previous = previousAssignments.get(cube.id);
    return previous && definition.bones.some((bone) => bone.id === previous) ? { ...mapped, boneId: previous } : mapped;
  });
  return updateGeometry(project, characterId, { ...character.customGeometry, cubes }, cubes.map((cube) => cube.id));
}

export function validateSimpleRig(project: MineMotionProject, characterId: string): SimpleRigValidationReport {
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  const definition = character ? getRigDefinition(character.rigPreset) : null;
  const geometry = character?.customGeometry;
  if (!character || !definition || !geometry) {
    return { characterId, valid: false, cubes: 0, unassignedCubeIds: [], missingBoneIds: [], emptyBoneIds: [], warnings: ["Character does not contain simple rig geometry."] };
  }
  const validBones = new Set(definition.bones.map((bone) => bone.id));
  const unassignedCubeIds = geometry.cubes.filter((cube) => !validBones.has(cube.boneId)).map((cube) => cube.id);
  const missingBoneIds = [...new Set(unassignedCubeIds.flatMap((id) => geometry.cubes.find((cube) => cube.id === id)?.boneId ?? []))];
  const used = new Set(geometry.cubes.map((cube) => cube.boneId));
  const emptyBoneIds = definition.bones.filter((bone) => bone.id !== "root" && !used.has(bone.id)).map((bone) => bone.id);
  const warnings: string[] = [];
  if (geometry.cubes.length > 1200) warnings.push("This rig is dense; optimize or merge voxel cubes for real-time playback.");
  if (emptyBoneIds.length > Math.max(2, definition.bones.length / 2)) warnings.push("Most bones do not own geometry; review automatic assignments.");
  return { characterId, valid: unassignedCubeIds.length === 0 && geometry.cubes.length > 0, cubes: geometry.cubes.length, unassignedCubeIds, missingBoneIds, emptyBoneIds, warnings };
}

export function exportSimpleRigManifest(project: MineMotionProject, characterId: string): string {
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  if (!character?.customGeometry) throw new Error("Simple rig geometry not found.");
  return JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    character: {
      id: character.id,
      name: character.name,
      rigPreset: character.rigPreset,
      transform: character.transform,
      customGeometry: character.customGeometry
    },
    validation: validateSimpleRig(project, characterId)
  }, null, 2);
}

function updateGeometry(
  project: MineMotionProject,
  characterId: string,
  geometry: CharacterCustomGeometry,
  cubeIds: string[]
): SimpleRiggingResult {
  const characters = project.scene.characters.map((entry) => entry.id === characterId ? { ...entry, customGeometry: geometry } : entry);
  return { project: { ...project, scene: { ...project.scene, characters } }, changed: true, characterId, assignedCubes: cubeIds.length, warnings: [] };
}

function mapCubeToRig(cube: VoxelModelCube, bounds: ModelBounds, boneIds: string[]): RiggedVoxelCube {
  const normalized: Vector3Tuple = [
    bounds.size[0] > 0 ? (cube.position[0] - bounds.min[0]) / bounds.size[0] : 0.5,
    bounds.size[1] > 0 ? (cube.position[1] - bounds.min[1]) / bounds.size[1] : 0.5,
    bounds.size[2] > 0 ? (cube.position[2] - bounds.min[2]) / bounds.size[2] : 0.5
  ];
  const boneId = chooseBone(normalized, boneIds);
  const boneAnchor = approximateBoneAnchor(boneId, bounds);
  return {
    id: cube.id || createId("rigged_cube"),
    name: cube.name,
    boneId,
    position: [cube.position[0] - boneAnchor[0], cube.position[1] - boneAnchor[1], cube.position[2] - boneAnchor[2]],
    size: [...cube.size],
    color: cube.color,
    materialName: cube.materialName,
    visible: cube.visible
  };
}

function chooseBone(position: Vector3Tuple, boneIds: string[]): string {
  const has = (id: string) => boneIds.includes(id);
  const [x, y] = position;
  if (y > 0.78 && has("head")) return "head";
  if (y > 0.42 && x < 0.22 && has("leftArm")) return y < 0.58 && has("leftForearm") ? "leftForearm" : "leftArm";
  if (y > 0.42 && x > 0.78 && has("rightArm")) return y < 0.58 && has("rightForearm") ? "rightForearm" : "rightArm";
  if (y < 0.42 && x < 0.5 && has("leftLeg")) return y < 0.2 && has("leftLowerLeg") ? "leftLowerLeg" : "leftLeg";
  if (y < 0.42 && x >= 0.5 && has("rightLeg")) return y < 0.2 && has("rightLowerLeg") ? "rightLowerLeg" : "rightLeg";
  if (has("body")) return "body";
  return boneIds.find((id) => id !== "root") ?? "root";
}

function approximateBoneAnchor(boneId: string, bounds: ModelBounds): Vector3Tuple {
  const [minX, minY, minZ] = bounds.min;
  const [sx, sy, sz] = bounds.size;
  const x = boneId.toLowerCase().startsWith("left") ? minX + sx * 0.2 : boneId.toLowerCase().startsWith("right") ? minX + sx * 0.8 : minX + sx * 0.5;
  const y = boneId === "head" ? minY + sy * 0.84 : boneId.toLowerCase().includes("leg") ? minY + sy * 0.25 : boneId.toLowerCase().includes("arm") || boneId.toLowerCase().includes("forearm") ? minY + sy * 0.58 : minY + sy * 0.56;
  return [x, y, minZ + sz * 0.5];
}

function computeBounds(model: VoxelModelAsset): ModelBounds {
  const min: Vector3Tuple = [Infinity, Infinity, Infinity];
  const max: Vector3Tuple = [-Infinity, -Infinity, -Infinity];
  for (const cube of model.cubes) {
    for (let index = 0; index < 3; index += 1) {
      min[index] = Math.min(min[index], cube.position[index] - cube.size[index] / 2);
      max[index] = Math.max(max[index], cube.position[index] + cube.size[index] / 2);
    }
  }
  const size = max.map((value, index) => Math.max(0.001, value - min[index])) as Vector3Tuple;
  return { min, max, size, center: min.map((value, index) => value + size[index] / 2) as Vector3Tuple };
}

function finiteVector(value: Vector3Tuple, fallback: Vector3Tuple): Vector3Tuple {
  return value.map((entry, index) => Number.isFinite(entry) ? entry : fallback[index]) as Vector3Tuple;
}
function positiveVector(value: Vector3Tuple, fallback: Vector3Tuple): Vector3Tuple {
  return finiteVector(value, fallback).map((entry) => Math.max(0.01, Math.min(256, Math.abs(entry)))) as Vector3Tuple;
}
function unchanged(project: MineMotionProject, warnings: string[] = []): SimpleRiggingResult {
  return { project, changed: false, characterId: null, assignedCubes: 0, warnings };
}
