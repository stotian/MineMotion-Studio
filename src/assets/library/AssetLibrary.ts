import type { MineMotionProject } from "../../project/ProjectFile";
import { createSimpleHash } from "./AssetHash";
import type { AssetLibraryData, AssetRecord } from "./AssetRecord";

export function collectProjectAssets(project: MineMotionProject): AssetLibraryData {
  const records: AssetRecord[] = [];
  const warnings: string[] = [];

  for (const obj of project.assets.obj) {
    records.push({
      id: obj.id,
      name: obj.name,
      type: "objModel",
      sourcePath: obj.name,
      packagePath: `assets/models/${obj.id}.obj`,
      sizeBytes: obj.rawObj.length,
      mimeType: "model/obj",
      importedAt: obj.importedAt,
      hash: createSimpleHash(obj.rawObj),
      missing: false
    });
  }

  for (const clip of project.audio.clips) {
    const missing = clip.sourceKind === "imported" && !clip.dataUrl;
    if (missing) {
      warnings.push(`Audio clip ${clip.name} has no embedded data.`);
    }
    records.push({
      id: clip.id,
      name: clip.name,
      type: "audio",
      sourcePath: clip.sourceName,
      packagePath: `audio/${clip.id}`,
      sizeBytes: clip.dataUrl.length,
      mimeType: clip.mimeType,
      importedAt: clip.importedAt,
      hash: createSimpleHash(clip.dataUrl || clip.sourceName),
      missing
    });
  }

  if (project.world) {
    records.push({
      id: "world_reference",
      name: project.world.sourceName,
      type: "worldReference",
      sourcePath: project.world.sourcePath ?? project.world.sourceName,
      packagePath: "metadata/world-summary.json",
      sizeBytes: JSON.stringify(project.world).length,
      mimeType: "application/json",
      importedAt: project.world.importedAt,
      hash: createSimpleHash(JSON.stringify(project.world)),
      missing: false
    });
  }

  return { records, warnings };
}
