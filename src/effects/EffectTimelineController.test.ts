import { afterEach, describe, expect, it, vi } from "vitest";
import { HistoryStack } from "../history/HistoryStack";
import type { MineMotionProject } from "../project/ProjectFile";
import { createInitialProject } from "../project/ProjectStore";
import { ProjectSerializer } from "../project/ProjectSerializer";
import { createMineMotionPackageData } from "../project/package/MineMotionPackage";
import { PackageReader } from "../project/package/PackageReader";
import {
  adaptLegacyEffectInstance,
  createLegacyVfxRegistry
} from "../vfx/compat/LegacyEffectAdapter";
import { evaluateVfxFrame } from "../vfx/runtime/VfxFrameEvaluator";
import {
  applyEffectTimelineCommand,
  copyEffectTimelineBlock,
  type EffectTimelineCommand,
  type EffectTimelineMutation
} from "./EffectTimelineController";
import { createEffectInstance } from "./EffectRegistry";
import { MAX_EFFECT_INSTANCES } from "./EffectTypes";
import { syncEffectTimelineLane } from "./EffectTimelineTrack";

function createProject(): MineMotionProject {
  const initial = createInitialProject();
  const first = {
    ...createEffectInstance("shockwave", {
      id: "effect_first",
      startFrame: 10,
      position: [1, 2, 3],
      targetObjectId: "character_steve",
      parameters: { radius: 4, alpha: 0.7 }
    }),
    durationFrames: 12
  };
  const second = {
    ...createEffectInstance("flash", {
      id: "effect_second",
      startFrame: 40,
      parameters: { intensity: 0.8 }
    }),
    durationFrames: 5
  };

  return syncEffectTimelineLane({
    ...initial,
    effects: { instances: [first, second] }
  });
}

function createParticleProject(): MineMotionProject {
  const initial = createInitialProject();
  const effect = createEffectInstance("glowBurst", {
    id: "effect_particles",
    startFrame: 10
  });
  return syncEffectTimelineLane({
    ...initial,
    effects: { instances: [effect] }
  });
}

function requireMutation(
  result: ReturnType<typeof applyEffectTimelineCommand>
): EffectTimelineMutation {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.errors.map((error) => error.code).join(", "));
  }
  return result.value;
}

function errorCodes(
  result: ReturnType<typeof applyEffectTimelineCommand>
): string[] {
  return result.ok ? [] : result.errors.map((error) => error.code);
}

