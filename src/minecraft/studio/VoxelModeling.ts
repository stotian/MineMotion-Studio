import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { createId, createObjEntity } from "../../project/ProjectStore";
import type { VoxelModelAsset, VoxelModelCube } from "./MinecraftStudioTypes";
import { applyWorldEditOperations } from "./WorldEditLayer";

export type VoxelAxis = "x" | "y" | "z";

export interface VoxelModelOperationResult {
  project: MineMotionProject;
  changed: boolean;
  modelId: string | null;
  cubeIds: string[];
}

export function createVoxelModel(project: MineMotionProject, name = "Minecraft model"): VoxelModelOperationResult {
  const now = new Date().toISOString();
  const model: VoxelModelAsset = {
    id: createId("voxel_model"),
    name: name.trim().slice(0, 120) || "Minecraft model",
    origin: [0, 0, 0],
    cubes: [],
    tags: ["minecraft-native", "voxel"],
    compiledObjAssetId: null,
    sceneObjectId: null,
    createdAt: now,
    updatedAt: now
  };
  return {
    project: {
      ...project,
      creationSuite: {
        ...project.creationSuite,
        models: [...project.creationSuite.models, model],
        workspace: { ...project.creationSuite.workspace, selectedModelId: model.id, activeTab: "model" }
      }
    },
    changed: true,
    modelId: model.id,
    cubeIds: []
  };
}

export function addVoxelCube(project: MineMotionProject, modelId: string, options: Partial<Omit<VoxelModelCube, "id">> = {}): VoxelModelOperationResult {
  const model = project.creationSuite.models.find((candidate) => candidate.id === modelId);
  if (!model || model.cubes.length >= 4096) return unchanged(project, modelId);
  const cube: VoxelModelCube = {
    id: createId("voxel_cube"),
    name: options.name?.trim().slice(0, 120) || `Cube ${model.cubes.length + 1}`,
    position: vector(options.position, [0, model.cubes.length, 0]),
    size: positiveVector(options.size, [1, 1, 1]),
    color: /^#[0-9a-f]{6}$/i.test(options.color ?? "") ? options.color! : "#8f98a3",
    materialName: options.materialName?.trim().slice(0, 80) || "default",
    visible: options.visible !== false
  };
  return updateModel(project, modelId, (current) => ({ ...current, cubes: [...current.cubes, cube] }), [cube.id]);
}

export function updateVoxelCube(project: MineMotionProject, modelId: string, cubeId: string, patch: Partial<VoxelModelCube>): VoxelModelOperationResult {
  return updateModel(project, modelId, (model) => ({
    ...model,
    cubes: model.cubes.map((cube) => cube.id === cubeId ? {
      ...cube,
      ...patch,
      id: cube.id,
      position: patch.position ? vector(patch.position, cube.position) : cube.position,
      size: patch.size ? positiveVector(patch.size, cube.size) : cube.size,
      color: patch.color && /^#[0-9a-f]{6}$/i.test(patch.color) ? patch.color : cube.color
    } : cube)
  }), [cubeId]);
}

export function removeVoxelCube(project: MineMotionProject, modelId: string, cubeId: string): VoxelModelOperationResult {
  const model = project.creationSuite.models.find((candidate) => candidate.id === modelId);
  if (!model || !model.cubes.some((cube) => cube.id === cubeId)) return unchanged(project, modelId);
  return updateModel(project, modelId, (current) => ({ ...current, cubes: current.cubes.filter((cube) => cube.id !== cubeId) }), [cubeId]);
}

export function mirrorVoxelModel(project: MineMotionProject, modelId: string, axis: VoxelAxis, duplicate = true): VoxelModelOperationResult {
  const model = project.creationSuite.models.find((candidate) => candidate.id === modelId);
  if (!model || model.cubes.length === 0) return unchanged(project, modelId);
  const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2;
  const generated = model.cubes.map((cube) => ({
    ...cube,
    id: duplicate ? createId("voxel_cube") : cube.id,
    name: duplicate ? `${cube.name} mirrored ${axis.toUpperCase()}` : cube.name,
    position: cube.position.map((part, index) => index === axisIndex ? model.origin[index] * 2 - part : part) as Vector3Tuple
  }));
  return updateModel(project, modelId, (current) => ({ ...current, cubes: duplicate ? [...current.cubes, ...generated].slice(0, 4096) : generated }), generated.map((cube) => cube.id));
}

