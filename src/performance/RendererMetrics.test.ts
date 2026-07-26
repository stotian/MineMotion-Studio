import { describe, expect, it } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import {
  collectProjectComplexityMetrics,
  readBrowserHeapMetrics,
  sanitizeRendererFrameInfo
} from "./RendererMetrics";

describe("renderer metrics", () => {
  it("collects bounded project, chunk, and effect counts", () => {
    const project = createInitialProject();
    project.scene.cameras[0].visible = false;
    project.world = {
      sourceName: "Measured",
      levelDatFound: true,
      dimensions: [],
      importedAt: "2026-01-01T00:00:00.000Z",
      notes: [],
      importedChunks: [{
        id: "overworld:0,0",
        dimension: "overworld",
        regionX: 0,
        regionZ: 0,
        chunkX: 0,
        chunkZ: 0,
        minY: -64,
        maxY: 320,
        sectionsRead: 1,
        blocks: [],
        unknownBlocks: {},
        warnings: []
      }]
    };
    project.effects.instances = Array.from({ length: 3 }, (_, index) => ({
      id: `effect_${index}`
    })) as typeof project.effects.instances;

    expect(collectProjectComplexityMetrics(project, 42.9, 2)).toEqual({
      sceneEntities: 3,
      visibleEntities: 2,
      sceneObjects: 42,
      importedChunks: 1,
      effects: 3,
      activeEffects: 2
    });
  });

  it("reads optional Chromium heap data and rejects hostile counters", () => {
    expect(readBrowserHeapMetrics({
      usedJSHeapSize: 80,
      totalJSHeapSize: 100,
      jsHeapSizeLimit: 200
    })).toEqual({
      usedBytes: 80,
      totalBytes: 100,
      limitBytes: 200
    });
    expect(readBrowserHeapMetrics({
      usedJSHeapSize: Number.NaN,
      totalJSHeapSize: 100,
      jsHeapSizeLimit: 200
    })).toBeNull();
    expect(sanitizeRendererFrameInfo({
      calls: 4.9,
      triangles: -1,
      textures: Number.POSITIVE_INFINITY
    })).toEqual({
      calls: 4,
      triangles: 0,
      points: 0,
      lines: 0,
      geometries: 0,
      textures: 0,
      programs: 0
    });
  });
});
