import { describe, expect, it } from "vitest";
import type { VfxDefinition } from "./VfxDefinition";
import { VfxRegistry } from "./VfxRegistry";

function createDefinition(id = "test.flash"): VfxDefinition {
  return {
    version: 1,
    id,
    displayName: "Test Flash",
    description: "A registry test definition.",
    space: "screen",
    defaultDurationFrames: 12,
    defaultBlendMode: "screen",
    defaultRenderLayer: "overlay",
    parameterSchema: [
      {
        id: "alpha",
        displayName: "Alpha",
        animatable: true,
        kind: "number",
        defaultValue: 0.75,
        min: 0,
        max: 1
      }
    ],
    tags: ["test"]
  };
}

describe("VfxRegistry", () => {
  it("registers and retrieves typed definitions", () => {
    const definition = createDefinition();
    const registry = new VfxRegistry([definition]);

    expect(registry.get(definition.id)?.displayName).toBe("Test Flash");
    expect(registry.list().map((item) => item.id)).toEqual([definition.id]);
  });

  it("keeps a defensive immutable definition copy", () => {
    const sourceTags = ["test"];
    const definition = createDefinition();
    definition.tags = sourceTags;
    const registry = new VfxRegistry([definition]);
    sourceTags.push("mutated");

    expect(registry.get(definition.id)?.tags).toEqual(["test"]);
    expect(Object.isFrozen(registry.get(definition.id))).toBe(true);
  });

  it("rejects duplicate definition IDs", () => {
    const registry = new VfxRegistry([createDefinition()]);

    expect(() => registry.register(createDefinition())).toThrow(
      "already registered"
    );
  });

  it("rejects invalid definitions", () => {
    const invalid = { ...createDefinition(), id: "" };

    expect(() => new VfxRegistry([invalid])).toThrow("Invalid VFX definition");
  });

  it("returns null without mutating the registry for an unknown ID", () => {
    const registry = new VfxRegistry([createDefinition()]);

    expect(registry.get("missing.definition")).toBeNull();
    expect(registry.list()).toHaveLength(1);
  });
});
