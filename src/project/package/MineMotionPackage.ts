import { collectProjectAssets } from "../../assets/library/AssetLibrary";
import type { MineMotionProject } from "../ProjectFile";
import { createMineMotionManifest } from "./MineMotionManifest";
import type { MineMotionPackageData } from "./PackageTypes";

export function createMineMotionPackageData(
  project: MineMotionProject
): MineMotionPackageData {
  const library = collectProjectAssets(project);
  const models: Record<string, string> = {};
  const skins: Record<string, string> = {};
  const blockbench: Record<string, string> = {};
  const audio: Record<string, string> = {};

  for (const asset of project.assets.obj) {
    models[`assets/models/${asset.id}.obj`] = asset.rawObj;
  }

  for (const skin of project.assets.skins ?? []) {
    skins[`assets/skins/${skin.id}.png`] = skin.dataUrl;
  }

  for (const model of project.assets.blockbench ?? []) {
    blockbench[`assets/blockbench/${model.id}.bbmodel.json`] = model.rawJson;
  }

  for (const clip of project.audio.clips) {
    if (clip.dataUrl) {
      audio[`audio/${clip.id}`] = clip.dataUrl;
    }
  }

  return {
    packageFormat: "minemotion-package-json",
    manifest: createMineMotionManifest(project),
    project: {
      ...project,
      assetLibrary: library,
      packageMetadata: {
        preferredFormat: ".minemotion",
        lastPackageId: `package_${Date.now().toString(36)}`,
        lastPackagedAt: new Date().toISOString(),
        warnings: library.warnings
      }
    },
    assets: {
      models,
      skins,
      blockbench,
      audio,
      thumbnails: {},
      metadata: {
        assetLibrary: library,
        importedWorld: project.world
          ? {
              sourceName: project.world.sourceName,
              selectedDimension: project.world.selectedDimension,
              importedChunkRanges: project.world.importedChunkRanges ?? [],
              cachedMesh: project.world.cachedMesh,
              sourcePathMissing: !project.world.sourcePath
            }
          : null
      }
    }
  };
}
