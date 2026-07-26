import * as THREE from "three";

export interface ObjMaterialReplacement {
  meshes: number;
  disposedMaterials: number;
}

export function replaceOwnedObjMeshMaterials(
  root: THREE.Object3D,
  createMaterial: () => THREE.Material
): ObjMaterialReplacement {
  const meshes: THREE.Mesh[] = [];
  const previousMaterials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    meshes.push(object);
    if (Array.isArray(object.material)) {
      for (const material of object.material) {
        previousMaterials.add(material);
      }
    } else {
      previousMaterials.add(object.material);
    }
  });
  if (meshes.length === 0) {
    return { meshes: 0, disposedMaterials: 0 };
  }

  const replacement = createMaterial();
  for (const mesh of meshes) {
    mesh.material = replacement;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  for (const material of previousMaterials) {
    if (material === replacement) continue;
    material.dispose();
  }
  return {
    meshes: meshes.length,
    disposedMaterials:
      previousMaterials.size - (previousMaterials.has(replacement) ? 1 : 0)
  };
}
