import { describe, expect, it } from "vitest";
import {
  deriveSeed,
  hashStringToUint32,
  randomFloat01,
  randomUint32
} from "./DeterministicRandom";

describe("DeterministicRandom", () => {
  it("keeps fixed FNV-1a-style UTF-16 hash vectors", () => {
    expect(hashStringToUint32("")).toBe(0x811c9dc5);
    expect(hashStringToUint32("a")).toBe(0xe40c292c);
    expect(hashStringToUint32("hello")).toBe(0x4f9f2cab);
    expect(hashStringToUint32("project:frame:42")).toBe(0x7fa0ed6f);
    expect(hashStringToUint32("😀")).toBe(0xcb31c4b8);
  });

  it("derives typed, length-prefixed sub-seeds without delimiter collisions", () => {
    expect(
      deriveSeed("project-seed", "instance-seed", "fire", "particles")
    ).toBe(0x98321383);
    expect(deriveSeed("a:b", "c")).toBe(0x7bb0ae52);
    expect(deriveSeed("a", "b:c")).toBe(0xad3ec08e);
    expect(deriveSeed("a:b", "c")).not.toBe(deriveSeed("a", "b:c"));
    expect(deriveSeed("1")).not.toBe(deriveSeed(1));
    expect(deriveSeed("seed", "particle", 0)).toBe(0xd668a55d);
    expect(deriveSeed("seed", "particle", 1)).toBe(0x566bad74);
  });

  it("keeps fixed counter-addressed Mulberry32 uint vectors", () => {
    expect(Array.from({ length: 5 }, (_, index) => randomUint32(0, index))).toEqual([
      0x4434b462,
      0x00159c37,
      0x39285b08,
      0x256d8104,
      0x77a2cbd4
    ]);
    expect(
      Array.from({ length: 5 }, (_, index) =>
        randomUint32(hashStringToUint32("hello"), index)
      )
    ).toEqual([
      0xa196195d,
      0xcc609a7b,
      0x4f024770,
      0x7432b4e5,
      0x0ca66d3d
    ]);
  });

  it("keeps fixed [0, 1) float vectors", () => {
    expect(Array.from({ length: 5 }, (_, index) => randomFloat01(0, index))).toEqual([
      0.26642920868471265,
      0.0003297457005828619,
      0.2232720274478197,
      0.1462021479383111,
      0.46732782293111086
    ]);
    for (let index = 0; index < 100; index += 1) {
      const value = randomFloat01(0xffffffff, index);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("rejects invalid seed parts, uint seeds, and sample indices", () => {
    for (const value of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => deriveSeed("seed", value)).toThrow(RangeError);
    }
    expect(() => deriveSeed("seed", Number.MAX_SAFE_INTEGER + 1)).toThrow(
      RangeError
    );

    for (const value of [-1, 1.5, 0x1_0000_0000, Number.NaN]) {
      expect(() => randomUint32(value, 0)).toThrow(RangeError);
      expect(() => randomUint32(0, value)).toThrow(RangeError);
    }
  });

  it("rejects non-string hash input at the runtime boundary", () => {
    expect(() => hashStringToUint32(42 as unknown as string)).toThrow(TypeError);
  });
});
