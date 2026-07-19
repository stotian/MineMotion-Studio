import { describe, expect, it } from "vitest";
import { applyEffectTimelineCommand } from "../../effects/EffectTimelineController";
import { createInitialProject } from "../../project/ProjectStore";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { loadProjectAutosave, saveProjectAutosave } from "../../project/ProjectAutosave";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { HistoryStack } from "../../history/HistoryStack";
import { deriveVfxAuthoringDocumentFromBuiltin } from "../authoring/VfxAuthoringDocument";
import { builtinVfxPresetCatalog } from "../library/BuiltinVfxPresetCatalog";
import { prepareProjectVfxFrame } from "../runtime/VfxProjectFrame";
import { createVfxPackageManifest, writeVfxPackageArchive } from "./VfxPackageArchiveWriter";
import {
  createEmptyVfxPackageRegistry,
  installVfxPackage,
  setVfxPackageEnabled,
  uninstallVfxPackage
} from "./VfxPackageRegistry";
import {
  createInstalledVfxEffect,
  getInstalledVfxSourceStatus,
  listEnabledInstalledVfxPresets
} from "./VfxPackageProjectIntegration";

async function installFixture() {
  const source = builtinVfxPresetCatalog.get("combatSparks");
  if (!source) throw new Error("Missing combatSparks fixture.");
  const document = deriveVfxAuthoringDocumentFromBuiltin(source);
  const manifest = createVfxPackageManifest(document, {
    id: "custom.integration-sparks",
    packageVersion: "1.2.3",
    author: "Integration Tests",
    license: "MIT"
  });
  const bytes = await (await writeVfxPackageArchive({ manifest, document })).blob.arrayBuffer();
  return installVfxPackage(createEmptyVfxPackageRegistry(), bytes, "2026-07-20T00:00:00.000Z");
}

describe("installed VFX package project integration", () => {
  it("adds enabled packages through the existing effect collection and preserves them everywhere", async () => {
    const registry = await installFixture();
    const presets = listEnabledInstalledVfxPresets(registry);
    expect(presets).toHaveLength(1);
    expect(presets[0].previewDataUrl).toMatch(/^data:image\/svg\+xml/);

    const effect = createInstalledVfxEffect(registry.packages[0], {
      id: "effect_custom_integration",
      startFrame: 3
    });
    expect(effect.type).toBe("customVfx");
    expect(effect.nativeVfx?.customRecipe?.source).toEqual({
      packageId: "custom.integration-sparks",
      packageVersion: "1.2.3",
      documentId: registry.packages[0].archive.document.id
    });
    const { nativeVfx: _nativeVfx, ...missingNative } = effect;
    const rejected = applyEffectTimelineCommand(createInitialProject(), {
      type: "insert",
      effect: missingNative
    });
    expect(rejected.ok).toBe(false);

    let project = createInitialProject();
    const inserted = applyEffectTimelineCommand(project, { type: "insert", effect });
    expect(inserted.ok).toBe(true);
    if (!inserted.ok) return;
    project = inserted.value.project;

    const moved = applyEffectTimelineCommand(project, {
      type: "move",
      effectId: effect.id,
      startFrame: 5
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    project = moved.value.project;
    const duplicated = applyEffectTimelineCommand(project, {
      type: "duplicate",
      effectId: effect.id,
      newEffectId: "effect_custom_copy",
      startFrame: 40
    });
    expect(duplicated.ok).toBe(true);
    if (!duplicated.ok) return;
    project = duplicated.value.project;
    expect(project.effects.instances[1].nativeVfx?.customRecipe).toEqual(
      project.effects.instances[0].nativeVfx?.customRecipe
    );

    const reloaded = ProjectSerializer.parse(ProjectSerializer.serialize(project));
    expect(reloaded.effects.instances).toHaveLength(2);
    expect(reloaded.effects.instances[0].nativeVfx?.customRecipe).toEqual(
      project.effects.instances[0].nativeVfx?.customRecipe
    );
    const hostile = JSON.parse(ProjectSerializer.serialize(project));
    hostile.effects.instances[0].nativeVfx.customRecipe.callback = "not allowed";
    expect(() => ProjectSerializer.parse(JSON.stringify(hostile))).toThrow(
      "Unknown custom VFX recipe field"
    );
    expect(() => ProjectSerializer.serializeLegacyV9(reloaded)).toThrow(
      "cannot store portable custom VFX recipes"
    );
    const packaged = PackageReader.parse(JSON.stringify(createMineMotionPackageData(project)));
    expect(packaged.effects.instances[0].nativeVfx?.customRecipe).toEqual(
      project.effects.instances[0].nativeVfx?.customRecipe
    );
    const storage = new Map<string, string>();
    const autosaveStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); }
    };
    saveProjectAutosave(autosaveStorage, project);
    expect(loadProjectAutosave(autosaveStorage)?.project.effects.instances[0].nativeVfx?.customRecipe).toEqual(
      project.effects.instances[0].nativeVfx?.customRecipe
    );
    const history = new HistoryStack<typeof project>();
    history.push(project, "Custom VFX checkpoint");
    const withoutEffects = { ...project, effects: { instances: [] } };
    expect(history.undo(withoutEffects)?.effects.instances[0].nativeVfx?.customRecipe).toEqual(
      project.effects.instances[0].nativeVfx?.customRecipe
    );

    for (const quality of ["preview", "export"] as const) {
      const prepared = prepareProjectVfxFrame(reloaded, {
        frame: 6,
        includeVfx: true,
        quality
      });
      expect(prepared.ok).toBe(true);
      if (prepared.ok) {
        expect(prepared.value.effects[0].type).toBe("customVfx");
        expect(prepared.value.effects[0].primitives.length).toBeGreaterThan(0);
        expect(prepared.value.effects[0].primitives[0].kind).toBe("particle-emitter");
      }
    }
  });

  it("reports disabled, changed, and missing local sources without invalidating embedded projects", async () => {
    const registry = await installFixture();
    const effect = createInstalledVfxEffect(registry.packages[0], {
      id: "effect_source_status",
      startFrame: 0
    });
    expect(getInstalledVfxSourceStatus(effect, registry)).toBe("available");
    const disabled = setVfxPackageEnabled(registry, registry.packages[0].id, false);
    expect(getInstalledVfxSourceStatus(effect, disabled)).toBe("disabled");
    const missing = uninstallVfxPackage(disabled, registry.packages[0].id);
    expect(getInstalledVfxSourceStatus(effect, missing)).toBe("missing");

    const project = createInitialProject();
    project.effects.instances = [effect];
    const reloaded = ProjectSerializer.parse(ProjectSerializer.serialize(project));
    expect(reloaded.effects.instances[0].nativeVfx?.customRecipe).toBeDefined();
  });
});
