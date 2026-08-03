import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { createObjEntity } from "../../project/ProjectStore";
import { createVoxelModel, addVoxelCube, syncVoxelModelToScene } from "./VoxelModeling";
import { upsertModDescriptor } from "./ModAssetCatalog";

export type ModAssetKind = "resource-pack" | "blockbench" | "obj" | "library";

export interface DiscoveredModAsset {
  id: string;
  name: string;
  kind: ModAssetKind;
  sourceId: string;
  namespace: string;
  usableDirectly: boolean;
  detail: string;
}

export interface ModAssetUsageReport {
  modId: string;
  namespace: string;
  discovered: DiscoveredModAsset[];
  resourcePacks: number;
  blockbenchModels: number;
  objModels: number;
  libraryAssets: number;
  directUsable: number;
  warnings: string[];
}

export interface ModAssetOperationResult {
  project: MineMotionProject;
  changed: boolean;
  assetId: string | null;
  sceneObjectId: string | null;
  warnings: string[];
}

export function discoverImportedModAssets(project: MineMotionProject, modId: string): ModAssetUsageReport {
  const mod = project.creationSuite.worldStudio.mods.find((entry) => entry.id === modId);
  if (!mod) return emptyReport(modId, "unknown", ["Mod descriptor not found."]);
  const namespace = mod.namespace.toLowerCase();
  const matches = (value: string) => value.toLowerCase().includes(namespace);
  const discovered: DiscoveredModAsset[] = [];

  for (const pack of project.assets.resourcePacks) {
    const matchingTextures = pack.textures.filter((texture) => matches(texture.path) || texture.blockName.toLowerCase().startsWith(`${namespace}:`));
    if (!matches(pack.name) && matchingTextures.length === 0) continue;
    discovered.push({
      id: `resource-pack:${pack.id}`,
      name: pack.name,
      kind: "resource-pack",
      sourceId: pack.id,
      namespace,
      usableDirectly: true,
      detail: `${matchingTextures.length} matching texture${matchingTextures.length === 1 ? "" : "s"}`
    });
  }

  for (const model of project.assets.blockbench) {
    if (!matches(model.name) && !matches(model.rawJson)) continue;
    discovered.push({
      id: `blockbench:${model.id}`,
      name: model.name,
      kind: "blockbench",
      sourceId: model.id,
      namespace,
      usableDirectly: model.groupCount > 0,
      detail: `${model.elementCount} elements, ${model.groupCount} groups, ${model.animationCount ?? 0} animations`
    });
  }

  for (const asset of project.assets.obj) {
    if (!matches(asset.name) && !matches(asset.id) && !matches(asset.rawObj.slice(0, 1024))) continue;
    discovered.push({
      id: `obj:${asset.id}`,
      name: asset.name,
      kind: "obj",
      sourceId: asset.id,
      namespace,
      usableDirectly: true,
      detail: "Renderable OBJ asset"
    });
  }

  for (const record of project.assetLibrary.records) {
    const text = `${record.name} ${record.sourcePath} ${record.packagePath} ${record.tags.join(" ")}`;
    if (!matches(text)) continue;
    discovered.push({
      id: `library:${record.id}`,
      name: record.name,
      kind: "library",
      sourceId: record.id,
      namespace,
      usableDirectly: !record.missing && record.integrity.status !== "corrupt",
      detail: `${record.type} · ${record.storagePolicy} · ${record.integrity.status}`
    });
  }

  const unique = [...new Map(discovered.map((asset) => [asset.id, asset])).values()];
  const warnings: string[] = [];
  if (unique.length === 0) warnings.push(`No imported resource pack, Blockbench, OBJ or library asset currently matches namespace ${namespace}.`);
  if (unique.some((asset) => asset.kind === "blockbench" && !asset.usableDirectly)) warnings.push("Some Blockbench assets contain no mapped groups and need rig mapping before animation.");
  return {
    modId,
    namespace,
    discovered: unique,
    resourcePacks: unique.filter((asset) => asset.kind === "resource-pack").length,
    blockbenchModels: unique.filter((asset) => asset.kind === "blockbench").length,
    objModels: unique.filter((asset) => asset.kind === "obj").length,
    libraryAssets: unique.filter((asset) => asset.kind === "library").length,
    directUsable: unique.filter((asset) => asset.usableDirectly).length,
    warnings
  };
}

