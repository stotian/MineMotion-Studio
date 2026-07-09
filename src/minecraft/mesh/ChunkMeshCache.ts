import type { ChunkMeshBuildResult } from "./ChunkMeshTypes";

export class ChunkMeshCache {
  private readonly cache = new Map<string, ChunkMeshBuildResult>();

  get(key: string): ChunkMeshBuildResult | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: ChunkMeshBuildResult): void {
    this.cache.set(key, value);
  }

  clear(): void {
    for (const entry of this.cache.values()) {
      entry.object.clear();
    }
    this.cache.clear();
  }
}
