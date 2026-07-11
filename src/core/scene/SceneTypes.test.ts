import {
  DEFAULT_TRANSFORM,
  cloneTransform,
  createTransform
} from "./SceneTypes";
import { createTransform as createLegacyTransform } from "../../project/ProjectFile";

describe("scene contracts", () => {
  it("creates independent transforms", () => {
    const transform = createTransform({ position: [1, 2, 3] });
    const clone = cloneTransform(transform);
    clone.position[0] = 99;

    expect(transform.position).toEqual([1, 2, 3]);
    expect(DEFAULT_TRANSFORM.scale).toEqual([1, 1, 1]);
  });

  it("keeps the ProjectFile compatibility export", () => {
    expect(createLegacyTransform({ rotation: [1, 2, 3] }).rotation).toEqual([1, 2, 3]);
  });
});
