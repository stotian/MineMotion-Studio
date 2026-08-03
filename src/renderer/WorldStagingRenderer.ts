import * as THREE from "three";
import type { WorldSceneOverrides } from "../minecraft/staging/WorldSceneOverrides";
import {
  getMaterialForBlock,
  type MinecraftMaterialContext
} from "./MinecraftMaterialSystem";
import { tagThreeObjectLayer } from "./RendererLayers";

export interface WorldStagingRenderResult {
  props: THREE.Group;
  helpers: THREE.Group;
}

export function createWorldStagingObjects(
  overrides: WorldSceneOverrides | undefined,
  materialContext: MinecraftMaterialContext
): WorldStagingRenderResult {
  const props = new THREE.Group();
  props.name = "World scene props";
  const helpers = new THREE.Group();
  helpers.name = "World staging helpers";

  for (const prop of overrides?.propBlocks ?? []) {
    if (!prop.visible) continue;
    const materials = [
      getMaterialForBlock(prop.blockId, materialContext, "side"),
      getMaterialForBlock(prop.blockId, materialContext, "side"),
      getMaterialForBlock(prop.blockId, materialContext, "top"),
      getMaterialForBlock(prop.blockId, materialContext, "bottom"),
      getMaterialForBlock(prop.blockId, materialContext, "front"),
      getMaterialForBlock(prop.blockId, materialContext, "back")
    ];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
    mesh.name = prop.id;
    mesh.position.set(...prop.position);
    mesh.castShadow = prop.blockId !== "water" && prop.blockId !== "glass";
    mesh.receiveShadow = true;
    props.add(mesh);
  }

  for (const marker of overrides?.markers ?? []) {
    if (!marker.visible) continue;
    if (marker.kind === "anchor") {
      const axes = new THREE.AxesHelper(Math.max(1, marker.size[0]));
      axes.name = marker.id;
      axes.position.set(...marker.position);
      helpers.add(axes);
      continue;
    }
    if (marker.kind === "collision") {
      const collision = new THREE.Mesh(
        new THREE.BoxGeometry(...marker.size),
        new THREE.MeshBasicMaterial({
          color: marker.color,
          wireframe: true,
          transparent: true,
          opacity: 0.7,
          depthWrite: false
        })
      );
      collision.name = marker.id;
      collision.position.set(
        marker.position[0],
        marker.position[1] + marker.size[1] / 2,
        marker.position[2]
      );
      helpers.add(collision);
      continue;
    }
    const markerObject = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 8),
      new THREE.MeshBasicMaterial({ color: marker.color })
    );
    markerObject.name = marker.id;
    markerObject.position.set(...marker.position);
    helpers.add(markerObject);
  }

  tagThreeObjectLayer(props, "props");
  tagThreeObjectLayer(helpers, "helpers");
  return { props, helpers };
}
