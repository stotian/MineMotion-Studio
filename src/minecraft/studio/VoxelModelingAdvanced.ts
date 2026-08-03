import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { createId } from "../../project/ProjectStore";
import type { VoxelModelAsset, VoxelModelCube } from "./MinecraftStudioTypes";
import { addVoxelCube, createVoxelModel, type VoxelModelOperationResult } from "./VoxelModeling";

export const VOXEL_PRIMITIVE_KINDS = ["cube", "slab", "pillar", "stair", "arch", "cylinder", "sphere", "wall"] as const;
export type VoxelPrimitiveKind = (typeof VOXEL_PRIMITIVE_KINDS)[number];
export const VOXEL_MODEL_TEMPLATE_IDS = ["sword", "shield", "tree", "lamp", "house", "portal"] as const;
export type VoxelModelTemplateId = (typeof VOXEL_MODEL_TEMPLATE_IDS)[number];

export interface VoxelPrimitiveOptions {
  position?: Vector3Tuple;
  size?: Vector3Tuple;
  color?: string;
  materialName?: string;
  segments?: number;
}

export function addVoxelPrimitive(project: MineMotionProject, modelId: string, kind: VoxelPrimitiveKind, options: VoxelPrimitiveOptions = {}): VoxelModelOperationResult {
  const position = options.position ?? [0, 0, 0];
  const size = options.size ?? [1, 1, 1];
  const color = options.color ?? "#8f98a3";
  const materialName = options.materialName ?? "default";
  if (kind === "cube") return addVoxelCube(project, modelId, { name: "Cube", position, size, color, materialName, visible: true });
  if (kind === "slab") return addVoxelCube(project, modelId, { name: "Slab", position, size: [size[0], Math.max(0.05, size[1] * 0.5), size[2]], color, materialName, visible: true });
  if (kind === "pillar") return addVoxelCube(project, modelId, { name: "Pillar", position, size: [Math.max(0.1, size[0] * 0.5), size[1], Math.max(0.1, size[2] * 0.5)], color, materialName, visible: true });
  const cubes = generatePrimitiveCubes(kind, position, size, color, materialName, options.segments ?? 8);
  return appendCubes(project, modelId, cubes);
}

export function duplicateVoxelModel(project: MineMotionProject, modelId: string, name?: string): VoxelModelOperationResult {
  const source = project.creationSuite.models.find((model) => model.id === modelId);
  if (!source || project.creationSuite.models.length >= 128) return unchanged(project, modelId);
  const now = new Date().toISOString();
  const copy: VoxelModelAsset = {
    ...source,
    id: createId("voxel_model"),
    name: name?.trim().slice(0, 120) || `${source.name} Copy`,
    cubes: source.cubes.map((cube) => ({ ...cube, id: createId("voxel_cube"), position: [...cube.position], size: [...cube.size] })),
    compiledObjAssetId: null,
    sceneObjectId: null,
    createdAt: now,
    updatedAt: now
  };
  return {
    project: { ...project, creationSuite: { ...project.creationSuite, models: [...project.creationSuite.models, copy], workspace: { ...project.creationSuite.workspace, selectedModelId: copy.id, activeTab: "model" } } },
    changed: true,
    modelId: copy.id,
    cubeIds: copy.cubes.map((cube) => cube.id)
  };
}

export function transformVoxelModel(
  project: MineMotionProject,
  modelId: string,
  translation: Vector3Tuple = [0, 0, 0],
  scale: Vector3Tuple = [1, 1, 1]
): VoxelModelOperationResult {
  return updateModel(project, modelId, (model) => ({
    ...model,
    cubes: model.cubes.map((cube) => ({
      ...cube,
      position: [
        model.origin[0] + (cube.position[0] - model.origin[0]) * scale[0] + translation[0],
        model.origin[1] + (cube.position[1] - model.origin[1]) * scale[1] + translation[1],
        model.origin[2] + (cube.position[2] - model.origin[2]) * scale[2] + translation[2]
      ],
      size: [Math.max(0.01, cube.size[0] * Math.abs(scale[0])), Math.max(0.01, cube.size[1] * Math.abs(scale[1])), Math.max(0.01, cube.size[2] * Math.abs(scale[2]))]
    })),
    origin: [model.origin[0] + translation[0], model.origin[1] + translation[1], model.origin[2] + translation[2]]
  }));
}

export function recolorVoxelModel(project: MineMotionProject, modelId: string, color: string, materialName?: string): VoxelModelOperationResult {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return unchanged(project, modelId);
  return updateModel(project, modelId, (model) => ({
    ...model,
    cubes: model.cubes.map((cube) => ({ ...cube, color, materialName: materialName?.trim().slice(0, 80) || cube.materialName }))
  }));
}

