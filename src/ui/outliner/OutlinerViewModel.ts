import type { MineMotionProject, SceneEntity } from "../../project/ProjectFile";
import { getRigDefinition } from "../../rigs/MinecraftRigPresets";

export interface OutlinerWarning {
  code: "placeholder-rig" | "missing-obj-asset" | "inactive-camera-state";
  entityId: string;
}

export function matchesOutlinerQuery(name: string, meta: string, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return `${name} ${meta}`.toLocaleLowerCase().includes(normalized);
}

export function collectOutlinerWarnings(project: MineMotionProject): OutlinerWarning[] {
  const warnings: OutlinerWarning[] = [];
  for (const character of project.scene.characters) {
    if (getRigDefinition(character.rigPreset).status === "placeholder") {
      warnings.push({ code: "placeholder-rig", entityId: character.id });
    }
  }
  const assetIds = new Set(project.assets.obj.map((asset) => asset.id));
  for (const object of project.scene.importedObjects) {
    if (!assetIds.has(object.assetId)) {
      warnings.push({ code: "missing-obj-asset", entityId: object.id });
    }
  }
  for (const camera of project.scene.cameras) {
    if (camera.active !== (camera.id === project.activeCameraId)) {
      warnings.push({ code: "inactive-camera-state", entityId: camera.id });
    }
  }
  return warnings;
}

export function filterSceneEntities<T extends SceneEntity>(
  entities: readonly T[],
  query: string,
  meta: (entity: T) => string
): T[] {
  return entities.filter((entity) => matchesOutlinerQuery(entity.name, meta(entity), query));
}
