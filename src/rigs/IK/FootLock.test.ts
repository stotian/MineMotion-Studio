import { describe, expect, it } from "vitest";
import type { GroundSample } from "../../minecraft/GroundSampler";
import { createFootLockAnchor, sampleFootLockFrame } from "./FootLock";

const ground: GroundSample = {
  hit: true,
  height: 2,
  blockId: "grass",
  blockPosition: [1, 1, 3],
  source: "terrain-preset",
  warning: null
};

describe("foot lock sample contract", () => {
  it("anchors horizontal placement to the first foot sample and vertical placement to ground", () => {
    const result = createFootLockAnchor("leftLeg", 12, 18, [1.2, 2.4, 3.6], ground, 0.05);
    expect(result).toEqual({
      ok: true,
      anchor: {
        limb: "leftLeg",
        startFrame: 12,
        endFrame: 18,
        worldPosition: [1.2, 2.05, 3.6],
        groundHeight: 2,
        groundOffset: 0.05
      },
      error: null
    });
  });

  it("keeps an in-range target fixed and reports prevented horizontal slide", () => {
    const anchor = createFootLockAnchor("rightLeg", 4, 8, [0, 1, 0], ground).anchor!;
    const sample = sampleFootLockFrame(anchor, 6, [0.3, 2.1, 0.4]);
    expect(sample).toMatchObject({
      locked: true,
      targetWorldPosition: [0, 2, 0],
      horizontalSlideDistance: 0.5
    });
    expect(sample.correctionDistance).toBeCloseTo(Math.hypot(0.3, 0.1, 0.4));
    expect(sampleFootLockFrame(anchor, 9, [0.3, 2.1, 0.4])).toMatchObject({
      locked: false,
      targetWorldPosition: [0.3, 2.1, 0.4],
      correctionDistance: 0
    });
  });

  it("rejects invalid, oversized, ungrounded, and non-finite anchors", () => {
    expect(createFootLockAnchor("leftLeg", 8, 4, [0, 0, 0], ground).error)
      .toContain("FOOT_LOCK_RANGE_INVALID");
    expect(createFootLockAnchor("leftLeg", 0, 600, [0, 0, 0], ground).error)
      .toContain("FOOT_LOCK_RANGE_TOO_LARGE");
    expect(createFootLockAnchor("leftLeg", 0, 4, [0, 0, 0], {
      hit: false,
      height: null,
      blockId: null,
      blockPosition: null,
      source: null,
      warning: "GROUND_SURFACE_NOT_FOUND"
    }).error).toContain("FOOT_LOCK_GROUND_MISSING");
    expect(createFootLockAnchor("leftLeg", 0, 4, [0, Number.NaN, 0], ground).error)
      .toContain("FOOT_LOCK_POSITION_INVALID");
  });
});
