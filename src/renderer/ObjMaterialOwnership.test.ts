import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { disposeThreeObjectTree } from "./ThreeResourceDisposal";
import { replaceOwnedObjMeshMaterials } from "./ObjMaterialOwnership";

describe("OBJ material ownership", () => {
  it("disposes parser-owned materials once and shares one owned replacement", () => {
    const root = new THREE.Group();
    const firstMaterial = new THREE.MeshBasicMaterial();
    const secondMaterial = new THREE.MeshBasicMaterial();
    const firstDispose = vi.spyOn(firstMaterial, "dispose");
    const secondDispose = vi.spyOn(secondMaterial, "dispose");
    const first = new THREE.Mesh(
      new THREE.BoxGeometry(),
      firstMaterial
    );
    const second = new THREE.Mesh(
      new THREE.BoxGeometry(),
      [firstMaterial, secondMaterial]
    );
    root.add(first, second);
    const replacement = new THREE.MeshStandardMaterial();
    const replacementDispose = vi.spyOn(replacement, "dispose");

    expect(replaceOwnedObjMeshMaterials(root, () => replacement)).toEqual({
      meshes: 2,
      disposedMaterials: 2
    });
    expect(first.material).toBe(replacement);
    expect(second.material).toBe(replacement);
    expect(firstDispose).toHaveBeenCalledOnce();
    expect(secondDispose).toHaveBeenCalledOnce();

    const stats = disposeThreeObjectTree(root);
    expect(replacementDispose).toHaveBeenCalledOnce();
    expect(stats.materials).toBe(1);
    expect(stats.geometries).toBe(2);
  });

  it("does not allocate a replacement for an empty OBJ root", () => {
    const createMaterial = vi.fn(() => new THREE.MeshStandardMaterial());
    expect(
      replaceOwnedObjMeshMaterials(new THREE.Group(), createMaterial)
    ).toEqual({
      meshes: 0,
      disposedMaterials: 0
    });
    expect(createMaterial).not.toHaveBeenCalled();
  });
});
