import { describe, expect, it } from "vitest";
import { encodeWav } from "./WavEncoder";

describe("encodeWav", () => {
  it("writes a 16-bit PCM WAV header", async () => {
    const blob = encodeWav({
      sampleRate: 44100,
      channelData: [new Float32Array([0, 0.5, -0.5])]
    });
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(blob.type).toBe("audio/wav");
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...bytes.slice(8, 12))).toBe("WAVE");
    expect(String.fromCharCode(...bytes.slice(36, 40))).toBe("data");
  });
});
