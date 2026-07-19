import { describe, expect, it } from "vitest";
import { addTransformKeyframes } from "../../animation/Timeline";
import { createEffectInstance } from "../../effects/EffectRegistry";
import { createInitialProject } from "../../project/ProjectStore";
import { sampleProjectAnimationWithVfxTiming } from "./VfxAnimationSampling";

describe("sampleProjectAnimationWithVfxTiming", () => {
  it("holds the animated pose without rewinding the global VFX frame", () => {
    let project = createInitialProject();
    const characterId = project.scene.characters[0].id;
    project = addTransformKeyframes(project, characterId, 0);
    project.scene.characters[0] = {
      ...project.scene.characters[0],
      transform: {
        ...project.scene.characters[0].transform,
        position: [20, 0, 0]
      }
    };
    project = addTransformKeyframes(project, characterId, 20);
    project.animation.currentFrame = 14;
    project.effects.instances = [
      createEffectInstance("hitStop", { id: "hit_stop", startFrame: 12 })
    ];

    const sampled = sampleProjectAnimationWithVfxTiming(project);

    expect(sampled.animation.currentFrame).toBe(14);
    expect(sampled.scene.characters[0].transform.position[0]).toBe(12);
    expect(project.scene.characters[0].transform.position[0]).toBe(20);
  });
});
