import type { MineMotionProject } from "../../project/ProjectFile";
import { applyAssetCleanup, previewUnusedAssetCleanup } from "./AssetCleanup";
import { collectProjectAssets } from "./AssetLibrary";

export function removeUnusedProjectAssets(
  project: MineMotionProject,
  requestedAssetIds: readonly string[]
): MineMotionProject {
  const collected = collectProjectAssets(project);
  const removable = new Set(previewUnusedAssetCleanup(collected).removable.map((record) => record.id));
  const selected = new Set(requestedAssetIds.filter((id) => removable.has(id)));
  if (selected.size === 0) return project;
  const assetLibrary = applyAssetCleanup(collected, [...selected]);
  const blockbench = project.assets.blockbench.filter((asset) => !selected.has(asset.id));
  return {
    ...project,
    assets: {
      obj: project.assets.obj.filter((asset) => !selected.has(asset.id)),
      skins: project.assets.skins.filter((asset) => !selected.has(asset.id)),
      blockbench,
      resourcePacks: project.assets.resourcePacks.filter((asset) => !selected.has(asset.id))
    },
    rigs: {
      ...project.rigs,
      savedPoses: project.rigs.savedPoses.filter((pose) => !selected.has(pose.id)),
      blockbenchModels: project.rigs.blockbenchModels.filter((asset) => !selected.has(asset.id))
    },
    animation: {
      ...project.animation,
      clips: project.animation.clips.filter((clip) => !selected.has(clip.id))
    },
    audio: {
      clips: project.audio.clips.filter((clip) => !selected.has(clip.id))
    },
    assetLibrary,
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}
