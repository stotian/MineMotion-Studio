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
