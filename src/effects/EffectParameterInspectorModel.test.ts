import { describe, expect, it } from "vitest";
import { HistoryStack } from "../history/HistoryStack";
import { createInitialProject } from "../project/ProjectStore";
import { ProjectSerializer } from "../project/ProjectSerializer";
import { createMineMotionPackageData } from "../project/package/MineMotionPackage";
import { PackageReader } from "../project/package/PackageReader";
import { applyEffectTimelineCommand } from "./EffectTimelineController";
import { createEffectInstance, BUILTIN_EFFECTS } from "./EffectRegistry";
import { createEffectParameterInspectorModel } from "./EffectParameterInspectorModel";
import { syncEffectTimelineLane } from "./EffectTimelineTrack";

function requireModel(
  result: ReturnType<typeof createEffectParameterInspectorModel>
) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.errors.map((error) => error.code).join(", "));
  return result.value;
}

describe("EffectParameterInspectorModel", () => {
  it("projects every built-in default parameter exactly once in schema order", () => {
    const kinds = new Set<string>();

    for (const definition of BUILTIN_EFFECTS) {
      const effect = createEffectInstance(definition.type, {
        id: `effect_${definition.type}`,
        startFrame: 0
      });
      const model = requireModel(createEffectParameterInspectorModel(effect));

      expect(model.controls.map((control) => control.id)).toEqual(
        Object.keys(definition.defaultParameters)
      );
      expect(model.controls.map((control) => control.value)).toEqual(
        Object.values(definition.defaultParameters)
      );
      for (const control of model.controls) kinds.add(control.kind);
    }

    expect([...kinds].sort()).toEqual([
      "boolean",
      "color",
      "enum",
      "integer",
      "number"
    ]);
  });

  it("labels stored-only parameters honestly and keeps unknown legacy values read-only", () => {
    const effect = {
      ...createEffectInstance("colorGradeKeyframe", {
        id: "effect_grade",
        startFrame: 0
        }),
      parameters: {
        contrast: 1.2,
        saturation: 1.1,
        intensity: 1,
        legacyExtra: 42
      }
    };
    const model = requireModel(createEffectParameterInspectorModel(effect));

    expect(model.controls.every((control) => control.runtimeSupport === "stored-only")).toBe(true);
    expect(model.unknownParameters).toEqual([{ id: "legacyExtra", value: 42 }]);
  });

  it("marks every native combat/electric recipe parameter as live preview", () => {
    for (const type of [
      "combatSparks",
      "combatImpact",
      "swordSlash",
      "parryBurst",
      "groundSlam",
      "landingDust",
      "criticalHit",
      "hitStop",
      "electricStrike",
      "electricStorm",
      "electricBeam",
      "electricAura",
      "electricCharge",
      "electricSparks",
      "chainLightning",
      "electricWeaponTrail",
      "nativeFire",
      "smokePlume",
      "nativeExplosion",
      "emberBurst",
      "debrisBurst",
      "dustCloud",
      "netherFire",
      "soulFire",
      "magicAura",
      "magicBeam",
      "magicProjectile",
      "magicPortal",
      "magicTeleport",
      "magicHeal",
      "magicCorruption",
      "magicPowerUp"
    ] as const) {
      const model = requireModel(
        createEffectParameterInspectorModel(
          createEffectInstance(type, { id: `effect_${type}`, startFrame: 0 })
        )
      );
      expect(model.controls.every((control) => control.runtimeSupport === "live-preview")).toBe(true);
    }
  });

  it("repairs one invalid legacy parameter at a time without losing unknown values", () => {
    const legacy = {
      ...createEffectInstance("glowBurst", {
        id: "effect_legacy",
        startFrame: 12
      }),
      parameters: {
        color: "#ffe27a",
        alpha: 2,
        count: 1e9,
        size: 0.16,
        radius: 2,
        intensity: 1,
        legacyExtra: "keep"
      }
    };
    const project = syncEffectTimelineLane({
      ...createInitialProject(),
      effects: { instances: [legacy] }
    });
    const before = structuredClone(project);
    const alphaRepair = applyEffectTimelineCommand(project, {
      type: "update",
      effectId: legacy.id,
      patch: { parameters: { alpha: 0.4 } }
    });

    expect(alphaRepair.ok).toBe(true);
    if (!alphaRepair.ok) return;
    expect(alphaRepair.value.project.effects.instances[0].parameters).toMatchObject({
      alpha: 0.4,
      count: 1e9,
      legacyExtra: "keep"
    });
    expect(project).toEqual(before);

    const countRepair = applyEffectTimelineCommand(alphaRepair.value.project, {
      type: "update",
      effectId: legacy.id,
      patch: { parameters: { count: 0 } }
    });
    expect(countRepair.ok).toBe(true);
    if (!countRepair.ok) return;

    const reloaded = ProjectSerializer.parse(
      ProjectSerializer.serialize(countRepair.value.project)
    );
    expect(reloaded.effects.instances[0].parameters).toMatchObject({
      alpha: 0.4,
      count: 0,
      legacyExtra: "keep"
    });
  });

  it("preserves special own legacy keys through edits and both save paths", () => {
    const source = createEffectInstance("flash", {
      id: "effect_special_key",
      startFrame: 5
    });
    const effect = {
      ...source,
      parameters: Object.fromEntries([
        ...Object.entries(source.parameters),
        ["__proto__", "preserved"]
      ])
    };
    const project = syncEffectTimelineLane({
      ...createInitialProject(),
      effects: { instances: [effect] }
    });
    const model = requireModel(createEffectParameterInspectorModel(effect));
    expect(model.unknownParameters).toContainEqual({
      id: "__proto__",
      value: "preserved"
    });

    const result = applyEffectTimelineCommand(project, {
      type: "update",
      effectId: effect.id,
      patch: { parameters: { alpha: 0.25 } }
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const serialized = ProjectSerializer.parse(
      ProjectSerializer.serialize(result.value.project)
    );
    const packaged = PackageReader.parse(
      JSON.stringify(createMineMotionPackageData(result.value.project))
    );
    for (const reloaded of [serialized, packaged]) {
      const parameters = reloaded.effects.instances[0].parameters as Record<
        string,
        unknown
      >;
      expect(Object.hasOwn(parameters, "__proto__")).toBe(true);
      expect(parameters.__proto__).toBe("preserved");
      expect(parameters.alpha).toBe(0.25);
    }
  });

  it("rejects newly-created unknown parameter keys and records one history checkpoint per edit", () => {
    const effect = createEffectInstance("flash", {
      id: "effect_flash",
      startFrame: 10
    });
    const project = syncEffectTimelineLane({
      ...createInitialProject(),
      effects: { instances: [effect] }
    });
    const history = new HistoryStack<typeof project>();
    const update = applyEffectTimelineCommand(project, {
      type: "update",
      effectId: effect.id,
      patch: { parameters: { alpha: 0.25 } }
    });

    expect(update.ok).toBe(true);
    if (!update.ok) return;
    if (update.value.changed) history.push(project, update.value.historyLabel);
    expect(history.canUndo()).toBe(true);
    expect(
      applyEffectTimelineCommand(project, {
        type: "update",
        effectId: effect.id,
        patch: { parameters: { injected: 1 } } as never
      }).ok
    ).toBe(false);
  });

  it.each([
    ["cameraShake", "strength", 1.25],
    ["glowBurst", "count", 0],
    ["lightningStrike", "flash", false],
    ["flash", "color", "rebeccapurple"],
    ["speedLines", "direction", "radial"]
  ] as const)(
    "round-trips and restores a %s %s control through history and both save paths",
    (type, parameterId, value) => {
      const effect = createEffectInstance(type, {
        id: `effect_${type}`,
        startFrame: 10
      });
      const project = syncEffectTimelineLane({
        ...createInitialProject(),
        effects: { instances: [effect] }
      });
      const result = applyEffectTimelineCommand(project, {
        type: "update",
        effectId: effect.id,
        patch: {
          parameters: { [parameterId]: value }
        }
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.changed).toBe(true);
      expect(result.value.project.effects.instances[0].parameters[parameterId]).toBe(
        value
      );

      const history = new HistoryStack<typeof project>();
      history.push(project, result.value.historyLabel);
      const undone = history.undo(result.value.project);
      expect(undone?.effects.instances[0].parameters[parameterId]).toBe(
        effect.parameters[parameterId]
      );
      expect(history.undo(undone as typeof project)).toBeNull();
      const redone = history.redo(undone as typeof project);
      expect(redone?.effects.instances[0].parameters[parameterId]).toBe(value);
      expect(history.redo(redone as typeof project)).toBeNull();

      const serialized = ProjectSerializer.parse(
        ProjectSerializer.serialize(result.value.project)
      );
      const packaged = PackageReader.parse(
        JSON.stringify(createMineMotionPackageData(result.value.project))
      );
      expect(serialized.effects.instances[0].parameters[parameterId]).toBe(value);
      expect(packaged.effects.instances[0].parameters[parameterId]).toBe(value);
    }
  );
});
