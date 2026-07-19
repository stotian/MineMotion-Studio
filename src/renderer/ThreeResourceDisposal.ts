import * as THREE from "three";

const sharedResources = new WeakSet<object>();

export interface ThreeResourceDisposalStats {
  objects: number;
  geometries: number;
  materials: number;
  textures: number;
  renderTargets: number;
  skeletons: number;
}

export function markSharedThreeResource<T extends object>(resource: T): T {
  sharedResources.add(resource);
  return resource;
}

export function disposeThreeObjectTree(
  root: THREE.Object3D,
  clearRoot = true
): ThreeResourceDisposalStats {
  const stats: ThreeResourceDisposalStats = {
    objects: 0,
    geometries: 0,
    materials: 0,
    textures: 0,
    renderTargets: 0,
    skeletons: 0
  };
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const renderTargets = new Set<THREE.WebGLRenderTarget>();
  const skeletons = new Set<THREE.Skeleton>();

  root.traverse((object) => {
    stats.objects += 1;
    const renderable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
      skeleton?: THREE.Skeleton;
    };
    if (renderable.geometry instanceof THREE.BufferGeometry) {
      geometries.add(renderable.geometry);
    }
    if (Array.isArray(renderable.material)) {
      for (const material of renderable.material) materials.add(material);
    } else if (renderable.material instanceof THREE.Material) {
      materials.add(renderable.material);
    }
    if (renderable.skeleton instanceof THREE.Skeleton) {
      skeletons.add(renderable.skeleton);
    }
    collectNestedGpuResources(
      object.userData,
      textures,
      renderTargets,
      new Set<object>(),
      0
    );
  });

  for (const geometry of geometries) {
    if (sharedResources.has(geometry)) continue;
    geometry.dispose();
    stats.geometries += 1;
  }
  for (const material of materials) {
    collectNestedGpuResources(
      material,
      textures,
      renderTargets,
      new Set<object>(),
      0
    );
    if (sharedResources.has(material)) continue;
    material.dispose();
    stats.materials += 1;
  }
  for (const skeleton of skeletons) {
    if (sharedResources.has(skeleton)) continue;
    skeleton.dispose();
    stats.skeletons += 1;
  }
  const renderTargetTextures = new Set<THREE.Texture>();
  for (const renderTarget of renderTargets) {
    if (sharedResources.has(renderTarget)) continue;
    for (const texture of renderTarget.textures) renderTargetTextures.add(texture);
    renderTarget.dispose();
    stats.renderTargets += 1;
  }
  for (const texture of textures) {
    if (sharedResources.has(texture) || renderTargetTextures.has(texture)) continue;
    texture.dispose();
    stats.textures += 1;
  }

  if (clearRoot) root.clear();
  return stats;
}

function collectNestedGpuResources(
  value: unknown,
  textures: Set<THREE.Texture>,
  renderTargets: Set<THREE.WebGLRenderTarget>,
  visited: Set<object>,
  depth: number
): void {
  if (typeof value !== "object" || value === null || depth > 4) return;
  if (sharedResources.has(value)) return;
  if (value instanceof THREE.Texture) {
    textures.add(value);
    return;
  }
  if (value instanceof THREE.WebGLRenderTarget) {
    renderTargets.add(value);
    return;
  }
  if (visited.has(value)) return;
  visited.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      collectNestedGpuResources(item, textures, renderTargets, visited, depth + 1);
    }
    return;
  }
  for (const nested of Object.values(value)) {
    collectNestedGpuResources(nested, textures, renderTargets, visited, depth + 1);
  }
}
