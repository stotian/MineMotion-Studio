import { describe, expect, it } from "vitest";
import { generateCrowdPrototype } from "./CrowdGenerator";
describe("procedural crowd prototype", () => {
  it("is deterministic and bounded", () => {
    const options = { count: 20, radius: 10, seed: 42, center: [0, 1, 0] as [number, number, number], spacing: 1 };
    expect(generateCrowdPrototype(options).placements).toEqual(generateCrowdPrototype(options).placements);
    expect(generateCrowdPrototype({ ...options, count: 500 }).placements.length).toBeLessThanOrEqual(80);
  });
});
