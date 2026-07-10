import * as THREE from "three";
import type { MinecraftSkinModelType } from "./RigTypes";

export type MinecraftSkinPart =
  | "head"
  | "body"
  | "leftArm"
  | "rightArm"
  | "leftLeg"
  | "rightLeg";

export type MinecraftSkinFace = "right" | "left" | "top" | "bottom" | "front" | "back";

export interface SkinUvRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SkinUvRegionMap = Record<MinecraftSkinFace, SkinUvRegion>;

const FACE_ORDER: MinecraftSkinFace[] = [
  "right",
  "left",
  "top",
  "bottom",
  "front",
  "back"
];

export function getSkinUvRegions(
  part: MinecraftSkinPart,
  modelType: MinecraftSkinModelType,
  legacy = false
): SkinUvRegionMap {
  if (part === "head") {
    return cuboidRegions(0, 0, 8, 8, 8);
  }
  if (part === "body") {
    return cuboidRegions(16, 16, 8, 12, 4);
  }
  if (part === "rightArm") {
    return cuboidRegions(40, 16, modelType === "alex" ? 3 : 4, 12, 4);
  }
  if (part === "leftArm") {
    return legacy
      ? mirrorRegions(cuboidRegions(40, 16, modelType === "alex" ? 3 : 4, 12, 4))
      : cuboidRegions(32, 48, modelType === "alex" ? 3 : 4, 12, 4);
  }
  if (part === "rightLeg") {
    return cuboidRegions(0, 16, 4, 12, 4);
  }
  return legacy
    ? mirrorRegions(cuboidRegions(0, 16, 4, 12, 4))
    : cuboidRegions(16, 48, 4, 12, 4);
}

export function getSkinFaceUv(
  part: MinecraftSkinPart,
  face: MinecraftSkinFace,
  modelType: MinecraftSkinModelType,
  legacy = false,
  skinWidth = 64,
  skinHeight = legacy ? 32 : 64
) {
  return normalizeRegion(
    getSkinUvRegions(part, modelType, legacy)[face],
    skinWidth,
    skinHeight
  );
}

export function applySkinUvToBoxGeometry(
  geometry: THREE.BoxGeometry,
  part: MinecraftSkinPart,
  modelType: MinecraftSkinModelType,
  legacy = false
): THREE.BoxGeometry {
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  const regions = getSkinUvRegions(part, modelType, legacy);
  FACE_ORDER.forEach((face, faceIndex) => {
    const rect = normalizeRegion(regions[face], 64, legacy ? 32 : 64);
    const vertexIndex = faceIndex * 4;
    uv.setXY(vertexIndex, rect.u1, rect.v1);
    uv.setXY(vertexIndex + 1, rect.u2, rect.v1);
    uv.setXY(vertexIndex + 2, rect.u1, rect.v2);
    uv.setXY(vertexIndex + 3, rect.u2, rect.v2);
  });
  uv.needsUpdate = true;
  return geometry;
}

function cuboidRegions(
  originX: number,
  originY: number,
  width: number,
  height: number,
  depth: number
): SkinUvRegionMap {
  return {
    right: { x: originX, y: originY + depth, width: depth, height },
    front: { x: originX + depth, y: originY + depth, width, height },
    left: { x: originX + depth + width, y: originY + depth, width: depth, height },
    back: {
      x: originX + depth + width + depth,
      y: originY + depth,
      width,
      height
    },
    top: { x: originX + depth, y: originY, width, height: depth },
    bottom: { x: originX + depth + width, y: originY, width, height: depth }
  };
}

function mirrorRegions(regions: SkinUvRegionMap): SkinUvRegionMap {
  return {
    ...regions,
    left: regions.right,
    right: regions.left
  };
}

function normalizeRegion(region: SkinUvRegion, skinWidth: number, skinHeight: number) {
  const u1 = region.x / skinWidth;
  const u2 = (region.x + region.width) / skinWidth;
  const v1 = 1 - (region.y + region.height) / skinHeight;
  const v2 = 1 - region.y / skinHeight;
  return { u1, u2, v1, v2 };
}
