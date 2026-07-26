import { describe, expect, it } from "vitest";
import {
  evaluateRendererCulling,
  RENDERER_CULLING_LIMITS,
  type CullingPlane,
  type RendererCullingEntry
} from "./RendererCulling";

const BOX_PLANES: readonly CullingPlane[] = [
  [1, 0, 0, 10],
  [-1, 0, 0, 10],
  [0, 1, 0, 10],
  [0, -1, 0, 10],
  [0, 0, 1, 10],
  [0, 0, -1, 10]
];

function entry(
  id: string,
  center: readonly [number, number, number],
  layer: RendererCullingEntry["layer"] = "props"
): RendererCullingEntry {
  return { id, layer, center, radius: 1 };
}

describe("renderer culling", () => {
  it("classifies layer, distance, frustum, and selected decisions in order", () => {
    const evaluation = evaluateRendererCulling([
      entry("visible", [0, 0, 0]),
      entry("layer", [0, 0, 0], "vfx"),
      entry("distance", [30, 0, 0]),
      entry("frustum", [12, 0, 0]),
      entry("selected", [40, 0, 0])
    ], {
      cameraPosition: [0, 0, 0],
      maximumDistance: 20,
      frustumPlanes: BOX_PLANES,
      enabledLayers: new Set(["props"]),
      selectedId: "selected",
      allowSelectedOverride: true
    });

    expect(evaluation.decisions).toEqual([
      { id: "visible", visible: true, reason: "visible" },
      { id: "layer", visible: false, reason: "layer" },
      { id: "distance", visible: false, reason: "distance" },
      { id: "frustum", visible: false, reason: "frustum" },
      { id: "selected", visible: true, reason: "selected" }
    ]);
    expect(evaluation.summary).toMatchObject({
      tested: 5,
      visible: 2,
      layerCulled: 1,
      distanceCulled: 1,
      frustumCulled: 1,
      selectedOverrides: 1
    });
  });

  it("counts chunk visibility and fails open for hostile bounds", () => {
    const evaluation = evaluateRendererCulling([
      {
        ...entry("chunk-visible", [0, 0, 0], "world"),
        selectionId: "world",
        chunk: [0, 0]
      },
      { ...entry("chunk-hidden", [50, 0, 0], "world"), chunk: [3, 0] },
      { ...entry("invalid", [0, 0, 0]), radius: Number.NaN }
    ], {
      cameraPosition: [0, 0, 0],
      maximumDistance: 20,
      frustumPlanes: BOX_PLANES,
      enabledLayers: new Set(["world", "props"]),
      selectedId: null,
      allowSelectedOverride: false
    });

    expect(evaluation.summary).toMatchObject({
      visible: 2,
      distanceCulled: 1,
      invalid: 1,
      chunksTested: 2,
      chunksVisible: 1
    });
    expect(evaluation.decisions[2]).toEqual({
      id: "invalid",
      visible: true,
      reason: "invalid"
    });
  });

  it("bounds measurement work and leaves overflow unmeasured", () => {
    const entries = Array.from(
      { length: RENDERER_CULLING_LIMITS.maximumEntries + 2 },
      (_, index) => entry(`entry_${index}`, [0, 0, 0])
    );
    const evaluation = evaluateRendererCulling(entries, {
      cameraPosition: [0, 0, 0],
      maximumDistance: 20,
      frustumPlanes: BOX_PLANES,
      enabledLayers: new Set(["props"]),
      selectedId: null,
      allowSelectedOverride: false
    });

    expect(evaluation.decisions).toHaveLength(
      RENDERER_CULLING_LIMITS.maximumEntries
    );
    expect(evaluation.summary).toMatchObject({
      tested: RENDERER_CULLING_LIMITS.maximumEntries,
      unmeasured: 2
    });
  });
});
