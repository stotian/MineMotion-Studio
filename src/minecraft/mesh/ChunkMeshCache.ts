import type { ChunkMeshBuildResult } from "./ChunkMeshTypes";
import {
  disposeThreeObjectTree,
  type ThreeResourceDisposalStats
} from "../../renderer/ThreeResourceDisposal";

export interface ChunkMeshCacheDisposal extends ThreeResourceDisposalStats {
  entries: number;
}

export class ChunkMeshCache {
  private readonly cache = new Map<string, ChunkMeshBuildResult>();

  get(key: string): ChunkMeshBuildResult | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: ChunkMeshBuildResult): void {
    const previous = this.cache.get(key);
    if (previous && previous !== value) {
      disposeThreeObjectTree(previous.object);
    }
    this.cache.set(key, value);
  }

  delete(key: string): ChunkMeshCacheDisposal {
    const entry = this.cache.get(key);
    if (!entry) return emptyDisposal();
    this.cache.delete(key);
    return withEntries(disposeThreeObjectTree(entry.object), 1);
  }

  clear(): ChunkMeshCacheDisposal {
    const disposal = emptyDisposal();
    for (const entry of this.cache.values()) {
      addDisposal(disposal, disposeThreeObjectTree(entry.object));
      disposal.entries += 1;
    }
    this.cache.clear();
    return disposal;
  }
}

function emptyDisposal(): ChunkMeshCacheDisposal {
  return {
    entries: 0,
    objects: 0,
    geometries: 0,
    materials: 0,
    textures: 0,
    renderTargets: 0,
    skeletons: 0,
    instanceMeshes: 0
  };
}

function withEntries(
  disposal: ThreeResourceDisposalStats,
  entries: number
): ChunkMeshCacheDisposal {
  return { entries, ...disposal };
}

function addDisposal(
  target: ChunkMeshCacheDisposal,
  disposal: ThreeResourceDisposalStats
): void {
  target.objects += disposal.objects;
  target.geometries += disposal.geometries;
  target.materials += disposal.materials;
  target.textures += disposal.textures;
  target.renderTargets += disposal.renderTargets;
  target.skeletons += disposal.skeletons;
  target.instanceMeshes += disposal.instanceMeshes;
}
