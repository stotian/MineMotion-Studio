import { describe, expect, it } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import { withAudioClipDefaults, sanitizeProjectAudio } from "./AudioSerializer";
import { clipGainAtFrame, estimateIntegratedLoudness } from "./AudioAnalysis";
import { buildAudioWaveform, MemoryAudioWaveformCache, getOrBuildWaveform } from "./AudioWaveform";
import { createAudioHandoffMetadata } from "./AudioHandoff";
import { importPhonemeCues } from "./AudioMarkers";

function clip() {
  return withAudioClipDefaults({
    id: "dialogue", name: "Dialogue", sourceKind: "imported", sourceName: "line.wav",
    dataUrl: "data:audio/wav;base64,AA==", mimeType: "audio/wav", startFrame: 10,
    durationFrames: 20, fadeInFrames: 5, fadeOutFrames: 5, volume: 1, role: "dialogue"
  });
}

describe("phase 28 audio synchronization", () => {
  it("migrates legacy audio and bounds editing fields", () => {
    const audio = sanitizeProjectAudio({ clips: [{ id: "legacy", name: "Legacy", volume: 99, pan: -99 }] });
    expect(audio.schemaVersion).toBe(2);
    expect(audio.clips[0]).toMatchObject({ volume: 2, pan: -1, role: "sfx", muted: false });
  });

  it("uses deterministic fade envelopes", () => {
    expect(clipGainAtFrame(clip(), 10)).toBe(0);
    expect(clipGainAtFrame(clip(), 15)).toBe(1);
    expect(clipGainAtFrame(clip(), 29)).toBeCloseTo(0.2);
  });

  it("builds and caches bounded waveforms", async () => {
    const samples = new Float32Array([0, 0.5, -1, 0.25, 0]);
    const waveform = await buildAudioWaveform([samples], 5, 16);
    expect(waveform.peak).toBe(1);
    expect(estimateIntegratedLoudness(waveform)).toBeLessThan(0);
    const cache = new MemoryAudioWaveformCache();
    const first = await getOrBuildWaveform(cache, "clip-hash", [samples], 5, 16);
    const second = await getOrBuildWaveform(cache, "clip-hash", [new Float32Array([0])], 5, 16);
    expect(second).toEqual(first);
  });

  it("imports phoneme cues and exports stem timing metadata", () => {
    const cues = importPhonemeCues("dialogue", "0.0 A 1\n0.25 M 0.8", 24);
    expect(cues.cues.map((cue) => cue.frame)).toEqual([0, 6]);
    const project = createInitialProject();
    project.audio.clips.push(clip());
    project.audio.lipSyncCues = cues.cues;
    const handoff = createAudioHandoffMetadata(project);
    expect(handoff.stems.find((stem) => stem.role === "dialogue")?.clipIds).toEqual(["dialogue"]);
    expect(handoff.lipSyncCues).toHaveLength(2);
  });
});
