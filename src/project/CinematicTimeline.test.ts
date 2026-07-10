import { describe, expect, it } from "vitest";
import { createBuiltinAudioClip } from "../audio/AudioClip";
import { BUILTIN_SFX } from "../audio/BuiltinSfxRegistry";
import { spawnEffectAtFrame } from "../effects/EffectSpawner";
import { addEnvironmentKeyframe } from "../lighting/LightingController";
import { syncCinematicTimeline } from "./CinematicTimeline";
import { createInitialProject } from "./ProjectStore";

describe("CinematicTimeline", () => {
  it("syncs effect and audio blocks into timeline lanes", () => {
    const effect = spawnEffectAtFrame("shockwave", 20);
    const clip = createBuiltinAudioClip(BUILTIN_SFX[0], 30);
    const project = syncCinematicTimeline({
      ...createInitialProject(),
      effects: { instances: [effect] },
      audio: { clips: [clip] }
    });

    expect(
      project.animation.timelineTracks
        .find((track) => track.type === "effect")
        ?.items.map((item) => item.effectId)
    ).toContain(effect.id);
    expect(
      project.animation.timelineTracks
        .find((track) => track.type === "audio")
        ?.items.map((item) => item.audioClipId)
    ).toContain(clip.id);
  });

  it("syncs environment keyframes into the Lighting & Sky lane", () => {
    const initial = createInitialProject();
    const project = syncCinematicTimeline({
      ...initial,
      lighting: addEnvironmentKeyframe(
        initial.lighting,
        initial.postProcessing,
        42
      )
    });

    const lightingLane = project.animation.timelineTracks.find(
      (track) => track.type === "sky"
    );
    expect(lightingLane?.items[0].startFrame).toBe(42);
    expect(lightingLane?.items[0].environmentKeyframeId).toBe(
      "environment_keyframe_42"
    );
  });
});
