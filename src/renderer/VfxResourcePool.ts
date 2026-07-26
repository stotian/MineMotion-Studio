import * as THREE from "three";
import { markSharedThreeResource } from "./ThreeResourceDisposal";

export interface VfxMeshMaterialOptions {
  color: THREE.ColorRepresentation;
  opacity: number;
  wireframe?: boolean;
  blending?: THREE.Blending;
  depthWrite?: boolean;
}

export interface VfxLineMaterialOptions {
  color: THREE.ColorRepresentation;
  opacity: number;
  blending?: THREE.Blending;
  depthWrite?: boolean;
}

export interface VfxResourcePoolLimits {
  meshMaterials: number;
  lineMaterials: number;
  particleMeshes: number;
}

export interface VfxResourcePoolSnapshot {
  geometries: number;
  meshMaterials: number;
  lineMaterials: number;
  particleMeshes: number;
  acquiredMeshMaterials: number;
  acquiredLineMaterials: number;
  acquiredParticleMeshes: number;
  overflowMaterials: number;
  overflowParticleMeshes: number;
}

export interface VfxResourcePoolDisposalStats {
  geometries: number;
  materials: number;
  particleMeshes: number;
}

export const DEFAULT_VFX_RESOURCE_POOL_LIMITS: Readonly<VfxResourcePoolLimits> =
  Object.freeze({
    meshMaterials: 512,
    lineMaterials: 512,
    particleMeshes: 128
  });

