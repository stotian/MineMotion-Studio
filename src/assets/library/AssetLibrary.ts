import type { MineMotionProject } from "../../project/ProjectFile";
import { createSimpleHash } from "./AssetHash";
import { mergeAssetRecords, normalizeAssetRecord } from "./AssetCatalog";
import type { AssetLibraryData, AssetRecord, AssetReference, AssetStoragePolicy, AssetType } from "./AssetRecord";

interface CollectedAssetInput {
  id: string;
  name: string;
  type: AssetType;
  sourcePath: string;
  packagePath: string;
  sizeBytes: number;
  mimeType: string;
  importedAt: string;
  hashInput: string;
  missing?: boolean;
  storagePolicy?: AssetStoragePolicy;
  references?: AssetReference[];
  metadata?: AssetRecord["metadata"];
  warning?: string;
}

export function collectProjectAssets(project: MineMotionProject): AssetLibraryData {
  const collected: AssetRecord[] = [];
  const explicitWarnings: string[] = [];
  const add = (input: CollectedAssetInput) => {
    const hash = createSimpleHash(input.hashInput);
    collected.push(normalizeAssetRecord({
      id: input.id,
      name: input.name,
      type: input.type,
      sourcePath: input.sourcePath,
      packagePath: input.packagePath,
      sizeBytes: input.sizeBytes,
      mimeType: input.mimeType,
      importedAt: input.importedAt,
      hash,
      missing: Boolean(input.missing),
      storagePolicy: input.storagePolicy,
      source: {
        kind: input.storagePolicy === "generated" ? "generated" : input.storagePolicy === "cached" ? "package" : "file",
        displayPath: input.sourcePath,
        portablePath: input.packagePath
      },
      references: input.references ?? [],
      integrity: {
        status: input.missing ? "missing" : "verified",
        checkedAt: project.metadata.updatedAt,
        expectedHash: hash,
        message: input.warning
      },
      favorite: false,
      tags: [],
      metadata: input.metadata ?? {}
    }));
    if (input.warning) explicitWarnings.push(input.warning);
  };

  for (const obj of project.assets.obj) {
    add({
      id: obj.id, name: obj.name, type: "objModel", sourcePath: obj.name,
      packagePath: `assets/models/${obj.id}.obj`, sizeBytes: obj.rawObj.length,
      mimeType: "model/obj", importedAt: obj.importedAt, hashInput: obj.rawObj,
      references: [
        ...project.scene.importedObjects.filter((entity) => entity.assetId === obj.id)
          .map((entity) => ({ ownerId: entity.id, kind: "scene" as const, label: entity.name })),
        ...project.scene.characters.flatMap((character) => (character.attachments ?? [])
          .filter((attachment) => attachment.assetId === obj.id)
          .map((attachment) => ({ ownerId: attachment.id, kind: "rig" as const, label: `${character.name}: ${attachment.name}` })))
      ]
    });
  }

  for (const skin of project.assets.skins ?? []) {
    const missing = !skin.metadata.valid;
    add({
      id: skin.id, name: skin.name, type: "minecraftSkin", sourcePath: skin.name,
      packagePath: `assets/skins/${skin.id}.png`, sizeBytes: skin.dataUrl.length,
      mimeType: "image/png", importedAt: skin.importedAt, hashInput: skin.dataUrl, missing,
      references: project.scene.characters.filter((entity) => entity.skin?.id === skin.id)
        .map((entity) => ({ ownerId: entity.id, kind: "rig", label: entity.name })),
      warning: missing ? `Skin ${skin.name} is not a valid 64x64 or 64x32 Minecraft skin.` : undefined,
      metadata: { width: skin.metadata.width, height: skin.metadata.height }
    });
  }

  for (const model of project.assets.blockbench ?? []) {
    add({
      id: model.id, name: model.name, type: "blockbenchModel", sourcePath: model.name,
      packagePath: `assets/blockbench/${model.id}.bbmodel.json`, sizeBytes: model.rawJson.length,
      mimeType: "application/json", importedAt: model.importedAt, hashInput: model.rawJson,
      references: project.scene.characters.filter((entity) => entity.rigPreset === model.id)
        .map((entity) => ({ ownerId: entity.id, kind: "rig", label: entity.name }))
    });
  }

  for (const pack of project.assets.resourcePacks ?? []) {
    const payload = JSON.stringify({ metadata: pack.metadata, textures: pack.textures.map((texture) => ({ path: texture.path, dataUrl: texture.dataUrl })) });
    const missing = pack.textures.length === 0;
    add({
      id: pack.id, name: pack.name, type: "resourcePack", sourcePath: pack.name,
      packagePath: `assets/resource-packs/${pack.id}/pack.mcmeta`,
      sizeBytes: pack.textures.reduce((sum, texture) => sum + texture.byteLength, 0),
      mimeType: "application/vnd.minecraft.resource-pack", importedAt: pack.importedAt,
      hashInput: payload, missing,
      references: project.minecraftResources.activeResourcePackId === pack.id
        ? [{ ownerId: "minecraftResources", kind: "package", label: "Active resource pack" }]
        : [],
      warning: missing ? `Resource pack ${pack.name} contains no imported block textures.` : undefined,
      metadata: { textureCount: pack.textures.length }
    });
  }

  for (const clip of project.audio.clips) {
    const missing = clip.sourceKind === "imported" && !clip.dataUrl;
    add({
      id: clip.id, name: clip.name, type: "audio", sourcePath: clip.sourceName,
      packagePath: `audio/${clip.id}`, sizeBytes: clip.dataUrl.length, mimeType: clip.mimeType,
      importedAt: clip.importedAt, hashInput: clip.dataUrl || clip.sourceName, missing,
      references: project.animation.timelineTracks.flatMap((lane) => lane.items)
        .filter((item) => item.audioClipId === clip.id)
        .map((item) => ({ ownerId: item.id, kind: "timeline", label: item.label })),
      warning: missing ? `Audio clip ${clip.name} has no embedded data.` : undefined,
      metadata: { durationFrames: clip.durationFrames, sourceKind: clip.sourceKind }
    });
  }

  for (const pose of project.rigs.savedPoses) {
    const payload = JSON.stringify(pose);
    add({
      id: pose.id, name: pose.name, type: "rigPose", sourcePath: "Generated in project",
      packagePath: `presets/poses/${pose.id}.json`, sizeBytes: payload.length,
      mimeType: "application/json", importedAt: project.metadata.updatedAt, hashInput: payload,
      storagePolicy: "generated"
    });
  }

  for (const clip of project.animation.clips) {
    const payload = JSON.stringify(clip);
    add({
      id: clip.id, name: clip.name, type: "animationClip", sourcePath: "Generated in project",
      packagePath: `presets/animation/${clip.id}.json`, sizeBytes: payload.length,
      mimeType: "application/json", importedAt: clip.createdAt, hashInput: payload,
      storagePolicy: "generated",
      references: project.animation.nlaTracks.flatMap((track) => track.clips)
        .filter((instance) => instance.clipId === clip.id)
        .map((instance) => ({ ownerId: instance.id, kind: "timeline" }))
    });
  }

  if (project.world) {
    const worldPayload = JSON.stringify({
      sourceName: project.world.sourceName,
      dimensions: project.world.dimensions,
      selectedDimension: project.world.selectedDimension,
      importSettings: project.world.importSettings
    });
    add({
      id: "world_reference", name: project.world.sourceName, type: "worldReference",
      sourcePath: project.world.sourcePath ?? project.world.sourceName,
      packagePath: "metadata/world-summary.json", sizeBytes: worldPayload.length,
      mimeType: "application/json", importedAt: project.world.importedAt, hashInput: worldPayload,
      missing: Boolean(project.world.sourcePathMissing), storagePolicy: "referenced",
      references: [{ ownerId: "world", kind: "scene", label: project.world.sourceName }],
      warning: project.world.sourcePathMissing ? `World source ${project.world.sourceName} must be relinked.` : undefined
    });
    if (project.world.importedChunks?.length && project.world.cachedMesh?.embedded !== false) {
      const chunkPayload = JSON.stringify(project.world.importedChunks);
      add({
        id: "world_chunk_cache", name: `${project.world.sourceName} imported chunk cache`, type: "worldCache",
        sourcePath: project.world.sourcePath ?? project.world.sourceName,
        packagePath: project.world.cachedMesh?.cacheAssetPath ?? "assets/world-cache/chunks.json",
        sizeBytes: chunkPayload.length, mimeType: "application/json", importedAt: project.world.importedAt,
        hashInput: chunkPayload, storagePolicy: "cached",
        references: [{ ownerId: "world", kind: "package", label: project.world.sourceName }]
      });
    }
  }

  const library = mergeAssetRecords(collected, project.assetLibrary);
  return { ...library, warnings: [...new Set([...library.warnings, ...explicitWarnings])] };
}
