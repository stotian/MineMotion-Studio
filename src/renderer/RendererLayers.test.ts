import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  RENDERER_LAYER_DEFINITIONS,
  RENDERER_LAYER_IDS,
  resolveRendererLayerVisibility,
  tagThreeObjectLayer
} from "./RendererLayers";

describe("renderer layer contract", () => {
  it("defines the eight immutable layer families and honest surfaces", () => {
    expect(RENDERER_LAYER_IDS).toEqual([
      "world",
      "characters",
      "props",
      "transparency",
      "vfx",
      "post",
      "overlays",
      "helpers"
    ]);
    expect(RENDERER_LAYER_DEFINITIONS.transparency).toMatchObject({
      surfaces: ["three-material-pass"],
      crossCutting: true,
      finalEligible: true
    });
    expect(RENDERER_LAYER_DEFINITIONS.helpers).toMatchObject({
      finalEligible: false
    });
    for (const definition of Object.values(RENDERER_LAYER_DEFINITIONS)) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.surfaces)).toBe(true);
    }
  });

  it("keeps editor helpers out of final visibility plans", () => {
    expect(resolveRendererLayerVisibility({
      mode: "editor",
      includeVfx: true,
      includePost: true,
      includeOverlays: true
    })).toMatchObject({
      world: true,
      characters: true,
      props: true,
      transparency: true,
      vfx: true,
      post: true,
      overlays: true,
      helpers: true
    });
    expect(resolveRendererLayerVisibility({
      mode: "final",
      includeVfx: false,
      includePost: false,
      includeOverlays: false
    })).toMatchObject({
      vfx: false,
      post: false,
      overlays: false,
      helpers: false
    });
  });

  it("tags Three.js objects while treating transparency as cross-cutting", () => {
    const root = new THREE.Group();
    const opaque = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    const transparent = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 })
    );
    root.add(opaque, transparent);

    tagThreeObjectLayer(root, "vfx");

    expect(root.userData).toMatchObject({
      rendererLayer: "vfx",
      rendererLayers: ["vfx"],
      rendererPass: "container"
    });
    expect(opaque.userData).toMatchObject({
      rendererLayer: "vfx",
      rendererLayers: ["vfx"],
      rendererPass: "opaque"
    });
    expect(transparent.userData).toMatchObject({
      rendererLayer: "vfx",
      rendererLayers: ["vfx", "transparency"],
      rendererPass: "transparent"
    });
    opaque.geometry.dispose();
    (opaque.material as THREE.Material).dispose();
    transparent.geometry.dispose();
    (transparent.material as THREE.Material).dispose();
  });
});
