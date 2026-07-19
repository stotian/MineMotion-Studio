import { describe, expect, it } from "vitest";
import { generateVfxDescriptorPreviewDataUrl } from "../library/VfxPresetPreviewCache";
import { evaluateVfxPrimitive } from "../primitives/VfxPrimitiveEvaluator";
import { createBlankVfxAuthoringDocument } from "./VfxAuthoringDocument";
import {
  applyVfxAuthoringCommand,
  createDefaultVfxAuthoringStackItem,
  nextVfxAuthoringStackItemId,
  type VfxAuthoringAddKind
} from "./VfxAuthoringController";
import { compileVfxAuthoringDocument } from "./VfxAuthoringCompiler";

function apply(document: ReturnType<typeof createBlankVfxAuthoringDocument>, command: Parameters<typeof applyVfxAuthoringCommand>[1]) {
  const result = applyVfxAuthoringCommand(document, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.errors.map((entry) => entry.message).join(" "));
  return result.value;
}

describe("VFX authoring controller and compiler", () => {
  it("adds every supported declarative item kind with deterministic IDs", () => {
    let document = createBlankVfxAuthoringDocument();
    const kinds: VfxAuthoringAddKind[] = ["particle-emitter", "beam", "trail", "expanding-ring", "light-pulse", "tint", "opacity", "scale"];
    for (const kind of kinds) {
      const id = nextVfxAuthoringStackItemId(document, kind);
      const mutation = apply(document, { type: "add", item: createDefaultVfxAuthoringStackItem(kind, id) });
      expect(mutation.changed).toBe(true);
      document = mutation.document;
    }
    expect(document.stack).toHaveLength(8);
    expect(Object.isFrozen(document)).toBe(true);
    expect(compileVfxAuthoringDocument(document).ok).toBe(true);
  });

  it("reorders, duplicates, toggles, replaces, removes, and updates settings immutably", () => {
    const original = createBlankVfxAuthoringDocument();
    const first = apply(original, { type: "add", item: createDefaultVfxAuthoringStackItem("beam", "beam:1") }).document;
    const second = apply(first, { type: "add", item: createDefaultVfxAuthoringStackItem("opacity", "opacity:1") }).document;
    const reordered = apply(second, { type: "reorder", itemId: "opacity:1", toIndex: 0 }).document;
    expect(reordered.stack.map((item) => item.id)).toEqual(["opacity:1", "beam:1"]);
    const duplicated = apply(reordered, { type: "duplicate", itemId: "beam:1", newItemId: "beam:2" }).document;
    expect(duplicated.stack[2].id).toBe("beam:2");
    const disabled = apply(duplicated, { type: "set-enabled", itemId: "beam:2", enabled: false }).document;
    const beam = disabled.stack.find((item) => item.id === "beam:1")!;
    const edited = apply(disabled, { type: "replace-item", itemId: beam.id, item: { ...beam, label: "Hero Beam" } }).document;
    const configured = apply(edited, { type: "update-settings", patch: { durationFrames: 48, previewQuality: "draft", exportQuality: "high", target: { entityId: "hero", boneId: "right_hand" } } }).document;
    const removed = apply(configured, { type: "remove", itemId: "opacity:1" }).document;
    expect(removed.stack.map((item) => [item.id, item.enabled])).toEqual([["beam:1", true], ["beam:2", false]]);
    expect(removed.durationFrames).toBe(48);
    expect(removed.target).toEqual({ entityId: "hero", boneId: "right_hand" });
    expect(original.stack).toEqual([]);
  });

  it("applies enabled modifiers to previous descriptors and previews deterministically", () => {
    let document = createBlankVfxAuthoringDocument();
    document = apply(document, { type: "add", item: createDefaultVfxAuthoringStackItem("beam", "beam:1") }).document;
    document = apply(document, { type: "add", item: { ...createDefaultVfxAuthoringStackItem("tint", "tint:1"), modifier: { kind: "tint", color: "#33ccff" } } }).document;
    document = apply(document, { type: "add", item: { ...createDefaultVfxAuthoringStackItem("opacity", "opacity:1"), modifier: { kind: "opacity", multiplier: 0.5 } } }).document;
    document = apply(document, { type: "add", item: { ...createDefaultVfxAuthoringStackItem("scale", "scale:1"), modifier: { kind: "scale", multiplier: 2 } } }).document;
    const compiled = compileVfxAuthoringDocument(document);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    const beam = compiled.value.descriptors[0];
    expect(beam.kind).toBe("beam");
    if (beam.kind !== "beam") return;
    expect(beam.color).toBe("#33ccff");
    expect(beam.opacity).toBe(0.5);
    expect(beam.end).toEqual([0, 4, 0]);
    expect(beam.width).toBe(0.16);
    const evaluated = evaluateVfxPrimitive({
      status: "active",
      instanceId: "authoring-preview",
      definitionId: "custom",
      frame: 0,
      fps: 30,
      localFrame: 0,
      progress: 0,
      localSeconds: 0,
      durationSeconds: 1,
      rootSeed: 1,
      frameSeed: 2,
      frameRandom: 0.5,
      quality: "high",
      qualityScale: 0.75,
      inputs: {
        space: document.space,
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        target: document.target,
        parameters: {},
        blendMode: document.blendMode,
        renderLayer: document.renderLayer
      }
    }, beam);
    expect(evaluated.ok).toBe(true);
    expect(Object.isFrozen(compiled.value.descriptors)).toBe(true);
    expect(Object.isFrozen(beam.end)).toBe(true);
    const first = generateVfxDescriptorPreviewDataUrl(compiled.value.descriptors, document.displayName, document.id);
    expect(generateVfxDescriptorPreviewDataUrl(structuredClone(compiled.value.descriptors), document.displayName, document.id)).toBe(first);
  });

  it("rejects hostile commands, duplicate IDs, invalid patches, and excessive compiled budgets", () => {
    let document = createBlankVfxAuthoringDocument();
    document = apply(document, { type: "add", item: createDefaultVfxAuthoringStackItem("particle-emitter", "particles:1") }).document;
    expect(applyVfxAuthoringCommand(document, { type: "unknown" }).ok).toBe(false);
    expect(applyVfxAuthoringCommand(document, { type: "add", item: document.stack[0] }).ok).toBe(false);
    expect(applyVfxAuthoringCommand(document, { type: "update-settings", patch: { script: "alert(1)" } }).ok).toBe(false);
    const unsafe = structuredClone(document.stack[0]);
    if (unsafe.kind === "emitter") unsafe.descriptor.color = "url(javascript:alert(1))";
    expect(applyVfxAuthoringCommand(document, { type: "replace-item", itemId: unsafe.id, item: unsafe }).ok).toBe(false);
    let dense = createBlankVfxAuthoringDocument();
    for (let index = 0; index < 5; index += 1) {
      const item = createDefaultVfxAuthoringStackItem("particle-emitter", `dense:${index}`);
      if (item.kind !== "emitter") throw new Error("Expected emitter");
      dense = apply(dense, { type: "add", item: { ...item, descriptor: { ...item.descriptor, count: 1_024 } } }).document;
    }
    expect(compileVfxAuthoringDocument(dense).ok).toBe(false);
  });
});
