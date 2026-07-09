import { collectProjectAssets } from "../../assets/library/AssetLibrary";
import type { MineMotionProject } from "../ProjectFile";
import { createMineMotionManifest } from "./MineMotionManifest";
import type { MineMotionPackageData } from "./PackageTypes";

export function createMineMotionPackageData(
  project: MineMotionProject
): MineMotionPackageData {
  const library = collectProjectAssets(project);
  const models: Record<string, string> = {};
  const audio: Record<string, string> = {};

  for (const asset of project.assets.obj) {
    models[`assets/models/${asset.id}.obj`] = asset.rawObj;
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
      audio,
      thumbnails: {},
      metadata: {
        assetLibrary: library
      }
    }
  };
}
