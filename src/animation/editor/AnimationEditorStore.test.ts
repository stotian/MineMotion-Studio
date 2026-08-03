import { describe, expect, it } from "vitest";
import { createAnimationEditorState, updateAnimationEditorState } from "./AnimationEditorStore";

describe("animation editor view preferences", () => {
  it("bounds zoom and preserves an explicit density", () => {
    const initial = createAnimationEditorState();
    expect(updateAnimationEditorState(initial, { zoom: 99 }).zoom).toBe(8);
    expect(updateAnimationEditorState(initial, { zoom: 0 }).zoom).toBe(0.5);
    expect(updateAnimationEditorState(initial, { density: "compact" }).density).toBe("compact");
  });
});
