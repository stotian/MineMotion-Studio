import { describe, expect, it, vi } from "vitest";
import type { MinecraftWorldScan } from "./MinecraftChunkTypes";
import {
  DEFAULT_WORLD_IMPORT_OPTIONS,
  WorldImportManager
} from "./WorldImportManager";

function createEmptyScan(): MinecraftWorldScan {
  return {
    sourceName: "EmptyWorld",
    levelDat: null,
    level: {
      found: false,
      levelName: "",
      dataVersion: null,
      spawn: null,
      warnings: []
    },
    dimensions: [
      {
        id: "overworld",
        label: "Overworld",
        regionFiles: [],
        estimatedChunks: 0
      }
    ],
    warnings: []
  };
}

describe("WorldImportManager operation contract", () => {
  it("tags progress and the final result with the public operation ID", async () => {
    const onProgress = vi.fn();
    const result = await WorldImportManager.importChunks({
      scan: createEmptyScan(),
      importOptions: DEFAULT_WORLD_IMPORT_OPTIONS,
      operationId: 41,
      signal: new AbortController().signal,
      onProgress
    });

    expect(result.operationId).toBe(41);
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(
      onProgress.mock.calls.map(([progress]) => progress.operationId)
    ).toEqual([41, 41]);
    expect(onProgress.mock.lastCall?.[0]).toMatchObject({
      operationId: 41,
      status: "complete"
    });
  });

  it("rejects an aborted operation without reporting stale progress", async () => {
    const controller = new AbortController();
    controller.abort();
    const onProgress = vi.fn();

    await expect(
      WorldImportManager.importChunks({
        scan: createEmptyScan(),
        importOptions: DEFAULT_WORLD_IMPORT_OPTIONS,
        operationId: 42,
        signal: controller.signal,
        onProgress
      })
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(onProgress).not.toHaveBeenCalled();
  });
});

it("isolates a corrupt chunk and still imports a valid neighbor", async () => {
  const buffer = new ArrayBuffer(4096 * 4);
  const view = new DataView(buffer);
  // Local chunk 0,0 -> sector 2 (corrupt payload).
  view.setUint8(2, 2);
  view.setUint8(3, 1);
  // Local chunk 1,0 -> sector 3 (valid uncompressed minimal compound).
  view.setUint8(6, 3);
  view.setUint8(7, 1);
  view.setUint32(4096 * 2, 9000, false);
  view.setUint32(4096 * 3, 5, false);
  view.setUint8(4096 * 3 + 4, 3);
  new Uint8Array(buffer, 4096 * 3 + 5, 4).set([10, 0, 0, 0]);

  const scan = createEmptyScan();
  scan.dimensions[0].regionFiles.push({
    path: "region/r.0.0.mca",
    file: new File([buffer], "r.0.0.mca"),
    dimension: "overworld",
    regionX: 0,
    regionZ: 0,
    chunkLocations: 2,
    estimatedChunks: 2
  });
  scan.dimensions[0].estimatedChunks = 2;

  const result = await WorldImportManager.importChunks({
    scan,
    importOptions: {
      ...DEFAULT_WORLD_IMPORT_OPTIONS,
      centerChunkX: 0,
      centerChunkZ: 0,
      radiusChunks: 1,
      maxChunks: 2,
      maxRegionFiles: 1
    },
    operationId: 43,
    signal: new AbortController().signal,
    onProgress: vi.fn()
  });

  expect(result.chunks.map((chunk) => chunk.id)).toEqual(["overworld:1,0"]);
  expect(result.world.notes).toContain(
    "Chunk 0,0: Chunk 0,0 has an invalid payload length."
  );
});
