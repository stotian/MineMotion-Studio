import { describe, expect, it } from "vitest";
import { builtinVfxPresetCatalog } from "../library/BuiltinVfxPresetCatalog";
import {
  createBlankVfxAuthoringDocument,
  deriveVfxAuthoringDocumentFromBuiltin,
  validateVfxAuthoringDocument
} from "./VfxAuthoringDocument";
import { MAX_VFX_AUTHORING_STACK_ITEMS } from "./VfxAuthoringTypes";

describe("VFX authoring documents", () => {
  it("creates a frozen structured-cloneable blank stack", () => {
    const document = createBlankVfxAuthoringDocument();
    expect(document.source).toEqual({ kind: "blank" });
    expect(document.stack).toEqual([]);
    expect(Object.isFrozen(document)).toBe(true);
    expect(structuredClone(document)).toEqual(document);
  });

  it("derives every stable built-in into an immutable declarative stack", () => {
    const presets = builtinVfxPresetCatalog.list().filter((preset) => preset.metadata.compatibility.maturity === "stable");
    expect(presets).toHaveLength(60);
    for (const preset of presets) {
      const before = structuredClone(preset);
      const document = deriveVfxAuthoringDocumentFromBuiltin(preset);
      expect(document.source).toEqual({
        kind: "derived-builtin",
        presetId: preset.metadata.id,
        definitionId: preset.definition.id
      });
      expect(document.stack.length).toBeLessThanOrEqual(MAX_VFX_AUTHORING_STACK_ITEMS);
      expect(document.stack.every((item) => item.kind === "primitive" || item.kind === "emitter")).toBe(true);
      expect(validateVfxAuthoringDocument(document).ok).toBe(true);
      expect(structuredClone(preset)).toEqual(before);
    }
  });

  it("rejects executable values, mismatched emitter kinds, and oversized stacks", () => {
    const derived = deriveVfxAuthoringDocumentFromBuiltin(
      builtinVfxPresetCatalog.list().find((preset) => preset.metadata.effectType === "combatSparks")!
    );
    const emitter = derived.stack[0];
    expect(validateVfxAuthoringDocument({ ...derived, stack: [{ ...emitter, kind: "primitive" }] }).ok).toBe(false);
    expect(validateVfxAuthoringDocument({ ...derived, stack: Array.from({ length: MAX_VFX_AUTHORING_STACK_ITEMS + 1 }, () => emitter) }).ok).toBe(false);
    expect(validateVfxAuthoringDocument({ ...derived, description: (() => "unsafe") }).ok).toBe(false);
  });
});
