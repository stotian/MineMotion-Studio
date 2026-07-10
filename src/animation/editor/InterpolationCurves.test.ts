import { describe, expect, it } from "vitest";
import { applyInterpolationCurve, createCurveSamples } from "./InterpolationCurves";

describe("InterpolationCurves", () => {
  it("holds the left value for constant interpolation", () => {
    expect(applyInterpolationCurve("constant", 0.75)).toBe(0);
  });

  it("uses distinct ease-in and ease-out curves", () => {
    expect(applyInterpolationCurve("ease-in", 0.5)).toBe(0.25);
    expect(applyInterpolationCurve("ease-out", 0.5)).toBe(0.75);
  });

  it("uses smoothstep as the bezier placeholder", () => {
    const samples = createCurveSamples("bezier", 4);

    expect(samples[0]).toEqual({ t: 0, value: 0 });
    expect(samples.at(-1)).toEqual({ t: 1, value: 1 });
    expect(samples[2].value).toBe(0.5);
  });
});