export function centerVoxelModelOrigin(project: MineMotionProject, modelId: string): VoxelModelOperationResult {
  return updateModel(project, modelId, (model) => {
    if (model.cubes.length === 0) return model;
    const min: Vector3Tuple = [Infinity, Infinity, Infinity];
    const max: Vector3Tuple = [-Infinity, -Infinity, -Infinity];
    for (const cube of model.cubes) for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], cube.position[axis]);
      max[axis] = Math.max(max[axis], cube.position[axis] + cube.size[axis]);
    }
    return { ...model, origin: [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2] };
  });
}

export function createVoxelModelTemplate(project: MineMotionProject, template: VoxelModelTemplateId): VoxelModelOperationResult {
  const created = createVoxelModel(project, `${template.slice(0, 1).toUpperCase()}${template.slice(1)} Template`);
  let next = created.project;
  const modelId = created.modelId!;
  const specs = templateCubes(template);
  const ids: string[] = [];
  for (const spec of specs) {
    const added = addVoxelCube(next, modelId, spec);
    next = added.project;
    ids.push(...added.cubeIds);
  }
  return { project: next, changed: true, modelId, cubeIds: ids };
}

export function mergeAdjacentVoxelCubes(project: MineMotionProject, modelId: string): VoxelModelOperationResult {
  return updateModel(project, modelId, (model) => {
    let cubes = model.cubes.map((cube) => ({ ...cube, position: [...cube.position] as Vector3Tuple, size: [...cube.size] as Vector3Tuple }));
    let merged = true;
    while (merged) {
      merged = false;
      outer: for (let first = 0; first < cubes.length; first += 1) for (let second = first + 1; second < cubes.length; second += 1) {
        const combined = mergePair(cubes[first], cubes[second]);
        if (!combined) continue;
        cubes = [...cubes.slice(0, first), combined, ...cubes.slice(first + 1, second), ...cubes.slice(second + 1)];
        merged = true;
        break outer;
      }
    }
    return { ...model, cubes };
  });
}

function generatePrimitiveCubes(kind: Exclude<VoxelPrimitiveKind, "cube" | "slab" | "pillar">, position: Vector3Tuple, size: Vector3Tuple, color: string, materialName: string, segments: number): VoxelModelCube[] {
  const cubes: VoxelModelCube[] = [];
  const add = (name: string, p: Vector3Tuple, s: Vector3Tuple) => cubes.push({ id: createId("voxel_cube"), name, position: p, size: s, color, materialName, visible: true });
  if (kind === "stair") {
    const steps = Math.max(2, Math.min(16, Math.round(segments / 2)));
    for (let index = 0; index < steps; index += 1) add(`Step ${index + 1}`, [position[0], position[1] + size[1] * index / steps, position[2] + size[2] * index / steps], [size[0], size[1] / steps, size[2] / steps]);
  } else if (kind === "wall") {
    const count = Math.max(1, Math.min(64, Math.round(size[0])));
    for (let index = 0; index < count; index += 1) add(`Wall block ${index + 1}`, [position[0] + index, position[1], position[2]], [1, size[1], size[2]]);
  } else if (kind === "arch") {
    add("Arch left", position, [size[0] * 0.2, size[1], size[2]]);
    add("Arch right", [position[0] + size[0] * 0.8, position[1], position[2]], [size[0] * 0.2, size[1], size[2]]);
    add("Arch top", [position[0], position[1] + size[1] * 0.8, position[2]], [size[0], size[1] * 0.2, size[2]]);
  } else {
    const count = Math.max(6, Math.min(32, Math.round(segments)));
    const radiusX = Math.max(0.1, size[0] / 2);
    const radiusZ = Math.max(0.1, size[2] / 2);
    const layers = kind === "sphere" ? Math.max(3, Math.round(count / 2)) : 1;
    for (let layer = 0; layer < layers; layer += 1) {
      const vertical = layers === 1 ? 0.5 : layer / (layers - 1);
      const scale = kind === "sphere" ? Math.sin(Math.PI * vertical) : 1;
      for (let index = 0; index < count; index += 1) {
        const angle = index / count * Math.PI * 2;
        const cubeSize = Math.max(0.08, Math.PI * Math.max(radiusX, radiusZ) * 2 / count);
        add(`${kind} ${layer + 1}-${index + 1}`, [position[0] + radiusX + Math.cos(angle) * radiusX * scale, position[1] + vertical * size[1], position[2] + radiusZ + Math.sin(angle) * radiusZ * scale], [cubeSize, kind === "sphere" ? Math.max(0.08, size[1] / layers) : size[1], cubeSize]);
      }
    }
  }
  return cubes.slice(0, 4096);
}