export function bindImportedAssetsToMod(project: MineMotionProject, modId: string): ModAssetOperationResult {
  const mod = project.creationSuite.worldStudio.mods.find((entry) => entry.id === modId);
  if (!mod) return unchanged(project, ["Mod descriptor not found."]);
  const report = discoverImportedModAssets(project, modId);
  const assetIds = [...new Set([...mod.assetIds, ...report.discovered.map((asset) => asset.id)])].slice(0, 4096);
  const next = upsertModDescriptor(project, {
    ...mod,
    assetIds,
    source: report.resourcePacks > 0 ? "resource-pack" : report.blockbenchModels > 0 ? "blockbench" : mod.source,
    warnings: [...new Set([...mod.warnings, ...report.warnings])]
  });
  return { project: next, changed: assetIds.length !== mod.assetIds.length, assetId: null, sceneObjectId: null, warnings: report.warnings };
}

export function activateModResourcePack(project: MineMotionProject, modId: string): ModAssetOperationResult {
  const report = discoverImportedModAssets(project, modId);
  const pack = report.discovered.find((asset) => asset.kind === "resource-pack" && asset.usableDirectly);
  if (!pack) return unchanged(project, ["No imported compatible resource pack was found for this mod namespace."]);
  return {
    project: { ...project, minecraftResources: { ...project.minecraftResources, activeResourcePackId: pack.sourceId } },
    changed: project.minecraftResources.activeResourcePackId !== pack.sourceId,
    assetId: pack.id,
    sceneObjectId: null,
    warnings: report.warnings
  };
}

export function insertModAssetIntoScene(
  project: MineMotionProject,
  modId: string,
  discoveredAssetId: string,
  position: Vector3Tuple = [0, 1, 0]
): ModAssetOperationResult {
  const report = discoverImportedModAssets(project, modId);
  const asset = report.discovered.find((entry) => entry.id === discoveredAssetId);
  if (!asset) return unchanged(project, ["Discovered mod asset not found."]);
  if (asset.kind === "obj") {
    const source = project.assets.obj.find((entry) => entry.id === asset.sourceId);
    if (!source) return unchanged(project, ["OBJ source is missing."]);
    const baseObject = createObjEntity(source.id, source.name);
    const object = { ...baseObject, transform: { ...baseObject.transform, position } };
    return {
      project: { ...project, scene: { ...project.scene, importedObjects: [...project.scene.importedObjects, object] } },
      changed: true,
      assetId: asset.id,
      sceneObjectId: object.id,
      warnings: []
    };
  }
  if (asset.kind === "resource-pack") {
    return activateModResourcePack(project, modId);
  }
  if (asset.kind === "blockbench") {
    return unchanged(project, ["Blockbench asset is available for rig mapping. Use the Rig workspace to map its groups before insertion."]);
  }
  return unchanged(project, ["This library record is indexed but must be imported through its native asset workflow before scene insertion."]);
}

export function createModBlockPaletteProp(project: MineMotionProject, modId: string): ModAssetOperationResult {
  const mod = project.creationSuite.worldStudio.mods.find((entry) => entry.id === modId);
  if (!mod || mod.blockIds.length === 0) return unchanged(project, ["The mod manifest has no block IDs."]);
  let result = createVoxelModel(project, `${mod.name} Block Palette`);
  let next = result.project;
  const modelId = result.modelId!;
  for (let index = 0; index < Math.min(128, mod.blockIds.length); index += 1) {
    const blockId = mod.blockIds[index];
    const color = deterministicColor(`${mod.namespace}:${blockId}`);
    result = addVoxelCube(next, modelId, {
      name: blockId,
      position: [index % 8, Math.floor(index / 64), Math.floor(index / 8) % 8],
      size: [0.9, 0.9, 0.9],
      color,
      materialName: blockId
    });
    next = result.project;
  }
  const synced = syncVoxelModelToScene(next, modelId);
  const model = synced.project.creationSuite.models.find((entry) => entry.id === modelId);
  return {
    project: synced.project,
    changed: true,
    assetId: model?.compiledObjAssetId ?? null,
    sceneObjectId: model?.sceneObjectId ?? null,
    warnings: mod.blockIds.length > 128 ? ["The palette preview is limited to the first 128 mod blocks."] : []
  };
}

export function exportModAssetUsageManifest(project: MineMotionProject, modId: string): string {
  return JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), report: discoverImportedModAssets(project, modId) }, null, 2);
}

function deterministicColor(value: string): string {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const component = (shift: number) => 72 + ((hash >>> shift) & 0x7f);
  return `#${[component(0), component(8), component(16)].map((entry) => entry.toString(16).padStart(2, "0")).join("")}`;
}
function emptyReport(modId: string, namespace: string, warnings: string[]): ModAssetUsageReport {
  return { modId, namespace, discovered: [], resourcePacks: 0, blockbenchModels: 0, objModels: 0, libraryAssets: 0, directUsable: 0, warnings };
}
function unchanged(project: MineMotionProject, warnings: string[]): ModAssetOperationResult {
  return { project, changed: false, assetId: null, sceneObjectId: null, warnings };
}
