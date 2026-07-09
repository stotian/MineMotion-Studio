import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { createRenderStateSnapshot } from "./RenderStateSnapshot";
import { restoreRenderState } from "./RenderStateRestore";

describe("render state restore", () => {
  it("restores timeline frame and playback state after export", () => {
    const project = createInitialProject();
    const snapshot = createRenderStateSnapshot({
      ...project,
      animation: {
        ...project.animation,
        currentFrame: 42,
        isPlaying: true
      }
    });

    const restored = restoreRenderState(project, snapshot);

    expect(restored.animation.currentFrame).toBe(42);
    expect(restored.animation.isPlaying).toBe(true);
  });
});