function effectLane(project: MineMotionProject) {
  return project.animation.timelineTracks.find(
    (track) => track.id === "track_effects_main"
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EffectTimelineController", () => {
  it("moves one effect without changing duration, payload, or project order", () => {
    const project = createProject();
    const before = structuredClone(project);
    const mutation = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "move",
        effectId: "effect_first",
        startFrame: 24
      })
    );

    expect(mutation.changed).toBe(true);
    expect(mutation.project.effects.instances.map((effect) => effect.id)).toEqual([
      "effect_first",
      "effect_second"
    ]);
    expect(mutation.project.effects.instances[0]).toMatchObject({
      ...project.effects.instances[0],
      startFrame: 24
    });
    expect(mutation.project.effects.instances[0].nativeVfx?.startFrame).toBe(24);
    expect(effectLane(mutation.project)?.items[0]).toMatchObject({
      effectId: "effect_first",
      startFrame: 24,
      durationFrames: 12
    });
    expect(project).toEqual(before);
  });

  it("trims either edge with inclusive end-frame semantics", () => {
    const project = createProject();
    const trimStart = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "trim-start",
        effectId: "effect_first",
        startFrame: 15
      })
    );
    const startEffect = trimStart.project.effects.instances[0];

    expect(startEffect.startFrame).toBe(15);
    expect(startEffect.durationFrames).toBe(7);
    expect(startEffect.startFrame + startEffect.durationFrames).toBe(22);

    const trimEnd = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "trim-end",
        effectId: "effect_first",
        endFrame: 11
      })
    );
    expect(trimEnd.project.effects.instances[0]).toMatchObject({
      startFrame: 10,
      durationFrames: 1
    });
  });

  it("updates only whitelisted editable fields and merges parameters", () => {
    const project = createProject();
    const mutation = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "update",
        effectId: "effect_first",
        patch: {
          name: "Edited Shockwave",
          durationFrames: 20,
          position: [-1, 0, 8],
          targetObjectId: "camera_main",
          parameters: { alpha: 0.25 }
        }
      })
    );
    const updated = mutation.project.effects.instances[0];

    expect(updated).toMatchObject({
      id: "effect_first",
      type: "shockwave",
      name: "Edited Shockwave",
      durationFrames: 20,
      position: [-1, 0, 8],
      targetObjectId: "camera_main",
      parameters: { radius: 4, alpha: 0.25 }
    });
    expect(updated.position).not.toBe(project.effects.instances[0].position);
    expect(updated.parameters).not.toBe(project.effects.instances[0].parameters);
  });

  it("duplicates after the source with an explicit unique ID and deep clones data", () => {
    const project = createProject();
    const mutation = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "duplicate",
        effectId: "effect_first",
        newEffectId: "effect_duplicate",
        startFrame: 30
      })
    );
    const duplicate = mutation.project.effects.instances[1];

    expect(mutation.project.effects.instances.map((effect) => effect.id)).toEqual([
      "effect_first",
      "effect_duplicate",
      "effect_second"
    ]);
    expect(duplicate).toMatchObject({
      ...project.effects.instances[0],
      id: "effect_duplicate",
      name: `${project.effects.instances[0].name} Copy`,
      startFrame: 30
    });
    expect(duplicate.nativeVfx).toMatchObject({
      id: "effect_duplicate",
      displayName: "Shockwave Copy",
      startFrame: 30
    });
    expect(duplicate.position).not.toBe(project.effects.instances[0].position);
    expect(duplicate.parameters).not.toBe(project.effects.instances[0].parameters);
    expect(mutation.selectedEffectId).toBe("effect_duplicate");
  });

  it("copies without mutation and pastes an independent append-only clone", () => {
    const project = createProject();
    const before = JSON.stringify(project);
    const copied = copyEffectTimelineBlock(project, "effect_first");

    expect(copied.ok).toBe(true);
    if (!copied.ok) return;
    expect(JSON.stringify(project)).toBe(before);
    expect(copied.value.effect).toMatchObject(project.effects.instances[0]);
    expect(copied.value.effect).not.toBe(project.effects.instances[0]);

    const mutation = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "paste",
        clipboard: copied.value,
        newEffectId: "effect_pasted",
        startFrame: 70
      })
    );
    const pasted = mutation.project.effects.instances.at(-1);

    expect(pasted).toMatchObject({
      ...project.effects.instances[0],
      id: "effect_pasted",
      name: `${project.effects.instances[0].name} Copy`,
      startFrame: 70
    });
    expect(pasted?.nativeVfx).toMatchObject({
      id: "effect_pasted",
      displayName: "Shockwave Copy",
      startFrame: 70
    });
    expect(pasted?.position).not.toBe(copied.value.effect.position);
    expect(pasted?.parameters).not.toBe(copied.value.effect.parameters);
  });

  it("keeps disabled effects selectable in the canonical lane", () => {
    const project = createProject();
    const mutation = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "set-enabled",
        effectId: "effect_first",
        enabled: false
      })
    );

    expect(mutation.project.effects.instances[0].enabled).toBe(false);
    expect(effectLane(mutation.project)?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ effectId: "effect_first" })
      ])
    );
  });

  it("reorders only the persisted effect array and preserves every foreign lane", () => {
    const project = createProject();
    const customLane = {
      id: "track_custom",
      type: "camera" as const,
      name: "Custom",
      items: []
    };
    const withCustomLane = {
      ...project,
      animation: {
        ...project.animation,
        timelineTracks: [...project.animation.timelineTracks, customLane]
      }
    };
    const mutation = requireMutation(
      applyEffectTimelineCommand(withCustomLane, {
        type: "reorder",
        effectId: "effect_second",
        toIndex: 0
      })
    );

    expect(mutation.project.effects.instances.map((effect) => effect.id)).toEqual([
      "effect_second",
      "effect_first"
    ]);
    expect(mutation.project.animation.timelineTracks).toContainEqual(customLane);
    expect(
      mutation.project.animation.timelineTracks.filter(
        (track) => track.type === "effect"
      )
    ).toHaveLength(1);
  });

  it("canonicalizes foreign lanes before returning a history-safe project", () => {
    const project = createProject();
    const customLane = {
      id: "track_custom_safe",
      type: "camera" as const,
      name: "Custom Safe",
      items: [],
      unsafeRuntimeValue: () => "not serializable"
    };
    const mutation = requireMutation(
      applyEffectTimelineCommand(
        {
          ...project,
          animation: {
            ...project.animation,
            timelineTracks: [...project.animation.timelineTracks, customLane]
          }
        },
        { type: "move", effectId: "effect_first", startFrame: 24 }
      )
    );
    const returnedLane = mutation.project.animation.timelineTracks.find(
      (track) => track.id === customLane.id
    );

    expect(returnedLane).toEqual({
      id: "track_custom_safe",
      type: "camera",
      name: "Custom Safe",
      items: []
    });
    expect(() => structuredClone(mutation.project)).not.toThrow();
  });

  it("rejects effect fields outside the serialized contract", () => {
    const project = createProject();
    const malformedEffect = {
      ...project.effects.instances[0],
      unsafeRuntimeValue: () => "not serializable"
    };

    expect(
      errorCodes(
        applyEffectTimelineCommand(
          {
            ...project,
            effects: {
              instances: [malformedEffect, project.effects.instances[1]]
            }
          },
          { type: "move", effectId: "effect_first", startFrame: 24 }
        )
      )
    ).toContain("EFFECT_TIMELINE_EFFECT_INVALID");
  });

  it("rejects insertion beyond the bounded effect capacity", () => {
    const project = createProject();
    const baseEffect = project.effects.instances[0];
    const instances = Array.from(
      { length: MAX_EFFECT_INSTANCES },
      (_, index) => ({ ...baseEffect, id: `effect_capacity_${index}` })
    );
    const atCapacity = syncEffectTimelineLane({
      ...project,
      effects: { instances }
    });

    expect(
      errorCodes(
        applyEffectTimelineCommand(atCapacity, {
          type: "insert",
          effect: { ...baseEffect, id: "effect_capacity_overflow" }
        })
      )
    ).toContain("EFFECT_TIMELINE_EFFECT_LIMIT_EXCEEDED");
  });

  it("keeps oversized legacy projects editable while refusing further growth", () => {
    const project = createProject();
    const baseEffect = project.effects.instances[0];
    const instances = Array.from(
      { length: MAX_EFFECT_INSTANCES + 1 },
      (_, index) => ({ ...baseEffect, id: `effect_legacy_capacity_${index}` })
    );
    const oversized = syncEffectTimelineLane({
      ...project,
      effects: { instances }
    });
    const disabled = requireMutation(
      applyEffectTimelineCommand(oversized, {
        type: "set-enabled",
        effectId: "effect_legacy_capacity_0",
        enabled: false
      })
    );
    const moved = requireMutation(
      applyEffectTimelineCommand(disabled.project, {
        type: "move",
        effectId: "effect_legacy_capacity_0",
        startFrame: 24
      })
    );
    const repaired = requireMutation(
      applyEffectTimelineCommand(moved.project, {
        type: "delete",
        effectId: "effect_legacy_capacity_0"
      })
    );

    expect(repaired.project.effects.instances).toHaveLength(MAX_EFFECT_INSTANCES);
    expect(
      errorCodes(
        applyEffectTimelineCommand(oversized, {
          type: "insert",
          effect: { ...baseEffect, id: "effect_legacy_capacity_growth" }
        })
      )
    ).toContain("EFFECT_TIMELINE_EFFECT_LIMIT_EXCEEDED");
  });

  it("inserts and deletes through the same validated projection", () => {
    const project = createProject();
    const inserted = createEffectInstance("fogPulse", {
      id: "effect_inserted",
      startFrame: 80
    });
    const addition = requireMutation(
      applyEffectTimelineCommand(project, { type: "insert", effect: inserted })
    );
    expect(addition.project.effects.instances.at(-1)).toMatchObject(inserted);
    expect(addition.project.effects.instances.at(-1)?.nativeVfx).toMatchObject({
      id: "effect_inserted",
      definitionId: "fogPulse",
      startFrame: 80
    });
    expect(addition.selectedEffectId).toBe("effect_inserted");

    const deletion = requireMutation(
      applyEffectTimelineCommand(addition.project, {
        type: "delete",
        effectId: "effect_inserted"
      })
    );
    expect(deletion.project.effects.instances.map((effect) => effect.id)).not.toContain(
      "effect_inserted"
    );
    expect(effectLane(deletion.project)?.items.map((item) => item.effectId)).not.toContain(
      "effect_inserted"
    );
    expect(deletion.selectedEffectId).toBeNull();
  });

  it("returns an explicit no-op without producing a new project", () => {
    const project = createProject();
    const mutation = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "move",
        effectId: "effect_first",
        startFrame: 10
      })
    );

    expect(mutation.changed).toBe(false);
    expect(mutation.project).toBe(project);
  });

  it("rejects missing effects, duplicate IDs, collisions, and invalid commands", () => {
    const project = createProject();
    const duplicateIdProject = {
      ...project,
      effects: {
        instances: [
          ...project.effects.instances,
          { ...project.effects.instances[1], id: "effect_first" }
        ]
      }
    };
    const cases: Array<[unknown, string]> = [
      [
        { type: "move", effectId: "missing", startFrame: 3 },
        "EFFECT_TIMELINE_EFFECT_NOT_FOUND"
      ],
      [
        {
          type: "duplicate",
          effectId: "effect_first",
          newEffectId: "effect_second",
          startFrame: 3
        },
        "EFFECT_TIMELINE_ID_DUPLICATE"
      ],
      [{ type: "unknown" }, "EFFECT_TIMELINE_COMMAND_INVALID"],
      [null, "EFFECT_TIMELINE_COMMAND_INVALID"]
    ];

    for (const [command, code] of cases) {
      const before = JSON.stringify(project);
      const result = applyEffectTimelineCommand(project, command as EffectTimelineCommand);
      expect(errorCodes(result), JSON.stringify(command)).toContain(code);
      expect(JSON.stringify(project)).toBe(before);
    }
    expect(
      errorCodes(
        applyEffectTimelineCommand(duplicateIdProject, {
          type: "move",
          effectId: "effect_first",
          startFrame: 3
        })
      )
    ).toContain("EFFECT_TIMELINE_ID_DUPLICATE");
  });

  it.each([
    [-1, "EFFECT_TIMELINE_START_FRAME_INVALID"],
    [1.5, "EFFECT_TIMELINE_START_FRAME_INVALID"],
    [Number.NaN, "EFFECT_TIMELINE_START_FRAME_INVALID"],
    [Number.POSITIVE_INFINITY, "EFFECT_TIMELINE_START_FRAME_INVALID"],
    [Number.MAX_SAFE_INTEGER, "EFFECT_TIMELINE_FRAME_RANGE_INVALID"]
  ])("rejects malformed move frame %s", (startFrame, code) => {
    const project = createProject();
    const result = applyEffectTimelineCommand(project, {
      type: "move",
      effectId: "effect_first",
      startFrame
    });

    expect(errorCodes(result)).toContain(code);
  });

  it("rejects zero-length and inverted trims without repairing them", () => {
    const project = createProject();

    expect(
      errorCodes(
        applyEffectTimelineCommand(project, {
          type: "trim-start",
          effectId: "effect_first",
          startFrame: 22
        })
      )
    ).toContain("EFFECT_TIMELINE_DURATION_INVALID");
    expect(
      errorCodes(
        applyEffectTimelineCommand(project, {
          type: "trim-end",
          effectId: "effect_first",
          endFrame: 10
        })
      )
    ).toContain("EFFECT_TIMELINE_DURATION_INVALID");
  });

  it("enforces inclusive project timeline bounds on every timing mutation", () => {
    const project = createProject();
    const legalMove = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "move",
        effectId: "effect_first",
        startFrame: 288
      })
    );
    expect(legalMove.project.effects.instances[0].startFrame).toBe(288);

    const copied = copyEffectTimelineBlock(project, "effect_first");
    expect(copied.ok).toBe(true);
    if (!copied.ok) return;
    const invalidCommands: EffectTimelineCommand[] = [
      { type: "move", effectId: "effect_first", startFrame: 289 },
      {
        type: "update",
        effectId: "effect_first",
        patch: { durationFrames: 291 }
      },
      {
        type: "trim-end",
        effectId: "effect_first",
        endFrame: 301
      },
      {
        type: "duplicate",
        effectId: "effect_first",
        newEffectId: "effect_too_late",
        startFrame: 289
      },
      {
        type: "paste",
        clipboard: copied.value,
        newEffectId: "effect_paste_too_late",
        startFrame: 289
      }
    ];
    for (const command of invalidCommands) {
      expect(errorCodes(applyEffectTimelineCommand(project, command))).toContain(
        "EFFECT_TIMELINE_FRAME_OUT_OF_RANGE"
      );
    }
  });

  it("allows non-timing repair/delete commands on a legacy overhanging block", () => {
    const project = createProject();
    const overhanging = {
      ...project,
      effects: {
        instances: [
          { ...project.effects.instances[0], startFrame: 295, durationFrames: 12 },
          project.effects.instances[1]
        ]
      }
    };

    expect(
      requireMutation(
        applyEffectTimelineCommand(overhanging, {
          type: "set-enabled",
          effectId: "effect_first",
          enabled: false
        })
      ).project.effects.instances[0].enabled
    ).toBe(false);
    expect(
      requireMutation(
        applyEffectTimelineCommand(overhanging, {
          type: "delete",
          effectId: "effect_first"
        })
      ).project.effects.instances.map((effect) => effect.id)
    ).toEqual(["effect_second"]);
  });

  it.each([Number.MAX_VALUE, 1e9, -1, 1.5])(
    "rejects unsafe particle count %s before it reaches the renderer",
    (count) => {
      const project = createParticleProject();
      const result = applyEffectTimelineCommand(project, {
        type: "update",
        effectId: "effect_particles",
        patch: { parameters: { count } }
      });
      expect(errorCodes(result)).toContain("EFFECT_TIMELINE_PARAMETER_INVALID");
    }
  );

  it("accepts the exact particle cap and rejects cap plus one for new edits", () => {
    const project = createParticleProject();
    expect(
      applyEffectTimelineCommand(project, {
        type: "update",
        effectId: "effect_particles",
        patch: { parameters: { count: 1_024 } }
      }).ok
    ).toBe(true);
    expect(
      errorCodes(
        applyEffectTimelineCommand(project, {
          type: "update",
          effectId: "effect_particles",
          patch: { parameters: { count: 1_025 } }
        })
      )
    ).toContain("EFFECT_TIMELINE_PARAMETER_INVALID");
  });

  it("rejects a new out-of-schema count but repairs one preserved from legacy data", () => {
    const project = createProject();
    expect(
      errorCodes(
        applyEffectTimelineCommand(project, {
          type: "update",
          effectId: "effect_first",
          patch: { parameters: { count: 100 } }
        })
      )
    ).toContain("EFFECT_TIMELINE_PARAMETER_UNKNOWN");

    const legacy = {
      ...project,
      effects: {
        instances: [
          {
            ...project.effects.instances[0],
            parameters: Object.fromEntries([
              ...Object.entries(project.effects.instances[0].parameters),
              ["count", 1e9]
            ])
          },
          project.effects.instances[1]
        ]
      }
    };
    const repair = applyEffectTimelineCommand(legacy, {
      type: "update",
      effectId: "effect_first",
      patch: { parameters: { count: 100 } }
    });
    expect(repair.ok).toBe(true);
    if (!repair.ok) return;
    expect(repair.value.project.effects.instances[0].parameters.count).toBe(100);
  });

  it("keeps legacy oversized counts editable for non-parameter repairs", () => {
    const project = createProject();
    const legacy = {
      ...project,
      effects: {
        instances: [
          {
            ...project.effects.instances[0],
            parameters: {
              ...project.effects.instances[0].parameters,
              count: 1e9
            }
          },
          project.effects.instances[1]
        ]
      }
    };

    expect(
      applyEffectTimelineCommand(legacy, {
        type: "move",
        effectId: "effect_first",
        startFrame: 20
      }).ok
    ).toBe(true);
    expect(
      applyEffectTimelineCommand(legacy, {
        type: "update",
        effectId: "effect_first",
        patch: { parameters: { count: 100 } }
      }).ok
    ).toBe(true);
  });

  it("rejects sparse tuples, class records, inherited fields, and accessors without throwing", () => {
    const project = createProject();
    const inherited = Object.create({
      type: "move",
      effectId: "effect_first",
      startFrame: 2
    }) as EffectTimelineCommand;
    const accessor: Record<string, unknown> = { type: "move", effectId: "effect_first" };
    Object.defineProperty(accessor, "startFrame", {
      enumerable: true,
      get() {
        throw new Error("must not execute");
      }
    });
    const parameterAccessor: Record<string, unknown> = {};
    Object.defineProperty(parameterAccessor, "alpha", {
      enumerable: true,
      get() {
        throw new Error("must not execute");
      }
    });
    const symbolParameters: Record<PropertyKey, unknown> = { alpha: 0.5 };
    Object.defineProperty(symbolParameters, Symbol("hidden"), {
      enumerable: true,
      value: 1
    });
    const cases: unknown[] = [
      inherited,
      accessor,
      {
        type: "update",
        effectId: "effect_first",
        patch: { position: new Array(3) }
      },
      {
        type: "update",
        effectId: "effect_first",
        patch: { parameters: new Date() }
      },
      {
        type: "update",
        effectId: "effect_first",
        patch: { parameters: parameterAccessor }
      },
      {
        type: "update",
        effectId: "effect_first",
        patch: { parameters: symbolParameters }
      }
    ];

    for (const command of cases) {
      expect(() =>
        applyEffectTimelineCommand(project, command as EffectTimelineCommand)
      ).not.toThrow();
      expect(applyEffectTimelineCommand(project, command as EffectTimelineCommand).ok).toBe(
        false
      );
    }
  });

  it("bounds parameter patch entries, keys, and string values before mutation", () => {
    const project = createProject();
    const before = structuredClone(project);
    const tooMany = Object.fromEntries(
      Array.from({ length: 65 }, (_, index) => [`p${index}`, index])
    );
    const cases = [
      { parameters: tooMany },
      { parameters: { [`a${"b".repeat(128)}`]: 1 } },
      { parameters: { color: "x".repeat(4_097) } }
    ];

    for (const patch of cases) {
      const result = applyEffectTimelineCommand(project, {
        type: "update",
        effectId: "effect_first",
        patch
      } as EffectTimelineCommand);
      expect(errorCodes(result)).toContain("EFFECT_TIMELINE_PARAMETERS_INVALID");
    }
    expect(project).toEqual(before);
  });

  it("rejects unsafe color syntax before it can reach CSS or renderer paths", () => {
    const project = createProject();
    const result = applyEffectTimelineCommand(project, {
      type: "update",
      effectId: "effect_first",
      patch: { parameters: { color: "url(http://localhost/private)" } }
    });

    expect(errorCodes(result)).toContain("EFFECT_TIMELINE_PARAMETER_INVALID");
  });

  it("returns project validation errors instead of throwing on malformed animation data", () => {
    const project = createProject();
    const malformed = {
      ...project,
      animation: { ...project.animation, timelineTracks: null }
    } as unknown as MineMotionProject;

    expect(() =>
      applyEffectTimelineCommand(malformed, {
        type: "move",
        effectId: "effect_first",
        startFrame: 2
      })
    ).not.toThrow();
    expect(
      errorCodes(
        applyEffectTimelineCommand(malformed, {
          type: "move",
          effectId: "effect_first",
          startFrame: 2
        })
      )
    ).toContain("EFFECT_TIMELINE_PROJECT_INVALID");

    const malformedTrack = {
      ...project,
      animation: { ...project.animation, timelineTracks: [null] }
    } as unknown as MineMotionProject;
    expect(
      errorCodes(
        applyEffectTimelineCommand(malformedTrack, {
          type: "move",
          effectId: "effect_first",
          startFrame: 2
        })
      )
    ).toContain("EFFECT_TIMELINE_PROJECT_INVALID");
  });

  it("refuses malformed clipboard data and paste ID collisions", () => {
    const project = createProject();

    expect(
      errorCodes(
        applyEffectTimelineCommand(project, {
          type: "paste",
          clipboard: { version: 2 },
          newEffectId: "effect_pasted",
          startFrame: 2
        } as unknown as EffectTimelineCommand)
      )
    ).toContain("EFFECT_TIMELINE_CLIPBOARD_INVALID");

    const copied = copyEffectTimelineBlock(project, "effect_first");
    expect(copied.ok).toBe(true);
    if (!copied.ok) return;
    expect(
      errorCodes(
        applyEffectTimelineCommand(project, {
          type: "paste",
          clipboard: copied.value,
          newEffectId: "effect_second",
          startFrame: 2
        })
      )
    ).toContain("EFFECT_TIMELINE_ID_DUPLICATE");
  });

  it("round-trips timing, enabled state, order, names, and cloned payloads", () => {
    const project = createProject();
    const copied = copyEffectTimelineBlock(project, "effect_first");
    expect(copied.ok).toBe(true);
    if (!copied.ok) return;
    const pasted = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "paste",
        clipboard: copied.value,
        newEffectId: "effect_saved_copy",
        startFrame: 90
      })
    );
    const disabled = requireMutation(
      applyEffectTimelineCommand(pasted.project, {
        type: "set-enabled",
        effectId: "effect_saved_copy",
        enabled: false
      })
    );
    const reordered = requireMutation(
      applyEffectTimelineCommand(disabled.project, {
        type: "reorder",
        effectId: "effect_saved_copy",
        toIndex: 0
      })
    );
    const reloaded = ProjectSerializer.parse(
      ProjectSerializer.serialize(reordered.project)
    );

    expect(reloaded.schemaVersion).toBe(10);
    expect(reloaded.effects.instances).toEqual(reordered.project.effects.instances);
    expect(effectLane(reloaded)?.items).toEqual(effectLane(reordered.project)?.items);
    expect(effectLane(reloaded)?.items[0].label).toBe(
      reloaded.effects.instances.find(
        (effect) => effect.id === effectLane(reloaded)?.items[0].effectId
      )?.name
    );
    expect(effectLane(reloaded)?.items.map((item) => item.effectId)).toContain(
      "effect_saved_copy"
    );
  });

  it("restores source data and lane projection through undo and redo", () => {
    const project = createProject();
    const history = new HistoryStack<MineMotionProject>();
    const mutation = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "move",
        effectId: "effect_first",
        startFrame: 36
      })
    );
    history.push(project, mutation.historyLabel);

    const undone = history.undo(mutation.project);
    expect(undone?.effects.instances).toEqual(project.effects.instances);
    expect(effectLane(undone as MineMotionProject)?.items).toEqual(
      effectLane(project)?.items
    );

    const redone = history.redo(undone as MineMotionProject);
    expect(redone?.effects.instances).toEqual(mutation.project.effects.instances);
    expect(effectLane(redone as MineMotionProject)?.items).toEqual(
      effectLane(mutation.project)?.items
    );
  });

  it("synchronizes shared fields while preserving native-only VFX through history", () => {
    const project = ProjectSerializer.parse(
      ProjectSerializer.serialize(createProject())
    );
    const native = project.effects.instances[0].nativeVfx;
    if (!native) throw new Error("native VFX fixture missing");
    native.transform.rotation = [0, 30, 0];
    native.seed = "custom-history-seed";
    native.parameterKeyframes = [
      {
        id: "key_radius_history",
        parameterId: "radius",
        localFrame: 4,
        value: 5,
        interpolation: "linear"
      }
    ];
    const history = new HistoryStack<MineMotionProject>();
    const mutation = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "move",
        effectId: "effect_first",
        startFrame: 36
      })
    );
    history.push(project, mutation.historyLabel);

    expect(mutation.project.effects.instances[0].nativeVfx).toMatchObject({
      startFrame: 36,
      seed: "custom-history-seed",
      transform: { rotation: [0, 30, 0] },
      parameterKeyframes: [{ id: "key_radius_history" }]
    });
    const undone = history.undo(mutation.project);
    expect(undone?.effects.instances[0].nativeVfx).toEqual(native);
    const redone = history.redo(undone as MineMotionProject);
    expect(redone?.effects.instances[0].nativeVfx).toEqual(
      mutation.project.effects.instances[0].nativeVfx
    );
  });

  it("does not create history checkpoints for a no-op or failed edit", () => {
    const project = createProject();
    const history = new HistoryStack<MineMotionProject>();
    const commands: EffectTimelineCommand[] = [
      { type: "move", effectId: "effect_first", startFrame: 10 },
      { type: "move", effectId: "effect_first", startFrame: -1 }
    ];

    for (const command of commands) {
      const result = applyEffectTimelineCommand(project, command);
      if (result.ok && result.value.changed) {
        history.push(project, result.value.historyLabel);
      }
    }
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("round-trips edits and foreign lanes through a .minemotion package", () => {
    const project = createProject();
    const customLane = {
      id: "track_camera_package",
      type: "camera" as const,
      name: "Package Camera Notes",
      items: []
    };
    const withCustom = {
      ...project,
      animation: {
        ...project.animation,
        timelineTracks: [...project.animation.timelineTracks, customLane]
      }
    };
    const mutation = requireMutation(
      applyEffectTimelineCommand(withCustom, {
        type: "duplicate",
        effectId: "effect_first",
        newEffectId: "effect_package_copy",
        startFrame: 80
      })
    );
    const packaged = createMineMotionPackageData(mutation.project);
    const reloaded = PackageReader.parse(JSON.stringify(packaged));

    expect(reloaded.effects.instances).toEqual(mutation.project.effects.instances);
    expect(reloaded.animation.timelineTracks).toContainEqual(customLane);
    expect(effectLane(reloaded)?.items).toEqual(effectLane(mutation.project)?.items);
  });

  it("preserves deterministic evaluation at the same local frame after moving", () => {
    const project = createProject();
    const definition = createLegacyVfxRegistry().get("shockwave");
    expect(definition).not.toBeNull();
    if (!definition) return;
    const source = project.effects.instances[0];
    const before = evaluateVfxFrame(
      adaptLegacyEffectInstance(source),
      definition,
      { frame: source.startFrame + 4, fps: 24, seed: "project", quality: "high" }
    );
    const mutation = requireMutation(
      applyEffectTimelineCommand(project, {
        type: "move",
        effectId: source.id,
        startFrame: 100
      })
    );
    const moved = mutation.project.effects.instances[0];
    const after = evaluateVfxFrame(
      adaptLegacyEffectInstance(moved),
      definition,
      { frame: moved.startFrame + 4, fps: 24, seed: "project", quality: "high" }
    );

    expect(after.ok).toBe(true);
    expect(before.ok).toBe(true);
    if (!after.ok || !before.ok) return;
    expect({ ...after.value, frame: before.value.frame }).toEqual(before.value);
  });

  it("does not consult random, UUID, crypto, or wall-clock entropy", () => {
    const project = createProject();
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random must not be used");
    });
    vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Date.now must not be used");
    });
    vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
      throw new Error("randomUUID must not be used");
    });
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(() => {
      throw new Error("getRandomValues must not be used");
    });

    const copied = copyEffectTimelineBlock(project, "effect_first");
    expect(copied.ok).toBe(true);
    if (!copied.ok) return;
    expect(
      applyEffectTimelineCommand(project, {
        type: "duplicate",
        effectId: "effect_first",
        newEffectId: "effect_no_entropy",
        startFrame: 30
      }).ok
    ).toBe(true);
    expect(
      applyEffectTimelineCommand(project, {
        type: "paste",
        clipboard: copied.value,
        newEffectId: "effect_paste_no_entropy",
        startFrame: 50
      }).ok
    ).toBe(true);
  });
});
