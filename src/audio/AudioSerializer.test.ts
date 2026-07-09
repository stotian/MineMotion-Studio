import { describe, expect, it } from "vitest";
import { sanitizeAudioClips } from "./AudioSerializer";

describe("AudioSerializer", () => {
  it("fills missing audio clip fields", () => {
    const [clip] = sanitizeAudioClips([
      {
        id: "clip_1",
        name: "Whoosh",
        startFrame: 10
      }
    ]);

    expect(clip.id).toBe("clip_1");
    expect(clip.volume).toBeGreaterThan(0);
    expect(clip.durationFrames).toBeGreaterThan(0);
    expect(clip.sourceKind).toBe("builtin-placeholder");
  });
});
