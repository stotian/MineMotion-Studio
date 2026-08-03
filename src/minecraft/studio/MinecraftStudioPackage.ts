import type { MineMotionProject } from "../../project/ProjectFile";
import { createWorldStudioManifest } from "./MinecraftWorldStudio";
import { createWorldEditManifest } from "./WorldEditLayer";
import { createVoxelModelManifest, compileVoxelModelToObj } from "./VoxelModeling";
import { exportCollisionManifest } from "./CollisionStudio";
import { exportQuickVfxCatalog } from "./QuickVfxStudio";
import { exportPostFinishManifest } from "./PostFinishStudio";
import { exportOptimizationReport, type StudioPerformanceTarget } from "./MinecraftStudioOptimization";
import { exportWorldStreamingManifest } from "./WorldStreamingStudio";
import { exportWorldEditBlueprint } from "./MinecraftBuilderAdvanced";
import { exportSimpleRigManifest } from "./SimpleRiggingStudio";
import { exportModAssetUsageManifest } from "./ModAssetBridge";

export interface MinecraftStudioPackageEntry {
  path: string;
  mimeType: string;
  content: string;
}

export interface MinecraftStudioPackage {
  format: "minemotion-minecraft-creation-suite-v1";
  projectName: string;
  generatedAt: string;
  entries: MinecraftStudioPackageEntry[];
  summary: {
    chunks: number;
    worldEdits: number;
    voxelModels: number;
    rigGroups: number;
    collisionProfiles: number;
    vfxFavorites: number;
    postLayers: number;
    customRigs: number;
    modAssets: number;
  };
}

export function createMinecraftStudioPackage(project: MineMotionProject, target: StudioPerformanceTarget = "balanced"): MinecraftStudioPackage {
  const entries: MinecraftStudioPackageEntry[] = [
    jsonEntry("world/world-studio.json", createWorldStudioManifest(project)),
    jsonEntry("world/world-edits.json", createWorldEditManifest(project)),
    jsonEntry("world/streaming-plan.json", exportWorldStreamingManifest(project)),
    jsonEntry("world/active-blueprint.mmblueprint.json", exportWorldEditBlueprint(project, `${project.projectName} Active Builder Layer`)),
    jsonEntry("physics/collisions.json", exportCollisionManifest(project)),
    jsonEntry("vfx/quick-vfx-catalog.json", exportQuickVfxCatalog(project)),
    jsonEntry("post/post-finish.json", exportPostFinishManifest(project)),
    jsonEntry("reports/performance.json", exportOptimizationReport(project, target)),
    jsonEntry("rigs/groups.json", JSON.stringify({ format: "minemotion-rig-groups-v1", groups: project.creationSuite.rigGroups }, null, 2)),
    jsonEntry("mods/catalog.json", JSON.stringify({ format: "minemotion-mod-catalog-v1", loader: project.creationSuite.worldStudio.loader, minecraftVersion: project.creationSuite.worldStudio.minecraftVersion, mods: project.creationSuite.worldStudio.mods }, null, 2))
  ];
  for (const mod of project.creationSuite.worldStudio.mods) {
    entries.push(jsonEntry(`mods/${safeFileName(mod.id)}-assets.json`, exportModAssetUsageManifest(project, mod.id)));
  }
  for (const character of project.scene.characters.filter((entry) => Boolean(entry.customGeometry))) {
    entries.push(jsonEntry(`rigs/${safeFileName(character.name)}.simple-rig.json`, exportSimpleRigManifest(project, character.id)));
  }
  for (const model of project.creationSuite.models) {
    entries.push(jsonEntry(`models/${safeFileName(model.name)}.model.json`, createVoxelModelManifest(model)));
    entries.push({ path: `models/${safeFileName(model.name)}.obj`, mimeType: "text/plain", content: compileVoxelModelToObj(model) });
  }
  return {
    format: "minemotion-minecraft-creation-suite-v1",
    projectName: project.projectName,
    generatedAt: new Date().toISOString(),
    entries,
    summary: {
      chunks: project.world?.importedChunks?.length ?? 0,
      worldEdits: project.creationSuite.worldEdits.length,
      voxelModels: project.creationSuite.models.length,
      rigGroups: project.creationSuite.rigGroups.length,
      collisionProfiles: project.creationSuite.collisions.profiles.length,
      vfxFavorites: project.creationSuite.quickVfxFavorites.length,
      postLayers: project.creationSuite.postStack.length,
      customRigs: project.scene.characters.filter((entry) => Boolean(entry.customGeometry)).length,
      modAssets: project.creationSuite.worldStudio.mods.reduce((total, mod) => total + mod.assetIds.length, 0)
    }
  };
}

export function serializeMinecraftStudioPackage(project: MineMotionProject, target: StudioPerformanceTarget = "balanced"): string {
  return JSON.stringify(createMinecraftStudioPackage(project, target), null, 2);
}

function jsonEntry(path: string, content: string): MinecraftStudioPackageEntry { return { path, mimeType: "application/json", content }; }
function safeFileName(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "model"; }
