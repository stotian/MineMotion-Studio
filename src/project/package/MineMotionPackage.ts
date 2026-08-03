import { collectProjectAssets } from "../../assets/library/AssetLibrary";
import type { MineMotionProject } from "../ProjectFile";
import { ProjectSerializer } from "../ProjectSerializer";
import { createMineMotionManifest } from "./MineMotionManifest";
import type { MineMotionPackageData } from "./PackageTypes";
import {
  assessWorldChunkCacheSize,
  createPortableWorldChunkCache,
  serializePortableWorldChunkCache,
  WORLD_CHUNK_CACHE_CODEC
} from "../../minecraft/cache/WorldChunkCache";

export function createMineMotionPackageData(
  project: MineMotionProject
): MineMotionPackageData {
  project = ProjectSerializer.toSerializableProject(project);
  const worldCaches: Record<string, string> = {};
  let packagedProject = project;
  const importedChunks = project.world?.importedChunks ?? [];
  if (project.world && importedChunks.length > 0) {
    if (project.world.cachedMesh?.embedded) {
      const cache = createPortableWorldChunkCache(
        importedChunks,
        project.world.cachedMesh.generatedAt || new Date().toISOString()
      );
      const cacheRaw = serializePortableWorldChunkCache(cache);
      const cacheAssetPath = `world/cache/${cache.fingerprint.replace(/[^a-z0-9._-]+/gi, "_")}.json`;
      const assessment = assessWorldChunkCacheSize(new TextEncoder().encode(cacheRaw).byteLength);
      worldCaches[cacheAssetPath] = cacheRaw;
      packagedProject = {
        ...project,
        world: {
          ...project.world,
          importedChunks: [],
          cachedMesh: {
            ...project.world.cachedMesh,
            embedded: true,
            formatVersion: cache.formatVersion,
            fingerprint: cache.fingerprint,
            estimatedBytes: assessment.estimatedBytes,
            cacheAssetPath,
            cacheCodec: WORLD_CHUNK_CACHE_CODEC,
            ...(assessment.level === "ok" ? {} : { sizeWarning: assessment.level })
          }
        }
      };
    } else {
      packagedProject = {
        ...project,
        world: {
          ...project.world,
          importedChunks: [],
          cachedMesh: {
            ...(project.world.cachedMesh ?? {
              generatedAt: "",
              chunkCount: importedChunks.length,
              blockCount: importedChunks.reduce((sum, chunk) => sum + chunk.blocks.length, 0)
            }),
            embedded: false,
            cacheAssetPath: undefined,
            cacheCodec: undefined
          },
          notes: [...new Set([
            ...project.world.notes,
            "Portable world chunks were not embedded; reselect the read-only source world to rebuild them."
          ])].slice(-100)
        }
      };
    }
  }
  const library = collectProjectAssets(packagedProject);
  const models: Record<string, string> = {};
  const skins: Record<string, string> = {};
  const blockbench: Record<string, string> = {};
  const resourcePacks: Record<string, string> = {};
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

  for (const pack of project.assets.resourcePacks ?? []) {
    resourcePacks[`assets/resource-packs/${pack.id}/pack.mcmeta`] = JSON.stringify(
      { pack: {
        pack_format: pack.metadata.packFormat,
        description: pack.metadata.description
      } },
      null,
      2
    );
    for (const texture of pack.textures) {
      resourcePacks[`assets/resource-packs/${pack.id}/${texture.path}`] = texture.dataUrl;
    }
  }

  for (const clip of project.audio.clips) {
    if (clip.dataUrl) {
      audio[`audio/${clip.id}`] = clip.dataUrl;
    }
  }

  return {
    packageFormat: "minemotion-package-json",
    manifest: createMineMotionManifest(packagedProject),
    project: {
      ...packagedProject,
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
      resourcePacks,
      audio,
      worldCaches,
      thumbnails: {},
      metadata: {
        assetLibrary: library,
        importedWorld: packagedProject.world
          ? {
              sourceName: packagedProject.world.sourceName,
              selectedDimension: packagedProject.world.selectedDimension,
              importedChunkRanges: packagedProject.world.importedChunkRanges ?? [],
              cachedMesh: packagedProject.world.cachedMesh,
              sourcePathMissing: !packagedProject.world.sourcePath
            }
          : null
      }
    }
  };
}
