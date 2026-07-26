import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { ChunkMeshCache } from "./ChunkMeshCache";
import type { ChunkMeshBuildResult } from "./ChunkMeshTypes";

function result(
  geometry: THREE.BufferGeometry,
  material: THREE.Material
): ChunkMeshBuildResult {
  const object = new THREE.Group();
  object.add(new THREE.Mesh(geometry, material));
  return {
    object,
    visibleBlocks: 1,
    chunkCount: 1,
    chunks: [
      {
        object: new THREE.Group(),
        chunkX: 0,
        chunkZ: 0,
        visibleBlocks: 1
      }
    ],
    helpers: null
  };
}

describe("ChunkMeshCache ownership", () => {
  it("disposes a replaced entry without touching the replacement", () => {
    const cache = new ChunkMeshCache();
    const firstGeometry = new THREE.BoxGeometry();
    const firstMaterial = new THREE.MeshBasicMaterial();
    const secondGeometry = new THREE.BoxGeometry();
    const secondMaterial = new THREE.MeshBasicMaterial();
    const first = result(firstGeometry, firstMaterial);
    const second = result(secondGeometry, secondMaterial);
    const firstGeometryDispose = vi.spyOn(firstGeometry, "dispose");
    const firstMaterialDispose = vi.spyOn(firstMaterial, "dispose");
    const secondGeometryDispose = vi.spyOn(secondGeometry, "dispose");

    cache.set("chunk", first);
    cache.set("chunk", first);
    expect(firstGeometryDispose).not.toHaveBeenCalled();

    cache.set("chunk", second);

    expect(first.object.children).toEqual([]);
    expect(firstGeometryDispose).toHaveBeenCalledOnce();
    expect(firstMaterialDispose).toHaveBeenCalledOnce();
    expect(secondGeometryDispose).not.toHaveBeenCalled();
    expect(cache.get("chunk")).toBe(second);
  });

  it("reports complete delete and clear disposal", () => {
    const cache = new ChunkMeshCache();
    cache.set(
      "first",
      result(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    );
    cache.set(
      "second",
      result(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial())
    );

    expect(cache.delete("missing")).toMatchObject({ entries: 0, objects: 0 });
    expect(cache.delete("first")).toMatchObject({
      entries: 1,
      objects: 2,
      geometries: 1,
      materials: 1
    });
    expect(cache.clear()).toMatchObject({
      entries: 1,
      objects: 2,
      geometries: 1,
      materials: 1
    });
    expect(cache.clear()).toMatchObject({ entries: 0, objects: 0 });
  });
});
