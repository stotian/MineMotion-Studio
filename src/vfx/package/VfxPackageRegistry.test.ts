import { describe, expect, it } from "vitest";
import { createBlankVfxAuthoringDocument } from "../authoring/VfxAuthoringDocument";
import { createVfxPackageManifest, writeVfxPackageArchive } from "./VfxPackageArchiveWriter";
import {
  VFX_PACKAGE_REGISTRY_STORAGE_KEY,
  VfxPackageRegistryError,
  createEmptyVfxPackageRegistry,
  inspectInstalledVfxPackage,
  installVfxPackage,
  loadVfxPackageRegistry,
  saveVfxPackageRegistry,
  setVfxPackageEnabled,
  uninstallVfxPackage,
  updateVfxPackage
} from "./VfxPackageRegistry";
import type { VfxPackageDependency } from "./VfxPackageTypes";

const NOW = "2026-07-20T00:00:00.000Z";

async function packageBytes(
  id: string,
  version = "1.0.0",
  dependencies: readonly VfxPackageDependency[] = []
): Promise<ArrayBuffer> {
  const document = createBlankVfxAuthoringDocument(id, id);
  const manifest = createVfxPackageManifest(document, {
    id,
    packageVersion: version,
    author: "Registry Tests",
    license: "MIT",
    dependencies
  });
  return (await writeVfxPackageArchive({ manifest, document })).blob.arrayBuffer();
}

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }
  };
}

describe("local VFX package registry", () => {
  it("installs, inspects, disables, enables, and uninstalls validated packages", async () => {
    let registry = createEmptyVfxPackageRegistry();
    registry = await installVfxPackage(registry, await packageBytes("custom.one"), NOW);
    expect(registry.packages.map((entry) => [entry.id, entry.enabled])).toEqual([["custom.one", true]]);
    expect(inspectInstalledVfxPackage(registry, "custom.one").installReady).toBe(true);
    registry = setVfxPackageEnabled(registry, "custom.one", false);
    expect(registry.packages[0].enabled).toBe(false);
    registry = setVfxPackageEnabled(registry, "custom.one", true);
    expect(registry.packages[0].enabled).toBe(true);
    registry = uninstallVfxPackage(registry, "custom.one");
    expect(registry.packages).toEqual([]);
  });

  it("requires enabled dependencies and prevents breaking active dependents", async () => {
    const dependency = { id: "custom.base", versionRange: "^1.0.0", optional: false };
    const consumerBytes = await packageBytes("custom.consumer", "1.0.0", [dependency]);
    await expect(installVfxPackage(createEmptyVfxPackageRegistry(), consumerBytes, NOW)).rejects.toThrow("dependencies");

    let registry = await installVfxPackage(createEmptyVfxPackageRegistry(), await packageBytes("custom.base"), NOW);
    registry = await installVfxPackage(registry, consumerBytes, NOW);
    expect(() => setVfxPackageEnabled(registry, "custom.base", false)).toThrow("requires");
    expect(() => uninstallVfxPackage(registry, "custom.base")).toThrow("requires");
    registry = setVfxPackageEnabled(registry, "custom.consumer", false);
    registry = setVfxPackageEnabled(registry, "custom.base", false);
    expect(() => setVfxPackageEnabled(registry, "custom.consumer", true)).toThrow("dependencies");
    registry = uninstallVfxPackage(registry, "custom.base");
    expect(registry.packages.map((entry) => entry.id)).toEqual(["custom.consumer"]);
  });

  it("accepts increasing compatible updates and rejects downgrade or dependent breakage", async () => {
    let registry = await installVfxPackage(createEmptyVfxPackageRegistry(), await packageBytes("custom.base", "1.0.0"), NOW);
    registry = await installVfxPackage(registry, await packageBytes("custom.consumer", "1.0.0", [{ id: "custom.base", versionRange: "^1.0.0", optional: false }]), NOW);
    registry = await updateVfxPackage(registry, await packageBytes("custom.base", "1.1.0"), "2026-07-20T01:00:00.000Z");
    expect(registry.packages.find((entry) => entry.id === "custom.base")?.version).toBe("1.1.0");
    await expect(updateVfxPackage(registry, await packageBytes("custom.base", "1.0.5"), NOW)).rejects.toThrow("increase semantic version");
    await expect(updateVfxPackage(registry, await packageBytes("custom.base", "2.0.0"), NOW)).rejects.toThrow("requires custom.base");
  });

  it("round-trips the versioned local payload and fails soft on corruption", async () => {
    let registry = await installVfxPackage(createEmptyVfxPackageRegistry(), await packageBytes("custom.saved"), NOW);
    registry = setVfxPackageEnabled(registry, "custom.saved", false);
    const storage = memoryStorage();
    expect(saveVfxPackageRegistry(storage, registry)).toBe(true);
    const loaded = await loadVfxPackageRegistry(storage);
    expect(loaded.warnings).toEqual([]);
    expect(loaded.registry.packages.map((entry) => [entry.id, entry.version, entry.enabled])).toEqual([["custom.saved", "1.0.0", false]]);
    storage.values.set(VFX_PACKAGE_REGISTRY_STORAGE_KEY, "{broken");
    const recovered = await loadVfxPackageRegistry(storage);
    expect(recovered.registry.packages).toEqual([]);
    expect(recovered.warnings).toHaveLength(1);
  });

  it("rejects stored enabled registries whose required dependency was removed", async () => {
    let registry = await installVfxPackage(createEmptyVfxPackageRegistry(), await packageBytes("custom.base"), NOW);
    registry = await installVfxPackage(registry, await packageBytes("custom.consumer", "1.0.0", [{ id: "custom.base", versionRange: "^1.0.0", optional: false }]), NOW);
    const storage = memoryStorage();
    expect(saveVfxPackageRegistry(storage, registry)).toBe(true);
    const raw = JSON.parse(storage.values.get(VFX_PACKAGE_REGISTRY_STORAGE_KEY)!) as { packages: Array<{ id: string }> };
    raw.packages = raw.packages.filter((entry) => entry.id !== "custom.base");
    storage.values.set(VFX_PACKAGE_REGISTRY_STORAGE_KEY, JSON.stringify(raw));
    const loaded = await loadVfxPackageRegistry(storage);
    expect(loaded.registry.packages).toEqual([]);
    expect(loaded.warnings[0]).toContain("missing or incompatible dependencies");
  });

  it("protects built-in IDs, duplicate installs, timestamps, and local byte limits", async () => {
    const registry = createEmptyVfxPackageRegistry();
    await expect(installVfxPackage(registry, await packageBytes("combatImpact"), NOW)).rejects.toBeInstanceOf(VfxPackageRegistryError);
    const installed = await installVfxPackage(registry, await packageBytes("custom.duplicate"), NOW);
    await expect(installVfxPackage(installed, await packageBytes("custom.duplicate"), NOW)).rejects.toThrow("already installed");
    await expect(installVfxPackage(registry, await packageBytes("custom.time"), "not-a-date")).rejects.toThrow("timestamp");
    await expect(installVfxPackage(registry, new Uint8Array(1024 * 1024 + 1), NOW)).rejects.toThrow("1 MB");
  });
});
