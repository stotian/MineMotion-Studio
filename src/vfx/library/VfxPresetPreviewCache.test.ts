import { describe, expect, it } from "vitest";
import { builtinVfxPresetCatalog } from "./BuiltinVfxPresetCatalog";
import {
  MAX_VFX_PRESET_PREVIEW_DATA_URL_LENGTH,
  generateVfxPresetPreviewDataUrl,
  readCachedVfxPresetPreview,
  scheduleBuiltinVfxPresetPreviews,
  writeCachedVfxPresetPreview,
  type VfxPreviewScheduler
} from "./VfxPresetPreviewCache";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }
  };
}

describe("VfxPresetPreviewCache", () => {
  const stable = builtinVfxPresetCatalog.list().filter(
    (preset) => preset.metadata.compatibility.maturity === "stable"
  );

  it("generates deterministic bounded SVG previews for every stable preset", () => {
    expect(stable).toHaveLength(60);
    for (const preset of stable) {
      const first = generateVfxPresetPreviewDataUrl(preset);
      const second = generateVfxPresetPreviewDataUrl(structuredClone(preset));
      expect(first).toBe(second);
      expect(first.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
      expect(first.length).toBeLessThanOrEqual(MAX_VFX_PRESET_PREVIEW_DATA_URL_LENGTH);
    }
  });

  it("round-trips valid cache records and ignores corrupt or wrong-key data", () => {
    const storage = memoryStorage();
    const preset = stable[0];
    const dataUrl = generateVfxPresetPreviewDataUrl(preset);
    expect(writeCachedVfxPresetPreview(storage, preset, dataUrl)).toBe(true);
    expect(readCachedVfxPresetPreview(storage, preset)?.dataUrl).toBe(dataUrl);
    const key = [...storage.values.keys()][0];
    storage.values.set(key, JSON.stringify({ version: 1, cacheKey: "wrong", dataUrl }));
    expect(readCachedVfxPresetPreview(storage, preset)).toBeNull();
  });

  it("schedules one preview per idle task and reuses the populated cache", () => {
    const storage = memoryStorage();
    const tasks: Array<() => void> = [];
    const scheduler: VfxPreviewScheduler = (callback) => {
      tasks.push(callback);
      return () => undefined;
    };
    const ready: string[] = [];
    scheduleBuiltinVfxPresetPreviews(stable, storage, (id) => ready.push(id), scheduler);
    expect(ready).toEqual([]);
    while (tasks.length > 0) tasks.shift()?.();
    expect(ready).toHaveLength(60);
    expect(storage.values.size).toBe(60);

    const cachedTasks: Array<() => void> = [];
    const cachedReady: string[] = [];
    scheduleBuiltinVfxPresetPreviews(
      stable,
      storage,
      (id) => cachedReady.push(id),
      (callback) => {
        cachedTasks.push(callback);
        return () => undefined;
      }
    );
    while (cachedTasks.length > 0) cachedTasks.shift()?.();
    expect(cachedReady).toEqual(ready);
    expect(storage.values.size).toBe(60);
  });
});
