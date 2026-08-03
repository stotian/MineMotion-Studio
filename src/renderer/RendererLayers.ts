import * as THREE from "three";

export const RENDERER_LAYER_IDS = Object.freeze([
  "world",
  "characters",
  "props",
  "transparency",
  "vfx",
  "post",
  "overlays",
  "helpers"
] as const);

export type RendererLayerId = (typeof RENDERER_LAYER_IDS)[number];
export type RendererLayerMode = "editor" | "final";
export type RendererLayerSurface =
  | "three-scene"
  | "three-material-pass"
  | "css-preview"
  | "canvas-export";

export interface RendererLayerDefinition {
  readonly id: RendererLayerId;
  readonly surfaces: readonly RendererLayerSurface[];
  readonly crossCutting: boolean;
  readonly finalEligible: boolean;
}

export interface RendererLayerVisibilityInput {
  readonly mode: RendererLayerMode;
  readonly renderPass?: "beauty" | "alpha" | "world" | "characters" | "vfx" | "depth" | "normals" | "object-id";
  readonly includeVfx: boolean;
  readonly includePost: boolean;
  readonly includeOverlays: boolean;
}

export type RendererLayerVisibility = Readonly<
  Record<RendererLayerId, boolean>
>;

export type ThreeSceneLayerId =
  | "world"
  | "characters"
  | "props"
  | "vfx"
  | "helpers";

export const RENDERER_LAYER_DEFINITIONS: Readonly<
  Record<RendererLayerId, RendererLayerDefinition>
> = Object.freeze({
  world: definition("world", ["three-scene"], false, true),
  characters: definition("characters", ["three-scene"], false, true),
  props: definition("props", ["three-scene"], false, true),
  transparency: definition(
    "transparency",
    ["three-material-pass"],
    true,
    true
  ),
  vfx: definition(
    "vfx",
    ["three-scene", "css-preview", "canvas-export"],
    true,
    true
  ),
  post: definition("post", ["css-preview", "canvas-export"], false, true),
  overlays: definition(
    "overlays",
    ["css-preview", "canvas-export"],
    false,
    true
  ),
  helpers: definition(
    "helpers",
    ["three-scene", "css-preview"],
    false,
    false
  )
});

export function resolveRendererLayerVisibility(
  input: RendererLayerVisibilityInput
): RendererLayerVisibility {
  const pass = input.renderPass ?? "beauty";
  const isolated = input.mode === "final" && !["beauty", "alpha", "depth", "normals", "object-id"].includes(pass);
  return Object.freeze({
    world: !isolated || pass === "world",
    characters: !isolated || pass === "characters",
    props: !isolated,
    transparency: true,
    vfx: input.includeVfx && (!isolated || pass === "vfx"),
    post: input.includePost && !isolated,
    overlays: input.includeOverlays && !isolated,
    helpers: input.mode === "editor"
  });
}

export function tagThreeObjectLayer(
  root: THREE.Object3D,
  layer: ThreeSceneLayerId
): void {
  root.traverse((object) => {
    const pass = resolveMaterialPass(object);
    object.userData.rendererLayer = layer;
    object.userData.rendererLayers = pass === "transparent"
      ? [layer, "transparency"]
      : [layer];
    object.userData.rendererPass = pass;
  });
}

function definition(
  id: RendererLayerId,
  surfaces: readonly RendererLayerSurface[],
  crossCutting: boolean,
  finalEligible: boolean
): RendererLayerDefinition {
  return Object.freeze({
    id,
    surfaces: Object.freeze([...surfaces]),
    crossCutting,
    finalEligible
  });
}

function resolveMaterialPass(
  object: THREE.Object3D
): "container" | "opaque" | "transparent" {
  const material = (object as THREE.Object3D & {
    material?: THREE.Material | THREE.Material[];
  }).material;
  if (!material || (Array.isArray(material) && material.length === 0)) {
    return "container";
  }
  if (Array.isArray(material)) {
    return material.some((entry) => entry.transparent)
      ? "transparent"
      : "opaque";
  }
  return material.transparent ? "transparent" : "opaque";
}
