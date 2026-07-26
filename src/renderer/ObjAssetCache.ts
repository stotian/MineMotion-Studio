import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type {
  ImportedObjAsset,
  MineMotionProject
} from "../project/ProjectFile";
import { createSolidMaterial } from "./MinecraftMaterialSystem";
import { replaceOwnedObjMeshMaterials } from "./ObjMaterialOwnership";
import { markSharedThreeResource } from "./ThreeResourceDisposal";

interface CachedObjTemplate {
  rawObj: string;
  template: THREE.Object3D;
  geometries: Set<THREE.BufferGeometry>;
}

export interface ObjAssetCacheDisposal {
  templates: number;
  geometries: number;
  materials: number;
}

export function collectRenderedObjAssetIds(
  project: MineMotionProject
): ReadonlySet<string> {
  const active = new Set<string>();
  for (const object of project.scene.importedObjects) {
    if (object.visible) active.add(object.assetId);
  }
  for (const character of project.scene.characters) {
    if (!character.visible) continue;
    for (const attachment of character.attachments ?? []) {
      if (
        attachment.visible &&
        attachment.kind === "obj" &&
        attachment.assetId
      ) {
        active.add(attachment.assetId);
      }
    }
  }
  return active;
}

/**
 * Owns immutable parsed OBJ templates for one renderer. Returned clones share
 * cache-owned geometry/material resources but never share mutable object nodes.
 */
export class ObjAssetCache {
  private readonly loader = new OBJLoader();
  private readonly entries = new Map<string, CachedObjTemplate>();
  private material: THREE.MeshStandardMaterial | null = null;

  resolve(asset: ImportedObjAsset): THREE.Object3D {
    const cached = this.entries.get(asset.id);
    if (cached?.rawObj === asset.rawObj) return cached.template.clone(true);
    if (cached) this.removeEntry(asset.id, cached);

    let template: THREE.Object3D;
    try {
      template = this.loader.parse(asset.rawObj);
    } catch (error) {
      this.disposeMaterialIfUnused();
      throw error;
    }
    replaceOwnedObjMeshMaterials(
      template,
      () => this.getMaterial()
    );
    const geometries = new Set<THREE.BufferGeometry>();
    template.traverse((object) => {
      const geometry = (object as THREE.Object3D & {
        geometry?: THREE.BufferGeometry;
      }).geometry;
      if (!(geometry instanceof THREE.BufferGeometry)) return;
      geometries.add(markSharedThreeResource(geometry));
    });
    this.entries.set(asset.id, {
      rawObj: asset.rawObj,
      template,
      geometries
    });
    return template.clone(true);
  }

  prune(activeAssets: readonly ImportedObjAsset[]): ObjAssetCacheDisposal {
    const active = new Map(
      activeAssets.map((asset) => [asset.id, asset.rawObj] as const)
    );
    let templates = 0;
    let geometries = 0;
    for (const [id, entry] of this.entries) {
      if (active.get(id) === entry.rawObj) continue;
      geometries += this.removeEntry(id, entry);
      templates += 1;
    }
    const materials = this.disposeMaterialIfUnused();
    return { templates, geometries, materials };
  }

  clear(): ObjAssetCacheDisposal {
    let geometries = 0;
    const templates = this.entries.size;
    for (const [id, entry] of this.entries) {
      geometries += this.removeEntry(id, entry);
    }
    const materials = this.disposeMaterialIfUnused();
    return { templates, geometries, materials };
  }

  get size(): number {
    return this.entries.size;
  }

  private getMaterial(): THREE.MeshStandardMaterial {
    this.material ??= markSharedThreeResource(
      createSolidMaterial("#aab2bd")
    );
    return this.material;
  }

  private removeEntry(id: string, entry: CachedObjTemplate): number {
    for (const geometry of entry.geometries) geometry.dispose();
    entry.template.clear();
    this.entries.delete(id);
    return entry.geometries.size;
  }

  private disposeMaterialIfUnused(): number {
    if (this.entries.size > 0 || !this.material) return 0;
    this.material.dispose();
    this.material = null;
    return 1;
  }
}
