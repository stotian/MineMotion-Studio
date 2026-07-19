import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import {
  disposeThreeObjectTree,
  markSharedThreeResource
} from "./ThreeResourceDisposal";

describe("disposeThreeObjectTree", () => {
  it("disposes owned resources once and clears the complete root", () => {
    const root = new THREE.Group();
    const geometry = new THREE.BoxGeometry();
    const texture = new THREE.Texture();
    const target = new THREE.WebGLRenderTarget(8, 8);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        colorMap: { value: texture },
        offscreen: { value: target }
      }
    });
    root.add(
      new THREE.Mesh(geometry, material),
      new THREE.Mesh(geometry, material)
    );
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const materialDispose = vi.spyOn(material, "dispose");
    const textureDispose = vi.spyOn(texture, "dispose");
    const targetDispose = vi.spyOn(target, "dispose");

    const stats = disposeThreeObjectTree(root);

    expect(root.children).toEqual([]);
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();
    expect(textureDispose).toHaveBeenCalledOnce();
    expect(targetDispose).toHaveBeenCalledOnce();
    expect(stats).toEqual({
      objects: 3,
      geometries: 1,
      materials: 1,
      textures: 1,
      renderTargets: 1,
      skeletons: 0
    });
  });

  it("keeps explicitly shared cache resources alive across rebuilds", () => {
    const root = new THREE.Group();
    const geometry = new THREE.BoxGeometry();
    const texture = markSharedThreeResource(new THREE.Texture());
    const material = markSharedThreeResource(
      new THREE.MeshBasicMaterial({ map: texture })
    );
    root.add(new THREE.Mesh(geometry, material));
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const materialDispose = vi.spyOn(material, "dispose");
    const textureDispose = vi.spyOn(texture, "dispose");

    const stats = disposeThreeObjectTree(root);

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).not.toHaveBeenCalled();
    expect(textureDispose).not.toHaveBeenCalled();
    expect(stats.geometries).toBe(1);
    expect(stats.materials).toBe(0);
    expect(stats.textures).toBe(0);
  });
});
