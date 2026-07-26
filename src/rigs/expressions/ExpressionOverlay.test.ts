import { describe, expect, it } from "vitest";
import { HistoryStack } from "../../history/HistoryStack";
import {
  loadProjectAutosave,
  saveProjectAutosave
} from "../../project/ProjectAutosave";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { createDefaultSteveRig } from "../DefaultSteveRig";
import { sanitizeCharacterRig } from "../RigSerializer";
import {
  CHARACTER_EXPRESSION_PRESETS,
  resolveExpressionOverlay,
  sanitizeCharacterExpression
} from "./ExpressionOverlay";
import { setProjectCharacterExpression } from "./ExpressionOverlayController";

describe("expression overlays", () => {
  it("resolves every preset to bounded immutable pixel descriptors", () => {
    for (const preset of CHARACTER_EXPRESSION_PRESETS) {
      const descriptors = resolveExpressionOverlay({
        enabled: true,
        preset,
        intensity: 0.75
      });
      expect(descriptors.length).toBeGreaterThan(0);
      expect(descriptors.length).toBeLessThanOrEqual(5);
      expect(Object.isFrozen(descriptors)).toBe(true);
      expect(descriptors.every((descriptor) =>
        Number.isFinite(descriptor.position[0]) &&
        Number.isFinite(descriptor.position[1]) &&
        descriptor.size.every((value) => value > 0)
      )).toBe(true);
    }
    expect(resolveExpressionOverlay({
      enabled: true,
      preset: "blink",
      intensity: 0
    })).toEqual([]);
  });

  it("sanitizes hostile settings and leaves disabled characters unchanged", () => {
    expect(sanitizeCharacterExpression({
      enabled: true,
      preset: "script",
      intensity: Number.POSITIVE_INFINITY
    })).toBeUndefined();
    expect(sanitizeCharacterExpression({
      enabled: true,
      preset: "blink",
      intensity: 4
    })).toEqual({ enabled: true, preset: "blink", intensity: 1 });
    expect(sanitizeCharacterExpression({
      enabled: false,
      preset: "anger",
      intensity: 1
    })).toBeUndefined();

    const project = createInitialProject();
    const character = project.scene.characters[0];
    const skin = {
      id: "skin_standard",
      name: "Standard Skin",
      dataUrl: "data:image/png;base64,AA==",
      importedAt: "2026-01-01T00:00:00.000Z",
      metadata: {
        width: 64,
        height: 64,
        valid: true,
        legacy: false,
        modelType: "steve" as const,
        warnings: []
      }
    };
    const sanitized = sanitizeCharacterRig({
      ...character,
      skin,
      expression: {
        enabled: true,
        preset: "anger",
        intensity: Number.NaN
      }
    });
    expect(sanitized.skin).toEqual(skin);
    expect(sanitized.expression).toBeUndefined();

    const baseline = createDefaultSteveRig(character);
    expect(baseline.getObjectByName("Expression Overlay")).toBeUndefined();

    const expressed = createDefaultSteveRig({
      ...character,
      expression: {
        enabled: true,
        preset: "anger",
        intensity: 1
      }
    });
    const overlay = expressed.getObjectByName("Expression Overlay");
    expect(overlay?.children).toHaveLength(3);
    expect(overlay?.children.every((child) =>
      child.userData.expressionOverlay === true)).toBe(true);
  });

  it("updates one unlocked character atomically and rejects no-ops", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const expression = {
      enabled: true,
      preset: "surprise",
      intensity: 0.65
    } as const;
    const result = setProjectCharacterExpression(
      project,
      character.id,
      expression
    );
    expect(result).toMatchObject({
      changed: true,
      historyLabel: "Update character expression",
      error: null
    });
    expect(result.project.scene.characters[0].expression).toEqual(expression);
    expect(project.scene.characters[0].expression).toBeUndefined();
    expect(setProjectCharacterExpression(
      result.project,
      character.id,
      expression
    ).error).toBe("EXPRESSION_UNCHANGED");

    const locked = {
      ...project,
      scene: {
        ...project.scene,
        characters: project.scene.characters.map((entry) =>
          entry.id === character.id ? { ...entry, locked: true } : entry
        )
      }
    };
    expect(setProjectCharacterExpression(
      locked,
      character.id,
      expression
    ).error).toBe("EXPRESSION_TARGET_LOCKED");
    expect(setProjectCharacterExpression(
      project,
      "missing",
      expression
    ).error).toBe("EXPRESSION_TARGET_MISSING");
  });

  it("survives all project paths without changing normal-skin defaults", () => {
    const initial = createInitialProject();
    const character = initial.scene.characters[0];
    const changed = setProjectCharacterExpression(
      initial,
      character.id,
      { enabled: true, preset: "fear", intensity: 0.8 }
    ).project;
    const json = ProjectSerializer.parse(ProjectSerializer.serialize(changed));
    const schema9 = ProjectSerializer.parse(
      ProjectSerializer.serializeLegacyV9(changed)
    );
    const packaged = PackageReader.parse(JSON.stringify(
      createMineMotionPackageData(changed)
    ));
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      }
    };
    saveProjectAutosave(storage, changed);
    const autosaved = loadProjectAutosave(storage)!.project;
    for (const candidate of [json, schema9, packaged, autosaved]) {
      expect(candidate.scene.characters[0].expression).toEqual({
        enabled: true,
        preset: "fear",
        intensity: 0.8
      });
      expect(
        createDefaultSteveRig(candidate.scene.characters[0])
          .getObjectByName("Expression Overlay")
      ).toBeDefined();
    }

    const history = new HistoryStack<typeof initial>();
    history.push(initial, "Before expression");
    expect(history.undo(changed)?.scene.characters[0].expression)
      .toBeUndefined();
    expect(sanitizeCharacterRig(initial.scene.characters[0]).expression)
      .toBeUndefined();
  });
});
