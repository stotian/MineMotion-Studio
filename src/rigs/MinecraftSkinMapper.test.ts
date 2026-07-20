import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  applySkinUvToBoxGeometry,
  getSkinFaceUv,
  getSkinUvRegions
} from "./MinecraftSkinMapper";

describe("MinecraftSkinMapper", () => {
  it("maps head front to the Minecraft skin face region", () => {
    const region = getSkinUvRegions("head", "steve").front;

    expect(region).toEqual({ x: 8, y: 8, width: 8, height: 8 });
  });

  it("uses 3px arm width for Alex skin UVs", () => {
    const front = getSkinUvRegions("rightArm", "alex").front;

    expect(front.width).toBe(3);
  });

  it("normalizes UVs into 0..1 coordinates", () => {
    const uv = getSkinFaceUv("body", "front", "steve");

    expect(uv.u1).toBeGreaterThanOrEqual(0);
    expect(uv.u2).toBeLessThanOrEqual(1);
    expect(uv.v1).toBeGreaterThanOrEqual(0);
    expect(uv.v2).toBeLessThanOrEqual(1);
  });

  it("writes UV coordinates onto box geometry", () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    applySkinUvToBoxGeometry(geometry, "head", "steve");
    const uv = geometry.getAttribute("uv");

    expect(uv.count).toBe(24);
    expect(uv.getX(0)).toBeGreaterThanOrEqual(0);
    expect(uv.getY(0)).toBeLessThanOrEqual(1);
  });

  it("maps upper and lower limb segments to different vertical skin halves", () => {
    const upper = new THREE.BoxGeometry(1, 1, 1);
    const lower = new THREE.BoxGeometry(1, 1, 1);
    applySkinUvToBoxGeometry(upper, "rightArm", "steve", false, "upper");
    applySkinUvToBoxGeometry(lower, "rightArm", "steve", false, "lower");
    const upperUv = upper.getAttribute("uv");
    const lowerUv = lower.getAttribute("uv");
    expect(upperUv.getY(16)).toBeGreaterThan(lowerUv.getY(16));
    expect(upperUv.getX(16)).toBe(lowerUv.getX(16));
  });
});