function normalizeLimit(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function clampOpacity(value: number): number {
  return Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;
}

/**
 * Reuses immutable primitive geometries and one material slot per active VFX
 * primitive. A slot is never shared by two primitives in the same frame.
 */
export class VfxResourcePool {
  private readonly limits: VfxResourcePoolLimits;
  private unitCube: THREE.BoxGeometry | null = null;
  private unitSphere: THREE.SphereGeometry | null = null;
  private readonly meshMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly lineMaterials: THREE.LineBasicMaterial[] = [];
  private readonly particleMeshes: THREE.InstancedMesh[] = [];
  private meshMaterialIndex = 0;
  private lineMaterialIndex = 0;
  private particleMeshIndex = 0;
  private overflowMaterials = 0;
  private overflowParticleMeshes = 0;

  constructor(limits: VfxResourcePoolLimits = DEFAULT_VFX_RESOURCE_POOL_LIMITS) {
    this.limits = {
      meshMaterials: normalizeLimit(limits.meshMaterials),
      lineMaterials: normalizeLimit(limits.lineMaterials),
      particleMeshes: normalizeLimit(limits.particleMeshes)
    };
  }

  /**
   * Must be called only after the previous scene tree has been detached and
   * disposed, so every pooled material slot is safe to acquire again.
   */
  beginFrame(): void {
    this.meshMaterialIndex = 0;
    this.lineMaterialIndex = 0;
    this.particleMeshIndex = 0;
    this.overflowMaterials = 0;
    this.overflowParticleMeshes = 0;
  }

  getUnitCubeGeometry(): THREE.BoxGeometry {
    this.unitCube ??= markSharedThreeResource(
      new THREE.BoxGeometry(1, 1, 1)
    );
    return this.unitCube;
  }

  getUnitSphereGeometry(): THREE.SphereGeometry {
    this.unitSphere ??= markSharedThreeResource(
      new THREE.SphereGeometry(1, 16, 8)
    );
    return this.unitSphere;
  }

  acquireMeshMaterial(
    options: VfxMeshMaterialOptions
  ): THREE.MeshBasicMaterial {
    const index = this.meshMaterialIndex;
    this.meshMaterialIndex += 1;
    const material = this.acquireMaterial(
      this.meshMaterials,
      index,
      this.limits.meshMaterials,
      () => new THREE.MeshBasicMaterial()
    );
    configureMeshMaterial(material, options);
    return material;
  }

  acquireLineMaterial(
    options: VfxLineMaterialOptions
  ): THREE.LineBasicMaterial {
    const index = this.lineMaterialIndex;
    this.lineMaterialIndex += 1;
    const material = this.acquireMaterial(
      this.lineMaterials,
      index,
      this.limits.lineMaterials,
      () => new THREE.LineBasicMaterial()
    );
    configureLineMaterial(material, options);
    return material;
  }

  acquireParticleMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number
  ): THREE.InstancedMesh {
    const safeCount = Number.isFinite(count)
      ? Math.max(1, Math.floor(count))
      : 1;
    const index = this.particleMeshIndex;
    this.particleMeshIndex += 1;
    let mesh = this.particleMeshes[index];
    if (mesh && mesh.instanceMatrix.count < safeCount) {
      mesh.dispose();
      mesh = markSharedThreeResource(
        new THREE.InstancedMesh(geometry, material, safeCount)
      );
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.particleMeshes[index] = mesh;
    } else if (!mesh) {
      mesh = new THREE.InstancedMesh(geometry, material, safeCount);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      if (this.particleMeshes.length < this.limits.particleMeshes) {
        this.particleMeshes.push(markSharedThreeResource(mesh));
      } else {
        this.overflowParticleMeshes += 1;
      }
    }
    mesh.geometry = geometry;
    mesh.material = material;
    mesh.count = safeCount;
    mesh.boundingBox = null;
    mesh.boundingSphere = null;
    mesh.name = "";
    return mesh;
  }

  snapshot(): VfxResourcePoolSnapshot {
    return {
      geometries: Number(this.unitCube !== null) + Number(this.unitSphere !== null),
      meshMaterials: this.meshMaterials.length,
      lineMaterials: this.lineMaterials.length,
      particleMeshes: this.particleMeshes.length,
      acquiredMeshMaterials: this.meshMaterialIndex,
      acquiredLineMaterials: this.lineMaterialIndex,
      acquiredParticleMeshes: this.particleMeshIndex,
      overflowMaterials: this.overflowMaterials,
      overflowParticleMeshes: this.overflowParticleMeshes
    };
  }

  dispose(): VfxResourcePoolDisposalStats {
    let geometries = 0;
    for (const mesh of this.particleMeshes) mesh.dispose();
    if (this.unitCube) {
      this.unitCube.dispose();
      this.unitCube = null;
      geometries += 1;
    }
    if (this.unitSphere) {
      this.unitSphere.dispose();
      this.unitSphere = null;
      geometries += 1;
    }
    for (const material of this.meshMaterials) material.dispose();
    for (const material of this.lineMaterials) material.dispose();
    const materials = this.meshMaterials.length + this.lineMaterials.length;
    const particleMeshes = this.particleMeshes.length;
    this.meshMaterials.length = 0;
    this.lineMaterials.length = 0;
    this.particleMeshes.length = 0;
    this.beginFrame();
    return { geometries, materials, particleMeshes };
  }

  private acquireMaterial<T extends THREE.Material>(
    resources: T[],
    index: number,
    limit: number,
    create: () => T
  ): T {
    if (index < resources.length) return resources[index];
    const material = create();
    if (resources.length < limit) {
      resources.push(markSharedThreeResource(material));
    } else {
      this.overflowMaterials += 1;
    }
    return material;
  }
}

function configureMeshMaterial(
  material: THREE.MeshBasicMaterial,
  options: VfxMeshMaterialOptions
): void {
  const wireframe = options.wireframe ?? false;
  const blending = options.blending ?? THREE.NormalBlending;
  const depthWrite = options.depthWrite ?? true;
  const requiresProgramUpdate =
    material.wireframe !== wireframe ||
    material.blending !== blending ||
    material.depthWrite !== depthWrite;
  material.color.set(options.color);
  material.opacity = clampOpacity(options.opacity);
  material.transparent = true;
  material.wireframe = wireframe;
  material.blending = blending;
  material.depthWrite = depthWrite;
  if (requiresProgramUpdate) material.needsUpdate = true;
}

function configureLineMaterial(
  material: THREE.LineBasicMaterial,
  options: VfxLineMaterialOptions
): void {
  const blending = options.blending ?? THREE.NormalBlending;
  const depthWrite = options.depthWrite ?? true;
  const requiresProgramUpdate =
    material.blending !== blending || material.depthWrite !== depthWrite;
  material.color.set(options.color);
  material.opacity = clampOpacity(options.opacity);
  material.transparent = true;
  material.blending = blending;
  material.depthWrite = depthWrite;
  if (requiresProgramUpdate) material.needsUpdate = true;
}
