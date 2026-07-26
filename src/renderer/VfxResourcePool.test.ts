import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { disposeThreeObjectTree } from "./ThreeResourceDisposal";
import { VfxResourcePool } from "./VfxResourcePool";

describe("VfxResourcePool", () => {
  it("reuses geometry and material slots only after a frame reset", () => {
    const pool = new VfxResourcePool({
      meshMaterials: 2,
      lineMaterials: 1,
      particleMeshes: 1
    });
    const cube = pool.getUnitCubeGeometry();
    const first = pool.acquireMeshMaterial({
      color: "#ff0000",
      opacity: 0.5
    });
    const second = pool.acquireMeshMaterial({
      color: "#00ff00",
      opacity: 0.75
    });

    expect(second).not.toBe(first);
    expect(pool.getUnitCubeGeometry()).toBe(cube);

    pool.beginFrame();
    const reused = pool.acquireMeshMaterial({
      color: "#0000ff",
      opacity: 3,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    expect(reused).toBe(first);
    expect(reused.color.getHexString()).toBe("0000ff");
    expect(reused.opacity).toBe(1);
    expect(reused.wireframe).toBe(true);
    expect(reused.blending).toBe(THREE.AdditiveBlending);
    expect(reused.depthWrite).toBe(false);
    expect(pool.snapshot()).toMatchObject({
      geometries: 1,
      meshMaterials: 2,
      acquiredMeshMaterials: 1,
      overflowMaterials: 0
    });
  });

  it("returns owned overflow materials for normal scene-tree disposal", () => {
    const pool = new VfxResourcePool({
      meshMaterials: 1,
      lineMaterials: 0,
      particleMeshes: 0
    });
    const root = new THREE.Group();
    const geometry = pool.getUnitCubeGeometry();
    const pooled = pool.acquireMeshMaterial({
      color: "#ffffff",
      opacity: 1
    });
    const overflow = pool.acquireMeshMaterial({
      color: "#000000",
      opacity: 1
    });
    root.add(
      new THREE.Mesh(geometry, pooled),
      new THREE.Mesh(geometry, overflow)
    );
    const pooledDispose = vi.spyOn(pooled, "dispose");
    const overflowDispose = vi.spyOn(overflow, "dispose");

    const stats = disposeThreeObjectTree(root);

    expect(pool.snapshot().overflowMaterials).toBe(1);
    expect(pooledDispose).not.toHaveBeenCalled();
    expect(overflowDispose).toHaveBeenCalledOnce();
    expect(stats.materials).toBe(1);
  });

  it("disposes every pooled resource exactly once and can be reused", () => {
    const pool = new VfxResourcePool({
      meshMaterials: 1,
      lineMaterials: 1,
      particleMeshes: 1
    });
    const cube = pool.getUnitCubeGeometry();
    const sphere = pool.getUnitSphereGeometry();
    const mesh = pool.acquireMeshMaterial({
      color: "#ffffff",
      opacity: 1
    });
    const line = pool.acquireLineMaterial({
      color: "#ffffff",
      opacity: 1
    });
    const cubeDispose = vi.spyOn(cube, "dispose");
    const sphereDispose = vi.spyOn(sphere, "dispose");
    const meshDispose = vi.spyOn(mesh, "dispose");
    const lineDispose = vi.spyOn(line, "dispose");
    const instances = pool.acquireParticleMesh(cube, mesh, 4);
    const instancesDispose = vi.spyOn(instances, "dispose");

    expect(pool.dispose()).toEqual({
      geometries: 2,
      materials: 2,
      particleMeshes: 1
    });
    expect(cubeDispose).toHaveBeenCalledOnce();
    expect(sphereDispose).toHaveBeenCalledOnce();
    expect(meshDispose).toHaveBeenCalledOnce();
    expect(lineDispose).toHaveBeenCalledOnce();
    expect(instancesDispose).toHaveBeenCalledOnce();
    expect(pool.dispose()).toEqual({
      geometries: 0,
      materials: 0,
      particleMeshes: 0
    });
    expect(pool.getUnitCubeGeometry()).not.toBe(cube);
  });

  it("reuses particle buffers by capacity and replaces smaller slots safely", () => {
    const pool = new VfxResourcePool({
      meshMaterials: 1,
      lineMaterials: 0,
      particleMeshes: 1
    });
    const geometry = pool.getUnitCubeGeometry();
    const material = pool.acquireMeshMaterial({
      color: "#ffffff",
      opacity: 1
    });
    const first = pool.acquireParticleMesh(geometry, material, 8);
    const firstDispose = vi.spyOn(first, "dispose");

    pool.beginFrame();
    const reused = pool.acquireParticleMesh(geometry, material, 4);

    expect(reused).toBe(first);
    expect(reused.count).toBe(4);
    expect(reused.instanceMatrix.count).toBe(8);
    expect(firstDispose).not.toHaveBeenCalled();

    pool.beginFrame();
    const grown = pool.acquireParticleMesh(geometry, material, 12);

    expect(grown).not.toBe(first);
    expect(grown.instanceMatrix.count).toBe(12);
    expect(firstDispose).toHaveBeenCalledOnce();
    expect(pool.snapshot()).toMatchObject({
      particleMeshes: 1,
      acquiredParticleMeshes: 1,
      overflowParticleMeshes: 0
    });
  });

  it("leaves overflow particle buffers owned by the scene tree", () => {
    const pool = new VfxResourcePool({
      meshMaterials: 1,
      lineMaterials: 0,
      particleMeshes: 0
    });
    const root = new THREE.Group();
    const geometry = pool.getUnitCubeGeometry();
    const material = pool.acquireMeshMaterial({
      color: "#ffffff",
      opacity: 1
    });
    const overflow = pool.acquireParticleMesh(geometry, material, 4);
    const dispose = vi.spyOn(overflow, "dispose");
    root.add(overflow);

    const stats = disposeThreeObjectTree(root);

    expect(dispose).toHaveBeenCalledOnce();
    expect(stats.instanceMeshes).toBe(1);
    expect(pool.snapshot()).toMatchObject({
      particleMeshes: 0,
      overflowParticleMeshes: 1
    });
  });
});