export function arrayVoxelModel(project: MineMotionProject, modelId: string, count: number, offset: Vector3Tuple): VoxelModelOperationResult {
  const model = project.creationSuite.models.find((candidate) => candidate.id === modelId);
  const copies = Math.min(64, Math.max(1, Math.round(count)));
  if (!model || model.cubes.length === 0 || copies <= 1) return unchanged(project, modelId);
  const generated: VoxelModelCube[] = [];
  for (let index = 1; index < copies; index += 1) {
    for (const cube of model.cubes) {
      if (model.cubes.length + generated.length >= 4096) break;
      generated.push({ ...cube, id: createId("voxel_cube"), name: `${cube.name} ${index + 1}`, position: [cube.position[0] + offset[0] * index, cube.position[1] + offset[1] * index, cube.position[2] + offset[2] * index] });
    }
  }
  return updateModel(project, modelId, (current) => ({ ...current, cubes: [...current.cubes, ...generated] }), generated.map((cube) => cube.id));
}

export function optimizeVoxelModel(project: MineMotionProject, modelId: string): VoxelModelOperationResult {
  const model = project.creationSuite.models.find((candidate) => candidate.id === modelId);
  if (!model) return unchanged(project, modelId);
  const seen = new Set<string>();
  const cubes = model.cubes.filter((cube) => {
    if (!cube.visible || cube.size.some((part) => part <= 0)) return false;
    const key = `${cube.position.join(",")}|${cube.size.join(",")}|${cube.materialName}|${cube.color}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (cubes.length === model.cubes.length) return unchanged(project, modelId);
  return updateModel(project, modelId, (current) => ({ ...current, cubes }), cubes.map((cube) => cube.id));
}

export function createVoxelModelFromWorldBox(project: MineMotionProject, name: string, from: Vector3Tuple, to: Vector3Tuple): VoxelModelOperationResult {
  if (!project.world?.importedChunks?.length) return unchanged(project, null);
  const edited = applyWorldEditOperations(project.world.importedChunks, project.creationSuite.worldEdits).chunks;
  const min: Vector3Tuple = [Math.min(from[0], to[0]), Math.min(from[1], to[1]), Math.min(from[2], to[2])].map(Math.round) as Vector3Tuple;
  const max: Vector3Tuple = [Math.max(from[0], to[0]), Math.max(from[1], to[1]), Math.max(from[2], to[2])].map(Math.round) as Vector3Tuple;
  const blocks = edited.flatMap((chunk) => chunk.blocks).filter((block) => block.x >= min[0] && block.x <= max[0] && block.y >= min[1] && block.y <= max[1] && block.z >= min[2] && block.z <= max[2]).slice(0, 4096);
  const created = createVoxelModel(project, name);
  const modelId = created.modelId!;
  const cubes: VoxelModelCube[] = blocks.map((block, index) => ({
    id: createId("voxel_cube"), name: `${block.minecraftName} ${index + 1}`, position: [block.x - min[0], block.y - min[1], block.z - min[2]], size: [1, 1, 1], color: colorForBlock(block.minecraftName), materialName: block.minecraftName, visible: true
  }));
  return updateModel(created.project, modelId, (model) => ({ ...model, origin: [0, 0, 0], cubes }), cubes.map((cube) => cube.id));
}

export function compileVoxelModelToObj(model: VoxelModelAsset): string {
  const lines: string[] = [`# BlockMotion Studio voxel model: ${model.name}`];
  let vertexOffset = 1;
  for (const cube of model.cubes.filter((candidate) => candidate.visible)) {
    const vertices = cubeVertices(cube);
    lines.push(`o ${sanitizeName(cube.name)}`, `usemtl ${sanitizeName(cube.materialName)}`);
    for (const vertex of vertices) lines.push(`v ${format(vertex[0])} ${format(vertex[1])} ${format(vertex[2])}`);
    for (const face of CUBE_FACES) lines.push(`f ${face.map((index) => vertexOffset + index).join(" ")}`);
    vertexOffset += 8;
  }
  return `${lines.join("\n")}\n`;
}

export function syncVoxelModelToScene(project: MineMotionProject, modelId: string): VoxelModelOperationResult {
  const model = project.creationSuite.models.find((candidate) => candidate.id === modelId);
  if (!model || model.cubes.length === 0) return unchanged(project, modelId);
  const assetId = model.compiledObjAssetId ?? createId("obj_asset");
  const rawObj = compileVoxelModelToObj(model);
  const existingObject = model.sceneObjectId ? project.scene.importedObjects.find((object) => object.id === model.sceneObjectId) : null;
  const object = existingObject ?? createObjEntity(assetId, model.name);
  const nextObject = { ...object, name: model.name, assetId };
  const now = new Date().toISOString();
  const next = {
    ...project,
    assets: {
      ...project.assets,
      obj: project.assets.obj.some((asset) => asset.id === assetId)
        ? project.assets.obj.map((asset) => asset.id === assetId ? { ...asset, name: model.name, rawObj, importedAt: now } : asset)
        : [...project.assets.obj, { id: assetId, name: model.name, rawObj, importedAt: now }]
    },
    scene: {
      ...project.scene,
      importedObjects: existingObject
        ? project.scene.importedObjects.map((candidate) => candidate.id === existingObject.id ? nextObject : candidate)
        : [...project.scene.importedObjects, nextObject]
    }
  } satisfies MineMotionProject;
  return updateModel(next, modelId, (current) => ({ ...current, compiledObjAssetId: assetId, sceneObjectId: nextObject.id }), model.cubes.map((cube) => cube.id));
}

export function deleteVoxelModel(project: MineMotionProject, modelId: string): VoxelModelOperationResult {
  const model = project.creationSuite.models.find((candidate) => candidate.id === modelId);
  if (!model) return unchanged(project, modelId);
  return {
    project: {
      ...project,
      assets: { ...project.assets, obj: model.compiledObjAssetId ? project.assets.obj.filter((asset) => asset.id !== model.compiledObjAssetId) : project.assets.obj },
      scene: { ...project.scene, importedObjects: model.sceneObjectId ? project.scene.importedObjects.filter((object) => object.id !== model.sceneObjectId) : project.scene.importedObjects },
      creationSuite: {
        ...project.creationSuite,
        models: project.creationSuite.models.filter((candidate) => candidate.id !== modelId),
        workspace: { ...project.creationSuite.workspace, selectedModelId: project.creationSuite.workspace.selectedModelId === modelId ? null : project.creationSuite.workspace.selectedModelId }
      }
    }, changed: true, modelId, cubeIds: model.cubes.map((cube) => cube.id)
  };
}

export function createVoxelModelManifest(model: VoxelModelAsset): string { return JSON.stringify({ schemaVersion: 1, ...model }, null, 2); }

function updateModel(project: MineMotionProject, modelId: string, updater: (model: VoxelModelAsset) => VoxelModelAsset, cubeIds: string[]): VoxelModelOperationResult {
  if (!project.creationSuite.models.some((model) => model.id === modelId)) return unchanged(project, modelId);
  const now = new Date().toISOString();
  return { project: { ...project, creationSuite: { ...project.creationSuite, models: project.creationSuite.models.map((model) => model.id === modelId ? { ...updater(model), updatedAt: now } : model) } }, changed: true, modelId, cubeIds };
}
function unchanged(project: MineMotionProject, modelId: string | null): VoxelModelOperationResult { return { project, changed: false, modelId, cubeIds: [] }; }
function vector(value: Vector3Tuple | undefined, fallback: Vector3Tuple): Vector3Tuple { return value && value.length === 3 ? value.map((part, index) => Number.isFinite(part) ? part : fallback[index]) as Vector3Tuple : [...fallback]; }
function positiveVector(value: Vector3Tuple | undefined, fallback: Vector3Tuple): Vector3Tuple { return vector(value, fallback).map((part) => Math.max(0.01, Math.abs(part))) as Vector3Tuple; }
function sanitizeName(value: string): string { return value.replace(/[^a-zA-Z0-9_.-]+/g, "_") || "cube"; }
function format(value: number): string { return Number(value.toFixed(6)).toString(); }
function cubeVertices(cube: VoxelModelCube): Vector3Tuple[] {
  const [x, y, z] = cube.position; const [sx, sy, sz] = cube.size; const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  return [[x-hx,y-hy,z-hz],[x+hx,y-hy,z-hz],[x+hx,y+hy,z-hz],[x-hx,y+hy,z-hz],[x-hx,y-hy,z+hz],[x+hx,y-hy,z+hz],[x+hx,y+hy,z+hz],[x-hx,y+hy,z+hz]];
}
const CUBE_FACES = [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[4,0,3,7]] as const;
function colorForBlock(name: string): string {
  if (name.includes("grass")) return "#6ca84f"; if (name.includes("dirt")) return "#8b5a36"; if (name.includes("stone")) return "#808080"; if (name.includes("sand")) return "#d9c47c"; if (name.includes("log")) return "#8a613a"; if (name.includes("leaves")) return "#477b3b"; if (name.includes("water")) return "#4169a8"; return "#8f98a3";
}