function templateCubes(template: VoxelModelTemplateId): Partial<Omit<VoxelModelCube, "id">>[] {
  const cube = (name: string, position: Vector3Tuple, size: Vector3Tuple, color: string, materialName: string) => ({ name, position, size, color, materialName, visible: true });
  if (template === "sword") return [cube("Blade", [0, 1, 0], [0.3, 3, 0.15], "#c9d3db", "iron"), cube("Guard", [-0.5, 0.8, 0], [1.3, 0.25, 0.3], "#6f7780", "iron"), cube("Handle", [0, 0, 0], [0.35, 1, 0.35], "#6b4526", "leather")];
  if (template === "shield") return [cube("Shield body", [0, 0, 0], [2, 2.6, 0.25], "#8b5a2b", "wood"), cube("Shield boss", [0.75, 1, -0.1], [0.5, 0.5, 0.45], "#aeb8c2", "iron")];
  if (template === "tree") return [cube("Trunk", [0, 0, 0], [1, 4, 1], "#6b4526", "minecraft:oak_log"), cube("Leaves", [-1.5, 3, -1.5], [4, 3, 4], "#4f8b45", "minecraft:oak_leaves")];
  if (template === "lamp") return [cube("Post", [0, 0, 0], [0.4, 3, 0.4], "#4e5660", "iron"), cube("Lantern", [-0.3, 2.8, -0.3], [1, 1, 1], "#ffc95c", "glowstone")];
  if (template === "portal") return [cube("Left frame", [0, 0, 0], [1, 5, 1], "#3b254f", "obsidian"), cube("Right frame", [4, 0, 0], [1, 5, 1], "#3b254f", "obsidian"), cube("Top frame", [0, 4, 0], [5, 1, 1], "#3b254f", "obsidian"), cube("Portal", [1, 0, 0.2], [3, 4, 0.5], "#a64cff", "portal")];
  return [cube("Floor", [0, 0, 0], [7, 0.5, 7], "#8b5a2b", "wood"), cube("Back wall", [0, 0.5, 6.5], [7, 4, 0.5], "#b28b61", "planks"), cube("Left wall", [0, 0.5, 0], [0.5, 4, 7], "#b28b61", "planks"), cube("Right wall", [6.5, 0.5, 0], [0.5, 4, 7], "#b28b61", "planks"), cube("Roof", [-0.5, 4.5, -0.5], [8, 0.6, 8], "#7a3d2c", "roof")];
}

function mergePair(first: VoxelModelCube, second: VoxelModelCube): VoxelModelCube | null {
  if (!first.visible || !second.visible || first.color !== second.color || first.materialName !== second.materialName) return null;
  for (let axis = 0; axis < 3; axis += 1) {
    const otherAxes = [0, 1, 2].filter((candidate) => candidate !== axis);
    if (!otherAxes.every((candidate) => near(first.position[candidate], second.position[candidate]) && near(first.size[candidate], second.size[candidate]))) continue;
    const firstEnd = first.position[axis] + first.size[axis];
    const secondEnd = second.position[axis] + second.size[axis];
    if (!near(firstEnd, second.position[axis]) && !near(secondEnd, first.position[axis])) continue;
    const position = [...first.position] as Vector3Tuple;
    position[axis] = Math.min(first.position[axis], second.position[axis]);
    const size = [...first.size] as Vector3Tuple;
    size[axis] = first.size[axis] + second.size[axis];
    return { ...first, id: createId("voxel_cube"), name: `${first.name} + ${second.name}`, position, size };
  }
  return null;
}

function appendCubes(project: MineMotionProject, modelId: string, cubes: VoxelModelCube[]): VoxelModelOperationResult {
  return updateModel(project, modelId, (model) => ({ ...model, cubes: [...model.cubes, ...cubes].slice(0, 4096) }), cubes.map((cube) => cube.id));
}
function updateModel(project: MineMotionProject, modelId: string, updater: (model: VoxelModelAsset) => VoxelModelAsset, cubeIds: string[] = []): VoxelModelOperationResult {
  const source = project.creationSuite.models.find((model) => model.id === modelId);
  if (!source) return unchanged(project, modelId);
  const updated = { ...updater(source), updatedAt: new Date().toISOString(), compiledObjAssetId: null };
  return { project: { ...project, creationSuite: { ...project.creationSuite, models: project.creationSuite.models.map((model) => model.id === modelId ? updated : model) }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } }, changed: true, modelId, cubeIds: cubeIds.length ? cubeIds : updated.cubes.map((cube) => cube.id) };
}
function unchanged(project: MineMotionProject, modelId: string | null): VoxelModelOperationResult { return { project, changed: false, modelId, cubeIds: [] }; }
function near(first: number, second: number): boolean { return Math.abs(first - second) < 1e-6; }
