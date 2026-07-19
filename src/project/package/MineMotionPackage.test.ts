import { describe, expect, it } from "vitest";
import { createInitialProject } from "../ProjectStore";
import { ProjectSerializer } from "../ProjectSerializer";
import { createEffectInstance } from "../../effects/EffectRegistry";
import { createMineMotionPackageData } from "./MineMotionPackage";
import { PackageReader } from "./PackageReader";
import { validatePackageData } from "./PackageValidator";

describe("MineMotion package", () => {
  it("creates a valid .minemotion package payload", () => {
    const project = createInitialProject();
    const data = createMineMotionPackageData(project);
    const validation = validatePackageData(data);

    expect(data.packageFormat).toBe("minemotion-package-json");
    expect(data.project.schemaVersion).toBe(10);
    expect(data.manifest.formatName).toBe("MineMotion Studio Package");
    expect(validation.valid).toBe(true);
  });

  it("round-trips schema 10 native VFX through the package reader", () => {
    const data = createMineMotionPackageData({
      ...createInitialProject(),
      effects: {
        instances: [
          {
            ...createEffectInstance("shockwave", {
              id: "effect_package_native",
              startFrame: 14
            }),
            durationFrames: 22
          }
        ]
      }
    });
    const loaded = PackageReader.parse(JSON.stringify(data));

    expect(data.manifest.compatibility.projectSchemaVersion).toBe(10);
    expect(loaded.effects.instances[0].nativeVfx).toMatchObject({
      id: "effect_package_native",
      definitionId: "shockwave",
      startFrame: 14,
      durationFrames: 22,
      parameterKeyframes: []
    });
  });

  it("rejects package/project schema mismatches and future package versions", () => {
    const data = createMineMotionPackageData(createInitialProject());
    const mismatch = structuredClone(data);
    mismatch.manifest.compatibility.projectSchemaVersion = 9;
    expect(validatePackageData(mismatch).errors).toContain(
      "Package manifest project schema does not match project data."
    );

    const future = structuredClone(data) as unknown as {
      manifest: { schemaVersion: number };
    };
    future.manifest.schemaVersion = 2;
    expect(validatePackageData(future as never).valid).toBe(false);
  });

  it("loads a schema 9 project from an existing package v1 payload", () => {
    const current = {
      ...createInitialProject(),
      effects: {
        instances: [
          createEffectInstance("flash", {
            id: "effect_legacy_package",
            startFrame: 9
          })
        ]
      }
    };
    const data = createMineMotionPackageData(current);
    const legacyProject = JSON.parse(ProjectSerializer.serializeLegacyV9(current));
    const legacyPackage = {
      ...data,
      project: legacyProject,
      manifest: {
        ...data.manifest,
        compatibility: {
          ...data.manifest.compatibility,
          projectSchemaVersion: 9
        }
      }
    };

    const loaded = PackageReader.parse(JSON.stringify(legacyPackage));
    expect(loaded.schemaVersion).toBe(10);
    expect(loaded.effects.instances[0].nativeVfx).toMatchObject({
      id: "effect_legacy_package",
      definitionId: "flash"
    });
  });
});
